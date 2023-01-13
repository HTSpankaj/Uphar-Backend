//hello 
//const getPost=(req,res)=>{
    //res.send("hellradhe  from js");
//};
//module.exports={
   // getPost
//};


//this is a example of controller
const express=require("express");
const postController=require('../controllers/post');
//validation
const validator=require('../validator')
const router=express.Router();
router.get("/",postController.getPost);
//for front end
router.post("/post",validator.createPostValidator,postController.createPost);

module.exports=router;

//exports.getPost=(req,res)=>{
   // res.send("hellradhe  from js");
//};

//validation
//const validator=require('../validator')

