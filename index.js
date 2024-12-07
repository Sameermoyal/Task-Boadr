const express =require('express')
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const secret_key="ghgjhb hbjjv hbjv jh"

 const PORT =3000
 const app=express()
 const userSchema =mongoose.Schema({
    id:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
 })

 const listSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    title:{
        type:String,
    },
    descriptionList:{
        type:Array,
        default:[]
    },

 })

 const userModel=mongoose.model('user',userSchema)
const taskModel=mongoose.model('task',listSchema)
app.use(express.json())
app.use(express.urlencoded())
app.post('/signup',async(req,res)=>{
  try{
    const{id,password}=req.body;
   const salt=bcrypt.genSaltSync(10)
   const hashPassword=await bcrypt.hashSync(password,salt)

  const user=  await new userModel({id,password:hashPassword}).save()

  res.status(200).json({message:"successfully signup",user})

  }catch(error){
    res.status(500).json({message:"internal server error",error})
  }    
})
app.post('/login',async(req,res)=>{
  try{
    const{id,password}=req.body;
    const user =await userModel.findOne({id})
    console.log('>user>>>>',user)
    const dbPassword=user.password
   const match=await bcrypt.compare(password,dbPassword)
     
  if(!match){
    res.status(400).json({message:"password invalid"})
 }
  const token =jwt.sign({id:user.id},secret_key,{expiresIn:'1h'})
   res.status(200).json({message:"successfully signup",token})

  }catch(error){
    res.status(500).json({message:"internal server error",error})
  }    
})

const verifyToken=async(req,res,next)=>{
    try{
        const splittoken=req.headers.authorization?.split(" ")[1];
    if(!splittoken){
        return  res.status(400).json({message:"token invalid"})
    }
    const decode =jwt.verify(splittoken,secret_key)
    if(!decode){
        return  res.status(400).json({message:"token not verify"})
    }
    req.user=decode
    next();
    // res.status(200).json({message:"token verify"})
     
    }catch(error){
        res.status(500).json({message:"error to token verify",error:error.message})
    }
}



app.get('/',verifyToken,async(req,res)=>{
    try{
   
      const userPopulate=await taskModel.find().populate('userId');


   res.status(200).json({message:" get All",userPopulate})
    }catch(error){
        res.status(500).json({message:"error to getAll",error:error.message})
    }
})


app.post('/create',verifyToken,async(req,res)=>{
    try{
        const id=req.user.id
        const user=await userModel.findOne({id})
        const userId=user._id
       console.log(">>>>>>>user in create ",userId)
        
        const{title,descriptionList}=req.body
        const task=await new taskModel({userId,title,descriptionList}).save()

        
     
     res.status(200).json({message:" create successfully ",})
      }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})






 mongoose.connect('mongodb://localhost:27017/task-board')
.then(()=>console.log("mongodb connected")).catch((error)=>console.log("errror to connect in mongo",error))
 
app.listen(PORT,()=>{
    console.log("server is running this port ",PORT)
 })
