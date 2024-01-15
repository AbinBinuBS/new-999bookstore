const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    Author:{
        type:String,
        required:true
    },
    Category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:true
    },
    Description:{
        type:String,
        required:true
    },
    productPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:true
    },
    Quantity:{
        type:Number,
        required:true
    },
    Image:{
        type:Array,
        required:true
    },
    Publisher:{
        type:String,
        required:true
    },
    Pages:{
        type:String,
        required:true
    },
    Country:{
        type:String,
        required:true
    },
    aboutAuthor:{
        type:String,
        required:true
    },
    bookWeight:{
        type:String,
        required:true
    },
    currentDate:{
        type:Number,
        default:()=> Date.now()
    },is_active:{
        type:String,
        default:1
    }
})

module.exports = mongoose.model('product',productSchema)