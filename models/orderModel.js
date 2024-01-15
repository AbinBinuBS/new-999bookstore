const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    City: { type: String, required: true },
    District: { type: String, required: true },
    State: { type: String , required: true},
    Pincode: { type: Number , required: true}, 
});


const orderSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
    },
    items:[
        {
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        quantity:{
            type:String,
            required:true
        }
        
    }
    ],
    totalAmount:{
        type:Number,
        required:true
    } ,
    address: [addressSchema],
    paymentMethod:{
        type:String, 
        required:true
    },
    paymentStatus:{
        type:String,
        enum:['Pending','Success','Failed'],
        default:'Pending'
    },
    orderId:{
        type:String,
        required:true
    },

    Status:{
        type:String,
        enum:['Processing','Order Placed','Cancelled','Delivered','Return'],
        default:'Processing'
        
    },
    currentData:{
        type:Date,
        default:()=> Date.now()
    }
      
})

module.exports = mongoose.model('Order',orderSchema)