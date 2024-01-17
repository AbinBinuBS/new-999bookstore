const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModal");
const Banner = require("../models/bannerModel");
const dashboardHealpert = require("../helpers/dashboardHelper");
const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const sharp = require("sharp");
app.use(express.urlencoded({ extended: true }));

const adminLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 1) {
          req.session.admin = userData._id;
          res.redirect("/admin/dashboard");
        } else {
          res.render("login", { message: "invalid user..." });
        }
      } else {
        res.render("login", { message: "invalid user..." });
      }
    } else {
      res.render("login", { message: "invalid user..." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    let arrayforUser = [];
    let arrayforOrder = [];
    let arrayforStatus = [];
    const monthlyUserCounts = await dashboardHealpert.getMonthlyUserCount();
    monthlyUserCounts.forEach((monthData) => {
      const { month, count } = monthData;
      arrayforUser.push(count);
    });
    const monthlyOrderCounts = await dashboardHealpert.getMonthlyOrderDetails();
    monthlyOrderCounts.forEach((monthData) => {
      const { month, count } = monthData;
      arrayforOrder.push(count);
    });
    const statuspersantage =
      await dashboardHealpert.getOrderStatusPercentages();

    statuspersantage.forEach((monthData) => {
      const { status, percentage } = monthData;
      arrayforStatus.push(percentage);
    });
    const roundedArray = arrayforStatus.map((number) =>
      Number(number.toFixed(2))
    );
    const productCount = await Product.countDocuments({});
    const categoryCount = await Category.countDocuments({});
    const orderCount = await Order.countDocuments({});
    const revenue = await dashboardHealpert.calculateDeliveredRevenue();
    const monthlyrevenue = await dashboardHealpert.getCurrentMonthRevenue();
    res.render("dashboard", {
      arrayforUser: arrayforUser,
      arrayforOrder: arrayforOrder,
      productCount: productCount,
      categoryCount: categoryCount,
      orderCount: orderCount,
      revenue: revenue,
      monthlyrevenue: monthlyrevenue,
      arrayforStatus: JSON.stringify(roundedArray),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const reportDetails = async (req, res) => {
  try {
    const SortedData = req.query.sorting;
    let startDate = req.query.startDateInput;
    let endDate = req.query.endDateInput;

    let pipeline = [
      {
        $match: {
          Status: "Delivered",
        },
      },
    ];

    if (
      (startDate && endDate) ||
      (["paypal", "wallet", "Cash on delevery"].includes(SortedData) &&
        SortedData !== "all dates")
    ) {
      let dateMatch = {};

      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        adjustedEndDate.setHours(0, 0, 0, 0);

        dateMatch = {
          currentData: { $gte: new Date(startDate), $lt: adjustedEndDate },
        };
      }

      let paymentMatch = {};

      if (SortedData && SortedData !== "All Dates") {
        paymentMatch = {
          paymentMethod: SortedData,
        };
      }

      pipeline.push({
        $match: {
          $and: [dateMatch, paymentMatch],
        },
      });
    }

    let orderData = await Order.aggregate(pipeline);

    let orderCount = orderData.length;

    let paypalCountPipeline = [
      {
        $match: {
          paymentMethod: "paypal",
          _id: { $in: orderData.map((order) => order._id) },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ];
    let codCountPipeline = [
      {
        $match: {
          paymentMethod: "Cash on delevery",
          _id: { $in: orderData.map((order) => order._id) },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ];

    let walletPipeline = [
      {
        $match: {
          paymentMethod: "wallet",
          _id: { $in: orderData.map((order) => order._id) },
        },
      },
      {
        $group: {
          _id: 0,
          count: { $sum: 1 },
        },
      },
    ];
    const totalPrice = [
      {
        $match: {
          _id: { $in: orderData.map((order) => order._id) },
        },
      },
      {
        $group: {
          _id: 0,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ];
    let paypalCountResult = await Order.aggregate(paypalCountPipeline);
    let paypalCount =
      paypalCountResult.length > 0 ? paypalCountResult[0].count : 0;
    let codCountResult = await Order.aggregate(codCountPipeline);
    let codCount = codCountResult.length > 0 ? codCountResult[0].count : 0;
    let walletCountResult = await Order.aggregate(walletPipeline);
    let walletCount =
      walletCountResult.length > 0 ? walletCountResult[0].count : 0;
    let totalPriceResult = await Order.aggregate(totalPrice);
    const totalAmount =
      totalPriceResult.length > 0 ? totalPriceResult[0].totalAmount : 0;

    res.render("report", {
      orderData,
      startDate,
      endDate,
      SortedData,
      orderCount,
      paypalCount,
      codCount,
      walletCount,
      totalAmount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const customerList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments({ is_admin: 0 });

    const userData = await User.find({ is_admin: 0 }).skip(skip).limit(limit);

    res.render("customerList", {
      users: userData,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error fetching customer list");
  }
};

const activeList = async (req, res) => {
  try {
    const activeUser = await User.find({ is_varified: 1, is_admin: 0 });
    res.render("customerList", { users: activeUser });
  } catch (error) {
    console.log(error.message);
  }
};

const uactiveList = async (req, res) => {
  try {
    const activeUser = await User.find({ is_varified: 0, is_admin: 0 });
    res.render("customerList", { users: activeUser });
  } catch (error) {
    console.log(error.message);
  }
};

const customerBlock = async (req, res) => {
  try {
    const is_verified = req.body.is_varified;

    if (is_verified == 1) {
      updateValue = 0;
    } else {
      updateValue = 1;
    }
    const updatedData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: { is_varified: updateValue } }
    );
    const referringPage = req.headers.referer || "/admin/customer";
    res.redirect(referringPage);
  } catch (error) {
    console.log(error);
  }
};

const productManagement = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const productData = await Product.find({})
      .populate("Category")
      .skip(skip)
      .limit(limit);

    const totalCount = await Product.countDocuments({});

    const totalPages = Math.ceil(totalCount / limit);

    res.render("product", {
      products: productData,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadProduct = async (req, res) => {
  try {
    const productsData = await Category.find({});
    res.render("addProduct", { product: productsData });
  } catch (error) {
    console.log(error);
  }
};

const addProduct = async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files.every((file) => file.mimetype.startsWith("image"))
    ) {
      const productsData = await Category.find({});
      return res.render("addProduct", {
        product: productsData,
        imgMessage: "Only images are allowed...!",
      });
    } else {
      let images;
      const tickOption = req.body.tickOption;
      const catgoryData = await Category.findOne({ Name: req.body.category });
      if (tickOption === "yes") {
        images = [];
        for (const file of req.files) {
          const resizedImg = `resized_${file.filename}`;
          await sharp(file.path)
            .resize({ width: 965, height: 1440 })
            .toFile(`public/productimages/${resizedImg}`);

          images.push(resizedImg);
        }
      } else {
        images = req.files.map((file) => file.filename);
      }
      const duplicateData = await Product.findOne({
        productName: { $regex: new RegExp(`^${req.body.pname}$`, "i") },
      });
      if (duplicateData) {
        const categoryData = await Category.find({});
        res.render("addProduct", {
          product: categoryData,
          message: "already exist....!",
        });
      } else {
        const Data = new Product({
          productName: req.body.pname,
          Author: req.body.author,
          Category: catgoryData._id,
          Description: req.body.description,
          productPrice: req.body.pprice,
          salePrice: req.body.sprice,
          Quantity: req.body.quantity,
          Image: images,
          Publisher: req.body.publisher,
          Country: req.body.country,
          aboutAuthor: req.body.aabout,
          bookWeight: req.body.bweight,
          Pages: req.body.pages,
        });
        const productData = await Data.save();
        res.redirect("/admin/product");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id }).populate(
      "Category"
    );
    const categoryData = await Category.find({});
    if (productData) {
      res.render("edit-product", {
        products: productData,
        categoryData: categoryData,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    if (
      !req.files ||
      !req.files.every((file) => file.mimetype.startsWith("image"))
    ) {
      const productData = await Product.findById({ _id: id }).populate(
        "Category"
      );
      const categoryData = await Category.find({});
      if (productData) {
        res.render("edit-product", {
          products: productData,
          categoryData: categoryData,
          imgMessage: "Only images are allowed...!",
        });
      }
    } else {
      let resizedImages = [];
      const tickOption = req.body.tickOption;
      let existingImages = [];
      let updatedImages;

      const categoryData = await Category.findOne({ Name: req.body.category });
      const existingProduct = await Product.findById(id);
      if (existingProduct && existingProduct.Image) {
        existingImages = existingProduct.Image || [];
      }

      if (tickOption === "yes") {
        const newImages = req.files.map((file) => file.filename);
        const removedImages = req.body.removedImages || [];
        updatedImages = existingImages
          .concat(newImages)
          .filter((img) => !removedImages.includes(img));

        for (const file of updatedImages) {
          if (!existingImages.includes(file)) {
            const resizedImg = `resized_${file}`;
            await sharp(`public/productimages/${file}`)
              .resize({ width: 965, height: 1440 })
              .toFile(`public/productimages/${resizedImg}`);

            resizedImages.push(resizedImg);
          } else {
            resizedImages.push(file);
          }
        }
      } else {
        const newImages = req.files.map((file) => file.filename);
        const removedImages = req.body.removedImages || [];
        resizedImages = existingImages
          .concat(newImages)
          .filter((img) => !removedImages.includes(img));
      }

      const data = req.body.pname;
      const duplicateDataCount = await Product.countDocuments({
        productName: { $regex: new RegExp(`^${data}$`, "i") },
        _id: { $ne: id },
      });

      if (duplicateDataCount > 0) {
        const productData = await Product.findById({ _id: id }).populate(
          "Category"
        );
        const categoryData = await Category.find({});
        res.render("edit-product", {
          products: productData,
          categoryData: categoryData,
          message: "Already exist...!",
        });
      } else {
        const updatedData = {
          productName: req.body.pname,
          Author: req.body.author,
          Category: categoryData._id,
          Description: req.body.description,
          productPrice: req.body.pprice,
          salePrice: req.body.sprice,
          Quantity: req.body.quantity,
          Image: resizedImages,
          Publisher: req.body.publisher,
          Country: req.body.country,
          aboutAuthor: req.body.aabout,
          bookWeight: req.body.bweight,
          Pages: req.body.pages,
        };

        const productData = await Product.findByIdAndUpdate(id, updatedData, {
          new: true,
        });
        res.redirect("/admin/product/");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const del = await Product.deleteOne({ _id: id });
    if (del) {
      res.redirect("/admin/product");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const categoryManagement = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const categoryData = await Category.find({}).skip(skip).limit(limit);
    const totalCount = await Category.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);
    res.render("category", {
      categories: categoryData,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    let images;
    let tickOption = req.body.tickOption;
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (tickOption && tickOption === "yes") {
      if (allowedMimeTypes.includes(req.file.mimetype)) {
        const resizedImg = `resized_${req.file.filename}`;
        await sharp(req.file.path)
          .resize({ width: 1456, height: 768 })
          .toFile(`public/productimages/${resizedImg}`);

        images = resizedImg;
      } else {
        const productData = await Category.find({});
        if (productData) {
          return res.render("category", {
            categories: productData,
            message: "Plese Upload An Image",
          });
        } else {
          return res.redirect("/admin/category");
        }
      }
    } else {
      if (allowedMimeTypes.includes(req.file.mimetype)) {
        images = req.file.filename;
      } else {
        const productData = await Category.find({});
        if (productData) {
          return res.render("category", {
            categories: productData,
            message: "Plese Upload An Image",
          });
        } else {
          return res.redirect("/admin/category");
        }
      }
    }

    const trimmedName = req.body.name.trim();
    const nameWithoutSpaces = trimmedName.replace(/\s+/g, "\\s*");
    const regexPattern = `^${nameWithoutSpaces}$`;

    const duplicateData = await Category.countDocuments({
      Name: { $regex: new RegExp(regexPattern, "i") },
    });

    if (duplicateData > 0) {
      const productData = await Category.find({});
      res.render("category", {
        message: " already exist..!",
        categories: productData,
      });
    } else {
      const Data = new Category({
        Name: req.body.name,
        Image: images,
      });
      const CategoryData = await Data.save();
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById({ _id: id });
    res.render("edit-category", { categories: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const data = req.body.name;
    const existingCategory = await Category.findById(id);
    const existingImage = existingCategory.Image || "defaultImage.jpg";
    let newImage = "";
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError.message });
    }
    if (req.file && req.file.filename) {
      const tickOption = req.body.tickOption;
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"]; // Allowed image MIME types

      if (tickOption && tickOption === "yes") {
        if (allowedMimeTypes.includes(req.file.mimetype)) {
          const resizedImg = `resized_${req.file.filename}`;
          await sharp(req.file.path)
            .resize({ width: 1456, height: 768 })
            .toFile(`public/productimages/${resizedImg}`);

          newImage = resizedImg;
        } else {
          const categoryData = await Category.findById({ _id: id });
          if (categoryData) {
            return res.render("edit-category", {
              categories: categoryData,
              message: "Plese Upload An Image",
            });
          } else {
            return res.redirect("/admin/category");
          }
        }
      } else {
        if (allowedMimeTypes.includes(req.file.mimetype)) {
          newImage = req.file.filename;
        } else {
          const categoryData = await Category.findById({ _id: id });
          if (categoryData) {
            return res.render("edit-category", {
              categories: categoryData,
              message: "Plese Upload An Image",
            });
          } else {
            return res.redirect("/admin/category");
          }
        }
      }
    } else {
      newImage = existingImage;
    }

    const imagesToUse = newImage.length > 0 ? newImage : existingImage;
    const duplicateDataCount = await Category.countDocuments({
      Name: { $regex: new RegExp(`^${data}$`, "i") },
      _id: { $ne: id },
    });

    if (duplicateDataCount > 0) {
      const categoryData = await Category.findById({ _id: id });
      return res.render("edit-category", {
        categories: categoryData,
        message: "Already exist",
      });
    } else {
      const CategoryData = await Category.findByIdAndUpdate(
        { _id: id },
        { $set: { Name: req.body.name, Image: imagesToUse } }
      );
      return res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

const deleteCategory = async (req, res) => {
  try {
    id = req.body.id;
    const Data = await Category.deleteOne({ _id: id });
    if (Data) {
      res.status(200).json({ message: "Success" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const categoryBlock = async (req, res) => {
  try {
    let is_active = req.body.is_active;
    if (is_active == 1) {
      updateValue = 0;
    } else {
      updateValue = 1;
    }
    const updatedData = await Category.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: { is_active: updateValue } }
    );
    const referringPage = req.headers.referer || "/admin/category";
    res.redirect(referringPage);
  } catch (error) {
    console.log(error.message);
  }
};

// =================================order details===================================

const orderManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({});

    const orderData = await Order.find({})
      .populate("userId")
      .sort({ currentData: -1 })
      .skip(skip)
      .limit(limit);

    res.render("order", {
      orderData: orderData,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error fetching orders");
  }
};

const orderStatus = async (req, res) => {
  try {
    let updateStatus;
    const id = req.query.orderId;
    const selectedOption = req.query.selectedStatus;
    if (!id || !selectedOption) {
      return res.status(400).json({ message: "Missing required parameters" });
    }
    if (selectedOption == "Delivered") {
      updateStatus = await Order.findByIdAndUpdate(id, {
        $set: { Status: selectedOption, paymentStatus: "Success" },
      });
    } else {
      updateStatus = await Order.findByIdAndUpdate(id, {
        $set: { Status: selectedOption },
      });
    }

    if (!updateStatus) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const viewsorders = async (req, res) => {
  try {
    id = req.query.id;
    const orderData = await Order.findById(id).populate("items.productId");

    res.render("view-orders", { orderData });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
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
      if (orderData.paymentMethod !== "Cash on delevery") {
        const addToWallet = await User.findOneAndUpdate(
          { _id: orderData.userId },
          { $inc: { wallet: orderData.totalAmount } }
        );
      }
    } else {
    }

    res.redirect("/admin/order");
  } catch (error) {
    console.log(error.message);
  }
};

// ==============================end of order details=================================

// =============================Coupon======================================

const couponManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const currentDate = new Date();
    const totalCoupons = await Coupon.countDocuments();

    const couponData = await Coupon.find().skip(skip).limit(limit);

    for (const coupon of couponData) {
      if (coupon.expiryDate < currentDate) {
        await Coupon.findByIdAndUpdate(coupon._id, { is_active: 0 });
      }
    }

    res.render("coupon", {
      couponData: couponData,
      currentPage: page,
      totalPages: Math.ceil(totalCoupons / limit),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error fetching coupon data");
  }
};

const addCoupons = async (req, res) => {
  try {
    const couponData = new Coupon({
      couponCode: req.body.couponname,
      Discount: req.body.discount,
      expiryDate: req.body.couponDate,
      Limit: req.body.limit,
      minPurchase: req.body.minPurchase,
    });
    const data = req.body.couponname;
    const duplicateDataCount = await Coupon.countDocuments({
      couponCode: { $regex: new RegExp(`^${data}$`, "i") },
    });
    if (!duplicateDataCount) {
      const coupon = await couponData.save();
      if (coupon) {
        res.json({ message: "Success" });
      } else {
        res.json({ message: "Coupon not found" });
      }
    } else {
      res.json({ message: "Failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateCouponStatus = async (req, res) => {
  try {
    id = req.body.couponId;
    const currentDate = new Date();
    const couponExpiryDate = await Coupon.findById({ _id: id });
    const is_active = req.body.is_active;

    if (couponExpiryDate.expiryDate > currentDate) {
      let changeStatus;
      if (is_active == 1) {
        changeStatus = 0;
      } else {
        changeStatus = 1;
      }
      const couponData = await Coupon.findOneAndUpdate(
        { _id: id },
        { $set: { is_active: changeStatus } }
      );
      res.status(200).json({ message: "Success" });
    } else {
      res.status(500).json({ message: "Failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditCoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    const couponData = await Coupon.findById({ _id: couponId });
    res.render("editcoupon", { couponData: couponData });
  } catch (error) {
    console.log(error.message);
  }
};

const EditCoupon = async (req, res) => {
  try {
    id = req.body.id;
    const coupon = await Coupon.findById({ _id: id });
    const updatedData = {
      couponCode: req.body.couponname,
      Discount: req.body.discount,
      expiryDate: req.body.couponDate,
      minPurchase: req.body.minPurchase,
      Limit: req.body.limit,
    };
    const data = req.body.couponname;
    const duplicateDataCount = await Coupon.countDocuments({
      couponCode: { $regex: new RegExp(`^${data}$`, "i") },
      _id: { $ne: coupon._id },
    });
    if (!duplicateDataCount) {
      const couponData = await Coupon.findOneAndUpdate(
        coupon._id,
        updatedData,
        { new: true }
      );
      if (couponData) {
        res.json({ message: "Success" });
      } else {
        res.json({ message: "Coupon not found" });
      }
    } else {
      res.json({ message: "Failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ============================end of coupon================================

// ============================Banner===============================
const banneranagement = async (req, res) => {
  try {
    const currentDate = new Date();
    const bannerData = await Banner.find();
    for (const banner of bannerData) {
      if (banner.expiryDate <= currentDate) {
        await Banner.findByIdAndUpdate(banner._id, { is_active: 0 });
      }
    }
    res.render("banner", { bannerData: bannerData });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddBanner = async (req, res) => {
  try {
    res.render("add-banner");
  } catch (error) {
    console.log(error.message);
  }
};

const addBanner = async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files.every((file) => file.mimetype.startsWith("image"))
    ) {
      return res.render("add-banner", {
        imgMessage: "Only images are allowed...!",
      });
    } else {
      let images;
      const tickOption = req.body.tickOption;
      if (tickOption == "yes") {
        images = [];
        for (const file of req.files) {
          const resizedImg = `resized_${file.filename}`;
          await sharp(file.path)
            .resize({ width: 900, height: 900 })
            .toFile(`public/bannerimages/${resizedImg}`);

          images.push(resizedImg);
        }
      } else {
        images = req.files.map((file) => file.filename);
      }

      const Data = new Banner({
        Name: req.body.bannername,
        Text: req.body.text,
        Target: req.body.target,
        expiryDate: req.body.date,
        Image: images,
      });
      await Data.save();
      res.redirect("/admin/banner");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const blockBanner = async (req, res) => {
  try {
    id = req.body.couponId;
    const currentDate = new Date();
    const bannerExpiryDate = await Banner.findById({ _id: id });
    const is_active = req.body.is_active;

    if (bannerExpiryDate.expiryDate > currentDate) {
      let changeStatus;
      if (is_active == 1) {
        changeStatus = 0;
      } else {
        changeStatus = 1;
      }
      const couponData = await Banner.findOneAndUpdate(
        { _id: id },
        { $set: { is_active: changeStatus } }
      );
      res.status(200).json({ message: "Success" });
    } else {
      res.status(500).json({ message: "Failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditBanner = async (req, res) => {
  try {
    id = req.query.bannerId;
    const bannerData = await Banner.findById({ _id: id });
    res.render("editBanner", { bannerData: bannerData });
  } catch (error) {
    console.log(error.message);
  }
};
const editBanner = async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files.every((file) => file.mimetype.startsWith("image"))
    ) {
      const bannerData = await Banner.findById({ _id: id });
      return res.render("editBanner", {
        imgMessage: "Only images are allowed...!",
        bannerData: bannerData,
      });
    } else {
      let resizedImages = [];
      const id = req.body.id;
      const tickOption = req.body.tickOption;
      let existingImages = [];
      if (tickOption == "yes") {
        let existingImages = [];
        const existingBanner = await Banner.findById(id);
        if (existingBanner && existingBanner.Image) {
          existingImages = existingBanner.Image || [];
        }

        const newImages = req.files.map((file) => file.filename);

        const removedImages = req.body.removedImages || [];

        const updatedImages = existingImages
          .concat(newImages)
          .filter((img) => !removedImages.includes(img));

        for (const file of updatedImages) {
          const resizedImg = `resized_${file}`;
          await sharp(`public/bannerimages/${file}`)
            .resize({ width: 900, height: 900 })
            .toFile(`public/bannerimages/${resizedImg}`);

          resizedImages.push(resizedImg);
        }
      } else {
        const existingBanner = await Banner.findById(id);
        if (existingBanner && existingBanner.Image) {
          existingImages = existingBanner.Image || [];
        }
        const newImages = req.files.map((file) => file.filename);
        const removedImages = req.body.removedImages || [];
        resizedImages = existingImages
          .concat(newImages)
          .filter((img) => !removedImages.includes(img));
      }
      const updatedData = {
        Name: req.body.name,
        Text: req.body.description,
        Target: req.body.target,
        expiryDate: req.body.date,
        Image: resizedImages,
      };

      const bannerData = await Banner.findByIdAndUpdate(id, updatedData, {
        new: true,
      });
      res.redirect("/admin/banner");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ==========================End of Banner=================================

module.exports = {
  adminLogin,
  verifyLogin,
  adminLogout,
  adminDashboard,
  reportDetails,
  customerList,
  activeList,
  uactiveList,
  customerBlock,
  productManagement,
  loadProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  deleteProduct,
  categoryManagement,
  addCategory,
  loadEditCategory,
  editCategory,
  deleteCategory,
  categoryBlock,
  orderManagement,
  orderStatus,
  viewsorders,
  viewsorders,
  cancelOrder,
  couponManagement,
  addCoupons,
  updateCouponStatus,
  loadEditCoupon,
  EditCoupon,
  banneranagement,
  loadAddBanner,
  addBanner,
  blockBanner,
  loadEditBanner,
  editBanner,
};
