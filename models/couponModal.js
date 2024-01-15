const mongoose = require('mongoose')


const couponSchema = mongoose.Schema({
    couponCode:{
        type:String,
        required:true
    },
    is_active:{
        type:String,
        default:1
    },
    Discount:{
        type:Number,
        require:true
    },
    expiryDate:{
        type:Date,
        require:true
    },
    Limit:{
        type:Number,
        require:true
    },
    minPurchase:{
        type:Number,
        require:true
    },
    redeemUser:[{
        userId:{
            type:mongoose.Schema.Types.ObjectId
        }
    }]


})

module.exports = mongoose.model('Coupon',couponSchema)
