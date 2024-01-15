const express=require('express')
const app=express()
require("dotenv").config();
const mongoose=require('mongoose')
mongoose.connect(process.env.MONGO_URL)
const nocache = require('nocache')
const userRoute = require('./Router/userRouter')
const adminRoute =  require('./Router/adminRouter')
PORT = process.env.PORT || 4000


app.use(nocache())
app.use(express.json())
app.use(express.static('public'));
app.use('/',userRoute)
app.use('/admin',adminRoute)



app.listen(PORT,()=>{
    console.log("server is running at port 3000.....")
})