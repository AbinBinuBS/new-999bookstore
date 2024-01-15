const mongoose =  require('mongoose')


const addressSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    City: { type: String, required: true },
    District: { type: String, required: true },
    State: { type: String , required: true},
    Pincode: { type: Number , required: true}, 
});

const userSchema = mongoose.Schema({
   
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    dob:{
        type:String,
        required:false
    },
    city:{
        type:String,
        required:false
    },
    pincode:{
        type:String,
        required:false
    },
    altphone:{
        type:String,
        required:false
    },
    password:{
        type:String,
        required:true
    },
    password1:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_varified:{
        type:Number,
        default:1
    },
    Otp:{
        type:String,
        required:false
    },
    wallet:{
        type:Number,
        require:true
    },
    address: [addressSchema],
    currentDate:{
        type:Number,
        default:()=> Date.now()
    }
})


module.exports = mongoose.model('User',userSchema)