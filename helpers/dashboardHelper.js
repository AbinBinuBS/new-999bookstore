const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModal");
const Banner = require("../models/bannerModel");

module.exports = {
  getMonthlyUserCount: async () => {
    try {
      const userCountByMonth = await User.aggregate([
        {
          $group: {
            _id: { $month: { $toDate: "$currentDate" } },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            months: {
              $push: {
                month: "$_id",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            months: {
              $map: {
                input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                as: "month",
                in: {
                  month: "$$month",
                  count: {
                    $let: {
                      vars: {
                        matchedMonth: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$months",
                                as: "m",
                                cond: { $eq: ["$$m.month", "$$month"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: { $ifNull: ["$$matchedMonth.count", 0] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $sort: { "months.month": 1 },
        },
        {
          $project: {
            _id: 0,
            months: 1,
          },
        },
      ]);

      return userCountByMonth[0].months;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  getMonthlyOrderDetails: async () => {
    try {
      const orderDetailsByMonth = await Order.aggregate([
        {
          $group: {
            _id: {
              $month: "$currentData",
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $group: {
            _id: null,
            months: {
              $push: {
                month: "$_id",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            months: {
              $map: {
                input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                as: "month",
                in: {
                  month: "$$month",
                  count: {
                    $let: {
                      vars: {
                        matchedMonth: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$months",
                                as: "m",
                                cond: { $eq: ["$$m.month", "$$month"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: { $ifNull: ["$$matchedMonth.count", 0] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $unwind: "$months",
        },
        {
          $replaceRoot: { newRoot: "$months" },
        },
        {
          $sort: { month: 1 },
        },
      ]);

      return orderDetailsByMonth;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  getOrderStatusPercentages: async () => {
    try {
      const statusCounts = {
        Processing: 0,
        Cancelled: 0,
        Delivered: 0,
        Return: 0,
        "Order Placed": 0,
      };

      const orderStatuses = await Order.aggregate([
        {
          $group: {
            _id: "$Status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1,
          },
        },
      ]);

      orderStatuses.forEach((status) => {
        statusCounts[status.status] = status.count;
      });

      const totalOrders = Object.values(statusCounts).reduce(
        (acc, curr) => acc + curr,
        0
      );
      const statusPercentages = Object.keys(statusCounts).map((status) => {
        const percentage =
          totalOrders > 0 ? (statusCounts[status] / totalOrders) * 100 : 0;
        return { status, percentage };
      });

      return statusPercentages;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  calculateDeliveredRevenue: async () => {
    try {
      const totalDeliveredRevenue = await Order.aggregate([
        {
          $match: { Status: "Delivered" },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      if (totalDeliveredRevenue.length > 0) {
        const deliveredRevenue = totalDeliveredRevenue[0].totalAmount;
        return deliveredRevenue;
      }

      return 0;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  getCurrentMonthRevenue: async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;

      const currentMonthRevenue = await Order.aggregate([
        {
          $match: {
            Status: "Delivered",
            currentData: {
              $gte: new Date(currentDate.getFullYear(), currentMonth - 1, 1),
              $lt: new Date(currentDate.getFullYear(), currentMonth, 0),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      if (currentMonthRevenue.length > 0) {
        return currentMonthRevenue[0].totalAmount;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  getStatusPercentage: async () => {
    try {
      const statusPercentage = await Order.aggregate([
        {
          $group: {
            _id: "$Status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            percentage: {
              $multiply: [{ $divide: ["$count", { $sum: "$count" }] }, 100],
            },
          },
        },
      ]);

      return statusPercentage;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },
};
