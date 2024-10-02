"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.newPayment = exports.sendRazorpayKeyId = exports.getAllOrders = exports.createOrder = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_Model_1 = __importDefault(require("../models/notification.Model"));
const order_service_1 = require("../services/order.service");
const redis_1 = require("../utils/redis");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
require("dotenv").config();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// create order
// export const createOrder = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { courseId, payment_info } = req.body as IOrder;
//       const payment = await razorpay.payments.fetch(payment_info.payment_id as any);
//             // Check if the payment status is captured
//             if (payment.status !== "captured") {
//               return next(new ErrorHandler("Payment not authorized", 400));
//             }
//       const user = await userModel.findById(req.user?._id);
//       if (!user) {
//         return next(new ErrorHandler("User not found", 404));
//       }
//       const courseExistInUser = user.courses.some(
//         (course: any) => course.courseId.toString() === courseId
//       );
//       if (courseExistInUser) {
//         return next(new ErrorHandler("You have already purchased this course", 400));
//       }
//       const course: ICourse | null = await CourseModel.findById(courseId);
//       if (!course) {
//         return next(new ErrorHandler("Course not found", 404));
//       }
//       const data: any = {
//         courseId: course._id.toString(),
//         userId: user._id.toString(),
//         payment_info,
//       };
//       const mailData = {
//         order: {
//           _id: course._id.toString().slice(0, 6),
//           name: course.name,
//           price: course.price,
//           date: new Date().toLocaleDateString("en-US", {
//             year: "numeric",
//             month: "long",
//             day: "numeric",
//           }),
//         },
//       };
//       const html = await ejs.renderFile(
//         path.join(__dirname, "../mails/order-confirmation.ejs"),
//         { order: mailData }
//       );
//       try {
//         if (user) {
//           await sendMail({
//             email: user.email,
//             subject: "Order Confirmation",
//             template: "order-confirmation.ejs",
//             data: mailData,
//           });
//         }
//       } catch (error: any) {
//         return next(new ErrorHandler(error.message, 500));
//       }
//       user.courses.push({ courseId: course._id.toString() });
//       await user.save();
//       await redis.set(req.user?.id, JSON.stringify(user));
//       const userId = req.user?._id?.toString();
//       if (userId) {
//         await redis.set(userId, JSON.stringify(user));
//       } else {
//         return next(new ErrorHandler("User ID is missing", 400));
//       }
//       await NotificationModel.create({
//         user: user._id,
//         title: "New Order",
//         message: `You have a new order for ${course.name}`,
//       });
//       course.purchased += 1;
//       await course.save();
//       newOrder(data, res, next);
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   }
// );
exports.createOrder = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        const paymentId = payment_info.payment_id;
        if (!paymentId) {
            return next(new ErrorHandler_1.default("Payment ID is missing", 400));
        }
        const payment = await razorpay.payments.fetch(paymentId);
        // Check if the payment status is captured
        if (payment.status !== "captured") {
            return next(new ErrorHandler_1.default("Payment not authorized", 400));
        }
        const user = await user_model_1.default.findById(req.user?._id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        const courseExistInUser = user.courses.some((course) => course.courseId.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 400));
        }
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const data = {
            courseId: course._id.toString(),
            userId: user._id.toString(),
            payment_info,
        };
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        // Sending email
        try {
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "Order Confirmation",
                template: "order-confirmation.ejs",
                data: mailData,
            });
        }
        catch (error) {
            console.error("Error sending email:", error); // Log the error
            return next(new ErrorHandler_1.default(`Failed to send email: ${error.message}`, 500));
        }
        user.courses.push({ courseId: course._id.toString() });
        await user.save();
        await redis_1.redis.set(req.user?.id, JSON.stringify(user));
        const userId = req.user?._id?.toString();
        if (userId) {
            await redis_1.redis.set(userId, JSON.stringify(user));
        }
        else {
            return next(new ErrorHandler_1.default("User ID is missing", 400));
        }
        await notification_Model_1.default.create({
            user: user._id,
            title: "New Order",
            message: `You have a new order for ${course.name}`,
        });
        course.purchased += 1;
        await course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        console.error("Internal Server Error:", error); // Log the error
        // Send detailed error message (only for development or with security measures)
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === "development" ? error.message : "An error occurred. Please try again later.",
        });
    }
});
// get All orders --- only for admin
exports.getAllOrders = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, order_service_1.getAllOrdersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// send Razorpay key ID
exports.sendRazorpayKeyId = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res) => {
    res.status(200).json({
        key_id: process.env.RAZORPAY_KEY_ID,
    });
});
exports.newPayment = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { amount } = req.body;
        // Validate the amount
        if (!amount || amount <= 0) {
            return next(new ErrorHandler_1.default("Invalid amount", 400));
        }
        const receipt = `order_rcptid_${Date.now()}`; // Generate a unique receipt ID
        const order = await razorpay.orders.create({
            amount: amount * 100, // Razorpay amount is in paise
            currency: "INR",
            receipt,
            payment_capture: 1,
        });
        res.status(201).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.verifyPayment = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const shasum = crypto_1.default.createHmac("sha256", secret);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest("hex");
        if (digest !== razorpay_signature) {
            return next(new ErrorHandler_1.default("Invalid payment signature", 400));
        }
        // Payment signature is valid
        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
