const mongoose = require('mongoose')

const cartSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    product:[
        {
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        Quantity:{
            type:Number,
            required:true
        }
        
    }

    ]

    
})

module.exports = mongoose.model('Cart',cartSchema)