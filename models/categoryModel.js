const mongoose = require('mongoose')


const categorySchema = mongoose.Schema({
    Name:{
        type:String,
        require:true
    },
    Image:{
        type:String,
        require:true
    },
    is_active:{
        type:String,
        default:1
    }
})

module.exports = mongoose.model('Category',categorySchema)
