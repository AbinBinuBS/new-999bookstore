const mongoose = require('mongoose')

const bannerSchema =  mongoose.Schema({
    Name:{
        type:String,
        required:true
    },
    Text:{
        type:String,
        required:true
    },
    Image:{
        type:Array,
        required:true
    },
    Target:{
        type:String,
        required:true
    },
    is_active:{
        type:String,
        default:1
    },
    expiryDate:{
        type:Date,
        required:true
    }
    
})

module.exports = mongoose.model('Banner',bannerSchema)