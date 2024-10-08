const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModal");
const Banner = require("../models/bannerModel");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const express = require("express");
const app = express();
const Razorpay = require("razorpay");
app.use(express.urlencoded({ extended: true }));
const nodemailer = require("nodemailer");
const session = require("express-session");

// =================password bcryption==================

var instance = new Razorpay({
  key_id: process.env.REZORPAY_ID_KEY,
  key_secret: process.env.REZORPAY_SECRET_KEY,
});

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// =================end of password bcryption==================

// =================for sending mail===========================

function generateOTP() {
  const otp = Math.floor(1000 + Math.random() * 9000);

  return otp.toString();
}
const generatedOTP = generateOTP();

const sendVerifyMail = async (data) => {
  let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USEREMAIL,
      pass: process.env.USERPASSWORD,
    },
  });

  let mailDetails = {
    from: "xyz@gmail.com",
    to: data,
    subject: `your otp is:${generatedOTP}`,
    text: "Your OTP for validation",
  };

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.log("Error Occurs");
    }
  });
};

// ==================end of sending mail========================

// =================user registration=======================

const registerLogin = async (req, res, next) => {
  try {
    res.render("register");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const insertUser = async (req, res, next) => {
  try {
    const Data = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      password1: req.body.password1,
    };
    req.session.Data = Data;

    const userEmail = await User.findOne({ email: req.body.email });
    if (userEmail) {
      res.render("register", { message: "email already exist.." });
    } else {
      const userPhone = await User.findOne({ phone: req.body.phone });
      if (userPhone) {
        res.render("register", { message: "phone number already exist.." });
      } else {
        if (Data.password === Data.password1) {
          sendVerifyMail(Data.email);
          res.render("registerOtp");
        } else {
          res.render("register", {
            message: "your registration has been failed..",
          });
        }
      }
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// =================end of user registration=======================

// ==================otp registration========================

const verifyOtp = async (req, res, next) => {
  try {
    const spassword = await securePassword(req.session.Data.password);
    const spassword1 = await securePassword(req.session.Data.password1);

    const { name, email, phone, password, password1 } = req.session.Data;

    const Otp = req.body.otp;

    if (generatedOTP === Otp) {
      const user = new User({
        name: name,
        email: email,
        phone: phone,
        password: spassword,
        is_admin: 0,
        password1: spassword1,
        wallet: 0,
      });
      const userData = await user.save();
      res.render("login", { message: "Otp verified..." });
    } else {
      res.render("registerOtp", { message: "wrong otp" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// ==================end of otp registration========================

// =================user login=======================

const userLogin = async (req, res, next) => {
  try {
    res.render("login");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_varified === 0) {
          res.render("login", { message: "invalid user...!" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/");
        }
      } else {
        res.render("login", { message: "password is incorrect" });
      }
    } else {
      res.render("login", { message: "email is incorrect" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// =================end of user login=======================

// ==================logout========================

const userLogout = async (req, res, next) => {
  try {
    delete req.session.user_id;
    req.session.save();
    res.redirect("/login");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// ======================end of logout=======================

// ======================Forget Password===================

const Loadforgotpassword = async (req, res, next) => {
  try {
    res.render("forgotpassword");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const userEmail = await User.findOne({ email: req.body.email });

    if (userEmail) {
      const Data = req.body.email;
      sendVerifyMail(Data);
      req.session.check = Data;
      res.status(200).json({ message: "Success" });
    } else {
      res.status(500).json({ message: "failed" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const loadForgetPasswordverifyOtp = async (req, res, next) => {
  try {
    if (req.session.check) {
      res.render("forgetpasswordOtp");
    } else {
      res.redirect("/forgotpassword");
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const ForgetPasswordresendOtp = async (req, res, next) => {
  try {
    let Data;
    if (req.session.Data) {
      Data = req.session.Data.email;
    } else if (req.session.check) {
      Data = req.session.check;
    }

    sendVerifyMail(Data);
    return res.status(200).json({ message: "succcess" });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const forgetPasswordverifyOtp = async (req, res, next) => {
  try {
    const Otp = req.body.otp;
    if (generatedOTP === Otp) {
      res.render("forgotpasswordcheck");
    } else {
      res.render("forgetpasswordOtp", { message: "wrong otp" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const forgotPasswordChech = async (req, res, next) => {
  try {
    const newPass = req.body.password;
    const confirmPass = req.body.password2;
    const email = req.session.check;
    if (newPass == confirmPass) {
      const spassword = await securePassword(newPass);
      const changePassword = await User.findOneAndUpdate(
        { email: email },
        { $set: { password: spassword } }
      );
      delete req.session.check;
      req.session.save();
      res.redirect("/login");
    } else {
      res.status(500).json({ message: "failed" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// ======================End of Forget Password===================

// =======================Home page==========================

const homePage = async (req, res, next) => {
  try {
    const bannerHome1 = await Banner.findOne({
      Name: "Banner for home page 1",
      is_active: 1,
    });
    const bannerHome2 = await Banner.findOne({
      Name: "Banner for home page 2",
      is_active: 1,
    });
    const activeCategories = await Category.find({ is_active: "1" }).limit(4);
    const activeCategoryIds = activeCategories.map((category) => category._id);
    const bestSeller = await Product.find({
      Category: { $in: activeCategoryIds },
    })
      .populate({
        path: "Category",
        match: { is_active: "1" },
        select: "-is_active",
      })
      .limit(8);

    const newProduct = await Product.find({
      Category: { $in: activeCategoryIds },
    })
      .populate({
        path: "Category",
        match: { is_active: "1" },
        select: "-is_active",
      })
      .sort({ currentDate: -1 })
      .limit(8);

      const dicountProduct = await Product.find({
        Category: { $in: activeCategoryIds },
      })
        .populate({
          path: "Category",
          match: { is_active: "1" },
          select: "-is_active",
        })
      .sort({ currentDate: -1 })
      .limit(8);

    const displayCategory = await Product.find({}).populate("Category");
    userData = await User.findById(req.session.user_id);
    if (userData) {
      if (userData.is_varified == 1) {
        res.render("home", {
          user: userData,
          newProduct: newProduct,
          bestSeller: bestSeller,
          dicountProduct: dicountProduct,
          displayCategory: displayCategory,
          activeCategories: activeCategories,
          bannerHome1: bannerHome1,
          bannerHome2: bannerHome2,
        });
      } else {
        delete req.session.user_id;
        req.session.save();
        res.redirect("/login");
      }
    } else {
      res.render("home", {
        user: userData,
        newProduct: newProduct,
        bestSeller: bestSeller,
        dicountProduct: dicountProduct,
        displayCategory: displayCategory,
        activeCategories: activeCategories,
        bannerHome1: bannerHome1,
        bannerHome2: bannerHome2,
      });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// =======================end of Home page==========================

// =======================Product page==============================

const productPage = async (req, res, next) => {
  try {
    const id = req.query.id || "";
    const productData = await Product.findOne({ _id: id }).populate("Category");
    const catId = productData.Category._id;

    const similarProducts = await Product.find({ Category: catId });
    const activeCat = await Category.find({ _id: catId, is_active: 1 });

    if (activeCat.length > 0) {
      const userData = await User.findById(req.session.user_id);
      if (userData) {
        if (userData && userData.is_varified === 1) {
          res.render("productDetails", {
            userData,
            product: productData,
            similarproduct: similarProducts,
          });
        } else {
          delete req.session.user_id;
          req.session.save();
          res.redirect("/login");
        }
      } else {
        res.render("productDetails", {
          userData,
          product: productData,
          similarproduct: similarProducts,
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// =======================end of Product page==============================

// =======================Book listing=============================

const showAllBooks = async (req, res, next) => {
  try {
    let sortQuery = {};

    switch (req.query.sortdata) {
      case "a-z":
        sortQuery = { productName: 1 };
        break;
      case "z-a":
        sortQuery = { productName: -1 };
        break;
      case "h-l":
        sortQuery = { salePrice: -1 };
        break;
      case "l-h":
        sortQuery = { salePrice: 1 };
        break;
      default:
        sortQuery = {};
        break;
    }

    let page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 9;
    const categoryId = req.query.id;
    const search = req.query.search || "";
    const max = parseFloat(req.query.max);
    const min = parseFloat(req.query.min);

    let filter = {};

    if (max && min) {
      filter.salePrice = { $gte: min, $lte: max };
    }

    if (categoryId) {
      filter.Category = categoryId;
    }

    if (search) {
      filter.productName = { $regex: ".*" + search + ".*", $options: "i" };
    }

    let productData = [];
    let count = 0;

    productData = await Product.find(filter)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    count = await Product.countDocuments(filter);

    const categoryData = await Category.find({ is_active: "1" });
    const userData = await User.findById(req.session.user_id);

    const totalPages = Math.ceil(count / limit);
    const currentPage = page;

    res.render("productListing", {
      categoryData,
      productData,
      userData,
      search,
      min,
      max,
      categoryId,
      sortdata: req.query.sortdata,
      totalPages,
      currentPage,
    });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

module.exports = { showAllBooks };

// ===============================end of blk listing===============================

// =====================================Cart=======================================

const cartManagement = async (req, res, next) => {
  try {
    const CartData = await Cart.findOne({
      userId: req.session.user_id,
    }).populate("product.productId");

    if (CartData) {
      res.render("cart", { CartData: CartData });
    } else {
      res.render("cart", { CartData: CartData });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const cartManagementAddtocart = async (req, res, next) => {
  try {
    const CartData = await Cart.findOne({
      userId: req.session.user_id,
    }).populate("product.productId");
    const hai = req.body.hai;
    const id = req.query.id;
    const userId = req.session.user_id;
    qty = req.query.qty;
    const userData = await User.findById(userId);
    const productData = await Product.findById(id);
    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      if (productData.Quantity >= qty) {
        cart = new Cart({
          userId: userId,
          product: [
            {
              productId: productData._id,
              Quantity: 1 * qty,
            },
          ],
        });
      } else {
        return res.status(400).json({ message: "Out of stock" });
      }
    } else {
      const cartProductIndex = cart.product.findIndex(
        (item) => item.productId.toString() === id
      );
      if (cartProductIndex !== -1) {
        let cartDatas = await Cart.findOne(
          { userId: userId, "product.productId": id },
          { "product.$": 1, _id: 0 }
        );
        const specificProduct = cartDatas.product[0];

        const totalQuantity =
          parseInt(specificProduct.Quantity) + parseInt(qty);
        if (productData.Quantity >= specificProduct.Quantity + parseInt(qty)) {
          cart.product[cartProductIndex].Quantity += 1 * qty;
        } else {
          return res.status(400).json({ message: "Out of stock" });
        }
      } else {
        let cartDatas = await Cart.findOne(
          { userId: userId, "product.productId": id },
          { "product.$": 1, _id: 0 }
        );

        if (productData.Quantity >= qty) {
          cart.product.push({
            productId: productData._id,
            Quantity: 1 * qty,
          });
        } else {
          return res.status(400).json({ message: "Out of stock" });
        }
      }
    }

    await cart.save();
    res.redirect("/cart");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const addToCart = async (req, res, next) => {
  try {
    const id = req.query.id;
    const userId = req.session.user_id;

    const userData = await User.findById(userId);
    const productData = await Product.findById(id);

    let cart = await Cart.findOne({ userId: userId });
    if (productData.Quantity == 0) {
      return res.status(400).json({ message: "Out of stock" });
    } else {
      if (!cart) {
        cart = new Cart({
          userId: userId,
          product: [
            {
              productId: productData._id,
              Quantity: 1,
            },
          ],
        });
      } else {
        const cartProductIndex = cart.product.findIndex(
          (item) => item.productId.toString() === id
        );
        if (cartProductIndex !== -1) {
          let cartDatas = await Cart.findOne(
            { userId: userId, "product.productId": id },
            { "product.$": 1, _id: 0 }
          );
          let specificProduct = cartDatas.product[0];
          if (productData.Quantity > specificProduct.Quantity) {
            cart.product[cartProductIndex].Quantity += 1;
            await cart.save();
            return res
              .status(200)
              .json({ message: "Quantity updated successfully", cart });
          } else {
            return res.status(400).json({ message: "Out of stock" });
          }
        } else {
          cart.product.push({
            productId: productData._id,
            Quantity: 1,
          });
        }
      }
    }
    await cart.save();
    return res.status(200).json({ message: "added to cart" });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const quantityCheck = async (req, res, next) => {
  const userId = req.session.user_id;
  const id = req.query.id;
  const action = req.query.action;

  try {
    let cart = await Cart.findOne({ userId: userId });
    let cartData = await Cart.findOne(
      { userId: userId, "product.productId": id },
      { "product.$": 1, _id: 0 }
    );
    let specificProduct = cartData.product[0];

    let productData = await Product.findOne({ _id: id });
    if (action === "increase" || action === "decrease") {
      const cartProductIndex = cart.product.findIndex(
        (item) => item.productId.toString() === id
      );
      if (cartProductIndex !== -1) {
        if (action === "increase") {
          if (productData.Quantity > specificProduct.Quantity) {
            cart.product[cartProductIndex].Quantity += 1;
            await cart.save();
            return res
              .status(200)
              .json({ message: "Quantity updated successfully", cart });
          } else {
            return res.status(400).json({ message: "Out of stock" });
          }
        } else {
          if (cart.product[cartProductIndex].Quantity > 0) {
            cart.product[cartProductIndex].Quantity -= 1;
          } else {
            return res
              .status(400)
              .json({ message: "Quantity cannot be less than zero" });
          }
        }
        await cart.save();
        return res
          .status(200)
          .json({ message: "Quantity updated successfully", cart });
      } else {
        return res
          .status(404)
          .json({ message: "Product not found in the cart" });
      }
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const deleteCartitem = async (req, res, next) => {
  try {
    const userid = req.session.user_id;
    const productid = req.query.id;
    const removeCart = await Cart.updateOne(
      { userId: userid },
      { $pull: { product: { productId: productid } } }
    );

    if (removeCart.modifiedCount > 0) {
      res.redirect("/cart");
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// ==================================End of Cart=====================================

// ===========================check out=============================
const qtycheck = async (req, res, next) => {
  try {
    const id = req.session.user_id;
    const cartData = await Cart.findOne({ userId: id });

    if (cartData) {
      for (const cartItem of cartData.product) {
        const productId = cartItem.productId;
        const productData = await Product.findById(productId);
        if (productData) {
          const cartQuantity = cartItem.Quantity;
          const availableQuantity = productData.Quantity;

          if (cartQuantity > availableQuantity) {
            return res
              .status(200)
              .json({ product: productData.productName, message: "failed" });
          } else {
            res.status(200).json({ message: "Success" });
          }
        }
      }
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const checkoutOrder = async (req, res, next) => {
  try {
    id = req.session.user_id;
    const user = await User.findById({ _id: id });
    const userData = await User.findById(id, { address: 1, _id: 0 });
    const CartData = await Cart.findOne({
      userId: req.session.user_id,
    }).populate("product.productId");
    const couponData = await Coupon.find({ is_active: 1 });
    res.render("checkout", {
      userData: userData,
      cartData: CartData,
      couponData: couponData,
      user: user,
    });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const applycoupons = async (req, res, next) => {
  try {
    const id = req.session.user_id;
    const userData = await User.findById(id);
    const couponcode = req.body.couponcode;
    const amount = req.body.totalAmount;
    const couponData = await Coupon.findOne({
      couponCode: couponcode,
      is_active: 1,
    });

    let count = 0;
    for (let redeemUser of couponData.redeemUser) {
      if (redeemUser.userId.equals(userData._id)) {
        count++;
      }
    }

    if (couponData.minPurchase <= amount) {
      if (count < couponData.Limit) {
        return res.status(200).json({
          message: "Success",
          Discount: couponData.Discount,
          couponCode: couponcode,
        });
      } else {
        return res.status(400).json({ message: "Coupon limit exceeded" });
      }
    } else {
      return res
        .status(403)
        .json({ message: "Coupon is not applicable for this product" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};
const pushingCoupon = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const couponName = req.body.couponData;
    const updatedCoupon = await Coupon.findOneAndUpdate(
      { couponCode: couponName },
      { $push: { redeemUser: { userId: userId } } },
      { new: true }
    );
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const checkoutaddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const addressDetails = {
      firstName: req.body.fname,
      lastName: req.body.lname,
      City: req.body.city,
      District: req.body.district,
      State: req.body.state,
      Pincode: req.body.pincode,
    };
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.address.push(addressDetails);

    await user.save();

    res.redirect("/checkout");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

function generateUniqueNumber() {
  const digits = [];
  while (digits.length < 8) {
    const digit = Math.floor(Math.random() * 10);
    if (!digits.includes(digit)) {
      digits.push(digit);
    }
  }
  return digits.join("");
}

const uniqueNumber = generateUniqueNumber();

const onlinePay = async (req, res) => {
  try {
    const id = req.session.user_id;
    const cartData = await Cart.findOne({ userId: id });

    if (cartData) {
      for (const cartItem of cartData.product) {
        const productId = cartItem.productId;
        const productData = await Product.findById(productId);
        if (productData) {
          const cartQuantity = cartItem.Quantity;
          const availableQuantity = productData.Quantity;

          if (cartQuantity > availableQuantity) {
            return res.status(200).json({ product: productData.productName });
          }
        }
      }
    }

    var options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
    };
    instance.orders.create(options, function (err, order) {
      let razorOrderId = order;
      let paymentStatus = order.status;
      res
        .status(200)
        .json({
          message: "Order placed successfully.",
          razorOrderId,
          paymentStatus,
        });
    });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const paymentManagement = async (req, res, next) => {
  try {
    id = req.session.user_id;
    totalAmount = req.body.totalAmount;
    payment = req.body.paymentMethod;
    const userData = await User.findById({ _id: id });
    const addressAtIndex = userData.address[req.body.address];
    const address = {
      firstName: addressAtIndex.firstName,
      lastName: addressAtIndex.lastName,
      Country: addressAtIndex.Country,
      City: addressAtIndex.City,
      District: addressAtIndex.District,
      State: addressAtIndex.State,
      Pincode: addressAtIndex.Pincode,
    };
    const cartData = await Cart.findOne({ userId: id });

    if (cartData) {
      for (const cartItem of cartData.product) {
        const productId = cartItem.productId;
        const productData = await Product.findById(productId);
        if (productData) {
          const cartQuantity = cartItem.Quantity;
          const availableQuantity = productData.Quantity;

          if (cartQuantity > availableQuantity) {
            return res
              .status(200)
              .json({
                product: productData.productName,
                message: "Out of stock",
              });
          }
        }
      }
    }

    const productDetails = [];

    if (cartData && cartData.product) {
      cartData.product.forEach((item) => {
        const { productId, Quantity } = item;
        const product = { productId, Quantity, quantity: Quantity };
        productDetails.push(product);
      });
    }
    if (payment == "Cash on delevery") {
      const order = new Order({
        userId: id,
        items: productDetails,
        totalAmount: totalAmount,
        paymentMethod: payment,
        address: address,
        orderId: uniqueNumber,
      });
      await order.save();
    } else {
      const order = new Order({
        userId: id,
        items: productDetails,
        totalAmount: totalAmount,
        paymentMethod: payment,
        address: address,
        orderId: uniqueNumber,
        paymentStatus: "Success",
      });
      await order.save();
    }

    if (cartData && cartData.product) {
      for (const item of cartData.product) {
        const productData = item.productId;
        const Quantity = item.Quantity;
        const product = await Product.findById(productData);

        if (product && product.Quantity > 0) {
          await Product.findOneAndUpdate(
            { _id: productData, Quantity: { $gt: 0 } },
            { $inc: { Quantity: -1 * Quantity } }
          );
        }
      }
    }
    const deleteCart = await Cart.deleteOne({ userId: id });
    res.status(200).json({ message: "Order placed successfully" });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const walletPayment = async (req, res, next) => {
  try {
    id = req.session.user_id;
    const userData = await User.findById({ _id: id });
    const cartData = await Cart.findOne({ userId: id });
    if (cartData) {
      for (const cartItem of cartData.product) {
        const productId = cartItem.productId;
        const productData = await Product.findById(productId);
        if (productData) {
          const cartQuantity = cartItem.Quantity;
          const availableQuantity = productData.Quantity;

          if (cartQuantity > availableQuantity) {
            return res
              .status(200)
              .json({
                product: productData.productName,
                message: "Out of stock",
              });
          } else {
            const totalAmount = req.body.amount;
            if (userData.wallet >= totalAmount) {
              const addToWallet = await User.findOneAndUpdate(
                { _id: id },
                { $inc: { wallet: -totalAmount } }
              );
              res.status(200).json({ message: "success" });
            } else {
              res.status(200).json({ message: "failed" });
            }
          }
        }
      }
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const showeditaddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const index = req.query.index;

    const user = await User.findById(userId);
    const userAddress = user ? user.address[index] : null;
    res.render("editAddress", { userAddress, index: index });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const editaddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const index = req.body.index;
    const user = await User.findById(userId);
    if (user) {
      const userAddress = user.address[index];
      if (userAddress) {
        userAddress.firstName = req.body.fname;
        userAddress.lastName = req.body.lname;
        userAddress.City = req.body.city;
        userAddress.District = req.body.district;
        userAddress.State = req.body.state;
        userAddress.Pincode = req.body.pincode;
        await user.save();
      }
    }

    res.redirect("/account");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const index = req.query.index;
    const user = await User.findById(userId);
    if (user) {
      const userAddress = user.address[index];
      if (userAddress) {
        const deleteAdress = await User.updateOne(
          { _id: userId },
          { $pull: { address: userAddress } }
        );
        res.redirect("/account");
      }
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const addaddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const addressDetails = {
      firstName: req.body.fname,
      lastName: req.body.lname,
      City: req.body.city,
      District: req.body.district,
      State: req.body.state,
      Pincode: req.body.pincode,
    };
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.address.push(addressDetails);

    await user.save();

    res.redirect("/account");
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// =========================== end of check out=============================

// ===============================user Account=============================

const accountManagment = async (req, res, next) => {
  try {
    id = req.session.user_id;
    const userData = await User.findById({ _id: id });
    const orderData = await Order.find({ userId: id }).sort({
      currentData: -1,
    });

    res.render("Account", { userData: userData, orderData: orderData });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const cancerlOrReturn = async (req, res, next) => {
  try {
    id = req.query.id;
    const orderData = await Order.findById({ _id: id }).populate(
      "items.productId"
    );
    const cartid = res.render("cancelOrder", { orderData: orderData });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    id = req.session.user_id;
    const order = await Order.findById({ _id: req.body.orderId });
    if (order.Status === "Delivered") {
      const orderData = await Order.findOneAndUpdate(
        { _id: req.body.orderId },
        { $set: { Status: "Return" } }
      );
      if (orderData) {
        for (const item of orderData.items) {
          try {
            const editQuantity = await Product.findOneAndUpdate(
              { _id: item.productId },
              { $inc: { Quantity: 1 * item.quantity } }
            );
          } catch (error) {
            console.error("Error updating quantity:", error);
          }
        }
      }
      const addToWallet = await User.findOneAndUpdate(
        { _id: id },
        { $inc: { wallet: orderData.totalAmount } }
      );

      res.redirect("/account");
    } else {
      const orderData = await Order.findOneAndUpdate(
        { _id: req.body.orderId },
        { $set: { Status: "Cancelled" } }
      );
      if (orderData) {
        for (const item of orderData.items) {
          try {
            const editQuantity = await Product.findOneAndUpdate(
              { _id: item.productId },
              { $inc: { Quantity: 1 * item.quantity } }
            );
          } catch (error) {
            console.error("Error updating quantity:", error);
          }
        }
      }
      if (orderData.paymentMethod !== "Cash on delevery") {
        const addToWallet = await User.findOneAndUpdate(
          { _id: id },
          { $inc: { wallet: orderData.totalAmount } }
        );
      }

      res.redirect("/account");
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const profileEdit = async (req, res, next) => {
  try {
    const id = req.session.user_id;
    const { name, email, phone } = req.query;
    const existEmail = await User.findOne({ _id: { $ne: id }, email: email });
    if (!existEmail) {
      const existMobile = await User.findOne({
        _id: { $ne: id },
        phone: phone,
      });
      if (!existMobile) {
        const userData = await User.findOneAndUpdate(
          { _id: id },
          { $set: { name: name, email: email, phone: phone } },
          { new: true }
        );
        res.redirect("/account");
      } else {
        let Phone = "Phone number already exists...!";
        return res.status(400).json(Phone);
      }
    } else {
      const Email = "Email already exists...!";
      return res.status(400).json(Email);
    }
  } catch (error) {
    next(new Error("An error occurred"));
    res.status(500).send("Internal Server Error");
  }
};

const changePassword = async (req, res, next) => {
  try {
    id = req.session.user_id;
    const oldPassword = req.query.currentPassword;
    const newPassword = req.query.newPassword;
    const userData = await User.findById({ _id: id });
    const passwordMatch = await bcrypt.compare(oldPassword, userData.password);
    if (passwordMatch) {
      const spassword = await securePassword(newPassword);
      const changePassword = await User.findOneAndUpdate(
        { _id: id },
        { $set: { password: spassword } }
      );
      res.redirect("/account");
    } else {
      return res.status(400).json({ message: "Password is not matching...!" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

// =================================end of user Account========================

module.exports = {
  registerLogin,
  insertUser,
  verifyOtp,
  userLogin,
  verifyLogin,
  userLogout,
  Loadforgotpassword,
  forgetPassword,
  forgetPasswordverifyOtp,
  loadForgetPasswordverifyOtp,
  forgotPasswordChech,
  ForgetPasswordresendOtp,
  homePage,
  productPage,
  showAllBooks,
  cartManagement,
  cartManagementAddtocart,
  addToCart,
  deleteCartitem,
  quantityCheck,
  qtycheck,
  checkoutOrder,
  applycoupons,
  pushingCoupon,
  checkoutaddress,
  showeditaddress,
  editaddress,
  deleteAddress,
  addaddress,
  paymentManagement,
  onlinePay,
  walletPayment,
  accountManagment,
  cancerlOrReturn,
  cancelOrder,
  profileEdit,
  changePassword,
};
