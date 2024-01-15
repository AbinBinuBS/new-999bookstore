const express = require("express");
const app = express();
require("dotenv").config();
<<<<<<< HEAD
const mongoose=require('mongoose')
mongoose.connect(process.env.MONGO_URL)
const nocache = require('nocache')
const userRoute = require('./Router/userRouter')
const adminRoute =  require('./Router/adminRouter')
const errorHandler = require('./helpers/errorHandler');
PORT = process.env.PORT || 4000

app.set('view engine','ejs')
app.use(nocache())
app.use(express.json())
app.use(express.static('public'));
app.use('/',userRoute)
app.use('/admin',adminRoute)
app.use('*',(req,res)=>{
    res.render('admin/404page')
})
app.use(errorHandler.errorHandler);



app.listen(PORT,()=>{
    console.log("server is running at port 3000.....")
})
=======
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URL);
const nocache = require("nocache");
const userRoute = require("./Router/userRouter");
const adminRoute = require("./Router/adminRouter");
PORT = process.env.PORT || 4000;

app.use(nocache());
app.use(express.json());

app.use(express.static("public"));
app.use("/admin", adminRoute);
app.use("/", userRoute);


app.listen(PORT, () => {
  console.log("server is running at port 3000.....");
});
>>>>>>> fc8eab72c714a5c12b7a73c2d7c60a5b33ce4805
