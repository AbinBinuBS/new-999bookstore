const express=require('express')
const user_route=express()
const bodyparser=require('body-parser')
user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}))

const session = require('express-session')
const config = require('../config/config')
const auth = require('../middileware/auth')
const path = require ('path')
const userController = require('../controllers/userCountroller')

user_route.set('view engine','ejs')
user_route.set('views','./views/user')

user_route.use(session({secret:config.sessionSecret}))


user_route.use(express.static('public'))





user_route.get('/',auth.isLogout,userController.userLogin)
user_route.post('/',auth.isLogout,userController.verifyLogin)

user_route.get('/logout',auth.isLogin,userController.userLogout)


user_route.get('/register',auth.isLogout,userController.registerLogin)
user_route.post('/register',auth.isLogout,userController.insertUser)

// user_route.get('/getOtp',userController.getOtp)
user_route.post('/verifyOtp',auth.isLogout,userController.verifyOtp)
user_route.get('/forgotpassword',auth.isLogout,userController.Loadforgotpassword)
user_route.post('/forgotpassword',auth.isLogout,userController.forgetPassword)
user_route.get('/forgetPasswordverifyOtp',auth.isLogout,userController.loadForgetPasswordverifyOtp)
user_route.post('/forgetPasswordverifyOtp',auth.isLogout,userController.forgetPasswordverifyOtp)
user_route.post('/forgotPasswordChech',auth.isLogout,userController.forgotPasswordChech)
user_route.post('/resendOtp',auth.isLogout,userController.ForgetPasswordresendOtp)
user_route.get('/home',userController.homePage)
user_route.get('/product',userController.productPage)

// user_route.get('/productList',userController.productListing)
user_route.get('/bookList',userController.showAllBooks)

user_route.get('/cart',auth.isLogin,userController.cartManagement)
user_route.get('/addtocart',auth.isLogin,userController.addToCart)
user_route.post('/cart',auth.isLogin,userController.cartManagementAddtocart)

user_route.get('/deleteCartitem',auth.isLogin,userController.deleteCartitem)
user_route.get('/quantitymanagement',auth.isLogin,userController.quantityCheck)

user_route.get('/qtycheck',auth.isLogin,userController.qtycheck)
user_route.get('/checkout',auth.isLogin,userController.checkoutOrder)
user_route.post('/checkout',auth.isLogin,userController.checkoutaddress)
user_route.post('/applycoupon',auth.isLogin,userController.applycoupons)
user_route.post('/couponCheck',auth.isLogin,userController.pushingCoupon)
user_route.post('/onlinepayment',auth.isLogin,userController.onlinePay)
user_route.post('/walletpayment',auth.isLogin,userController. walletPayment)
user_route.post('/proceedtoPayment',auth.isLogin,auth.isLogin,userController.paymentManagement)
user_route.get('/account',auth.isLogin,userController.accountManagment)
user_route.get('/orderstatus',auth.isLogin,userController.cancerlOrReturn)
user_route.post('/orderstatus',auth.isLogin,userController.cancelOrder)
user_route.get('/editAddress',auth.isLogin,userController.showeditaddress)
user_route.post('/editAddress',auth.isLogin,userController.editaddress)
user_route.get('/editProfile',auth.isLogin,userController.profileEdit)
user_route.post('/addaddress',auth.isLogin,userController.addaddress)
user_route.post('/changePassword',auth.isLogin,userController.changePassword)
user_route.get('/deleteAddress',auth.isLogin,userController.deleteAddress)

user_route.get('/hello',userController.hai)





module.exports = user_route;