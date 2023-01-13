const mongoose=require('mongoose')
 const postSchema=new mongoose.Schema({
email:{
     type:String,
     required:"true",
    // minlength: 4,
    // maxlength:150
},
password:{
    type:String,
     required:"true",
    // minlength: 4,
    // maxlength:2000
    
}

 });
 module.exports=mongoose.model("Post",postSchema);
 