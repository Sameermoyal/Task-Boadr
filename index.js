const express =require('express')
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const secret_key="ghgjhb hbjjv hbjv jh"

 const PORT =3000
 const app=express()
 
app.use(cors())
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
 const taskSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    title:{
        type:String,
        default:""
    }
 })

 const listSchema =mongoose.Schema({
    taskId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'task',
        required:true
    },
    
    descriptionList:{
        type:Array,
        default:[]
    },

 })

 const userModel=mongoose.model('user',userSchema)
const taskModel=mongoose.model('task',taskSchema)
const listModel=mongoose.model('list',listSchema)

app.use(express.json())
app.use(express.urlencoded())
app.use(cors())
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
    if(!user){
        res.status(400).json({message:"user not register"})
    }
    console.log('>user>>>>',user)
    const dbPassword=user.password
   const match=await bcrypt.compare(password,dbPassword)
     
  if(!match){
    res.status(400).json({message:"password invalid"})
 }
  const token =jwt.sign({id:user._id},secret_key,{expiresIn:'1h'})
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



app.get('/getAll',verifyToken,async(req,res)=>{
    try{
   
      const userPopulate=await taskModel.find().populate('userId');


   res.status(200).json({message:" get All",listPopulate})
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
        if (!title || !Array.isArray(descriptionList)) {
            return res.status(400).json({ message: "Invalid request data" });
        }
        const task=await new taskModel({userId,title}).save()
        const list=await new listModel({descriptionList,taskId: task._id }).save()
        res.status(200).json({message:" create successfully ", task,
            list,})
    }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})



app.patch('/add',verifyToken,async(req,res)=>{
    try{
        const id=req.user.id
        console.log("id>>>>>",id)
        const existingTask=await taskModel.findOne({userId:id})
        if(!existingTask){
           return res.status(400).json({message:"not present existing task"})
        }
        const existingList=await listModel.findOne({taskId:existingTask._id})
        console.log("existingList>>>>>>",existingList)
        
        const{title,descriptionList}=req.body
        const updateTask=await taskModel.findByIdAndUpdate(existingTask._id,{title})
        const updateList=await listModel.findByIdAndUpdate(existingList._id,{descriptionList})
        
     res.status(200).json({message:" update successfully ",updateTask,updateList})
      }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})

app.patch('/dndAdd',verifyToken,async(req,res)=>{
    try{
        const id=req.user.id
       const{dropIds,dragIds}= req.body
       console.log("dropIds : ",dropIds," dragIds : ",dragIds)
     
       const existingDropList=await listModel.findOne({_id:dropIds.dropListId})
        if(!existingDropList){
           return res.status(400).json({message:"not present existing task"})
        }
       
        const existingDragList=await listModel.findOne({_id:dragIds.listId})
        console.log("existingDragList>>>>>>",existingDragList)
        const arrIndex=dragIds.descItem; 
       const preData=existingDropList.descriptionList
        const updateDropData=[...preData,existingDragList.descriptionList[arrIndex]] 
        const updateDropList=await listModel.findByIdAndUpdate(existingDropList._id,{descriptionList:updateDropData})
          //   { dropListId,dropTaskId} =dropIds ;
        //   { descItem,listId, taskId}=dragIds ;
        const preDragData=existingDragList.descriptionList
        console.log("preDragData : ",preDragData)
        const updatedDragData=[]
        for(let i=0;i<preDragData.length;i++){
            if(i != arrIndex){
                updatedDragData.push(preDragData[i])
            }
        }
        console.log("updatedDragData",updatedDragData)
        const updateDragList=await listModel.findByIdAndUpdate(existingDragList._id,{descriptionList:updatedDragData})
        const listPopulate =await listModel.find().populate({ path:'taskId',
            populate:{
                path:'userId',
                model:'user'
            }
        })
        console.log("success>>>>>")
        res.status(200).json({message:" update successfully ",listPopulate})
      }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})
app.delete('/deleteTask/:taskId',verifyToken,async(req,res)=>{
    try{
        const id=req.user.id
        const {taskId}=req.params
        console.log("req.params",req.params)
        const existingTask=await taskModel.findOne({_id:taskId})
        const updateTask=await taskModel.findByIdAndDelete(existingTask._id)
       
        const existingList=await listModel.findOne({taskId:existingTask._id})
        const updateList=await listModel.findByIdAndDelete(existingList._id)
         console.log("successfully delete : updateList ",updateList,"updateTask ",updateTask)

     res.status(200).json({message:" delete successfully ",updateList,updateTask})
      }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})
app.delete('/delete',verifyToken,async(req,res)=>{
    try{
        const id=req.user.id
        console.log("id>>>>>",id)
        const existingTask=await taskModel.findOne({userId:id})
        const updateTask=await taskModel.findByIdAndDelete(existingTask._id)
       
        const existingList=await listModel.findOne({taskId:existingTask._id})
        const updateList=await listModel.findByIdAndDelete(existingList._id)
        
     res.status(200).json({message:" delete successfully ",updateList,updateTask})
      }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})
app.patch('/add',verifyToken,async(req,res)=>{
    try{
        const id=req.user.id
        console.log("id>>>>>",id)
        const existingList=await taskModel.findOne({userId:id})
        console.log("existingList>>>>>>",existingList)
        
        const{title,descriptionList}=req.body
        const updateList=await taskModel.findByIdAndUpdate(existingList._id,{title,descriptionList})
     res.status(200).json({message:" update successfully ",updateList})
      }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})
app.delete('/delete',verifyToken,async(req,res)=>{
    try{
        const id=req.user.id
        console.log("id>>>>>",id)
        const existingList=await taskModel.findOne({userId:id})
        console.log("existingList>>>>>>",existingList)
        
      
        const updateList=await taskModel.findByIdAndDelete(existingList._id)
     res.status(200).json({message:" delete successfully ",updateList})
      }catch(error){
          res.status(500).json({message:"error to create",error:error.message})
      }
})






 mongoose.connect('mongodb://localhost:27017/task-board')
.then(()=>console.log("mongodb connected")).catch((error)=>console.log("errror to connect in mongo",error))
 
app.listen(PORT,()=>{
    console.log("server is running this port ",PORT)
 })
