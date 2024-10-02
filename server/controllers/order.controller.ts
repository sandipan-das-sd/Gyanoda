import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel,{IOrder} from "../models/order.Model";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import Razorpay from 'razorpay';
import crypto from "crypto";
import mongoose from 'mongoose'
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Received create order request:', req.body);

      // Validate amount
      if (!req.body || typeof req.body.amount !== 'number' || req.body.amount <= 0) {
        console.error('Invalid amount:', req.body.amount);
        return next(new ErrorHandler("Bad Request: Invalid or missing amount", 400));
      }

      // Validate currency
      if (!req.body.currency || typeof req.body.currency !== 'string' || req.body.currency.trim() === '') {
        console.error('Invalid currency:', req.body.currency);
        return next(new ErrorHandler("Bad Request: Invalid or missing currency", 400));
      }

      const options = {
        amount: req.body.amount,
        currency: req.body.currency,
        receipt: `receipt_${Date.now()}`
      };

      console.log('Creating Razorpay order with options:', options);

      const order = await razorpay.orders.create(options as any);

      console.log('Razorpay order created:', order);

      if (!order || order.status !== 'created') {
        console.error('Error creating order:', order);
        return next(new ErrorHandler("Failed to create Razorpay order", 500));
      }

      res.status(200).json(order);
    } catch (error) {
      console.error('Error in createOrder:', error);
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
);



export const verifyPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Starting verifyPayment function');
      console.log('Received verification request:', JSON.stringify(req.body, null, 2));

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseIds } = req.body;

      console.log('Received courseIds:', courseIds);

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseIds) {
        console.error('Missing required payment information');
        return next(new ErrorHandler("Missing required payment information", 400));
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        console.error('Razorpay secret key not found');
        return next(new ErrorHandler("Server configuration error", 500));
      }

      // Verify the payment signature
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest('hex');
      
      console.log('Generated digest:', digest);
      console.log('Received signature:', razorpay_signature);

      if (digest !== razorpay_signature) {
        console.error('Signature verification failed');
        return next(new ErrorHandler("Payment verification failed", 400));
      }

      console.log('Signature verified successfully');

      const userId = req.user?._id;
      if (!userId) {
        console.error('User not authenticated');
        return next(new ErrorHandler("User not authenticated", 401));
      }

      console.log('User ID:', userId);

      // Parse courseIds into an array if it's a string
      const courseIdsArray = Array.isArray(courseIds) ? courseIds : [courseIds];
      console.log('Creating orders for courses:', courseIdsArray);

      const savedOrders = [];
      for (const courseId of courseIdsArray) {
        try {
          console.log(`Processing courseId: ${courseId}, type: ${typeof courseId}`);

          if (typeof courseId !== 'string' || courseId.trim() === '') {
            console.error(`Invalid courseId: ${courseId}`);
            continue;
          }

          // Validate if the courseId is a valid MongoDB ObjectId
          if (!mongoose.Types.ObjectId.isValid(courseId)) {
            console.error(`Invalid MongoDB ObjectId: ${courseId}`);
            continue;
          }

          console.log(`Creating order for course: ${courseId}`);
          const newOrder = new OrderModel({
            courseId: courseId,
            userId: userId.toString(),
            payment_info: {
              status_code: 200,
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature
            }
          });

          console.log('New order object:', JSON.stringify(newOrder, null, 2));

          const savedOrder = await newOrder.save();
          console.log('Order saved successfully:', JSON.stringify(savedOrder, null, 2));
          savedOrders.push(savedOrder);

          // Update user's courses
          console.log(`Updating user ${userId} with new course ${courseId}`);
          const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $addToSet: { courses: { courseId: courseId } } },
            { new: true }
          );
          console.log('Updated user:', JSON.stringify(updatedUser, null, 2));

          // Update course's purchased count
          console.log(`Updating purchased count for course ${courseId}`);
          const updatedCourse = await CourseModel.findByIdAndUpdate(
            courseId,
            { $inc: { purchased: 1 } },
            { new: true }
          );
          console.log('Updated course:', JSON.stringify(updatedCourse, null, 2));

        } catch (error) {
          console.error(`Error processing order for course ${courseId}:`, error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
        }
      }

      if (savedOrders.length === 0) {
        console.error('No orders were successfully created');
        return next(new ErrorHandler("Failed to create any orders", 500));
      }

      console.log('All orders processed. Successful orders:', savedOrders.length);

      res.status(200).json({
        success: true,
        message: 'Payment verified and orders created successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        orders: savedOrders,
        userId: userId,
        courseIds: courseIdsArray
      });

    } catch (error) {
      console.error('Unexpected error in verifyPayment:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return next(new ErrorHandler("An unexpected error occurred", 500));
    }
  }
);
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const sendRazorpayKeyId = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      return next(new ErrorHandler("Razorpay key ID is not configured", 500));
    }
    res.status(200).json({
      success: true,
      key_id: keyId,
    });
  }
);


interface CourseDetails {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  description: string;
  estimatedPrice: number;
  thumbnail: string;
  tags: string;
  level: string;
}

// Extend the IOrder interface to include optional createdAt
interface ExtendedOrder extends IOrder {
  createdAt?: Date | string;
}

export const getUserTransactionHistory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Fetching transaction history for user');

      const userId = req.params.userId;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.error('Invalid userId:', userId);
        return next(new ErrorHandler("Bad Request: Invalid user ID", 400));
      }

      console.log('Querying orders for userId:', userId);

      const orders = await OrderModel.find({ userId: userId })
        .sort({ createdAt: -1 })
        .lean<ExtendedOrder[]>();

      console.log(`Found ${orders.length} orders for user`);

      // Log the structure of the first few orders
      console.log('First few orders:', JSON.stringify(orders.slice(0, 2), null, 2));

      // Fetch course details for all orders
      //extract the course id from order model
      const courseIds = orders.map(order => order.courseId);
      //now find the courses details through courseid in courses model
      const courses = await CourseModel.find({ _id: { $in: courseIds } })
        .select('name price description estimatedPrice thumbnail tags level')
        .lean<CourseDetails[]>();

      // Create a map of course details for quick lookup
      const courseMap = new Map(courses.map(course => [course._id.toString(), course]));

      const transactionHistory = orders.map((order, index) => {
        console.log(`Processing order ${index}:`, JSON.stringify(order, null, 2));

        if (!order || !order._id || !order.courseId) {
          console.error(`Invalid order at index ${index}:`, JSON.stringify(order, null, 2));
          return null;
        }

        const courseDetails = courseMap.get(order.courseId.toString()) || {} as CourseDetails;

        return {
          orderId: order._id.toString(),
          courseId: order.courseId.toString(),
          courseName: courseDetails.name || 'Unknown Course',
          amount: courseDetails.price || 0,
          paymentId: order.payment_info?.razorpay_payment_id || 'N/A',
          status: order.payment_info?.status_code === 200 ? 'Completed' : 'Failed',
          createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : 'N/A',
          // Additional course details
          courseDescription: courseDetails.description || 'No description available',
          estimatedPrice: courseDetails.estimatedPrice || 0,
          thumbnail: courseDetails.thumbnail || 'No thumbnail',
          tags: courseDetails.tags || 'No tags',
          level: courseDetails.level || 'Not specified'
        };
      }).filter((transaction): transaction is NonNullable<typeof transaction> => transaction !== null);

      console.log('Processed transaction history:', JSON.stringify(transactionHistory.slice(0, 2), null, 2));

      res.status(200).json({
        success: true,
        transactionHistory
      });
    } catch (error) {
      console.error('Error in getUserTransactionHistory:', error);
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
);