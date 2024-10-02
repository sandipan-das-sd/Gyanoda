// import mongoose, { Document, Model, Schema } from "mongoose";

// export interface IOrder extends Document {
//     courseId: string;
//     userId: string;
//     payment_info: {
//         razorpay_order_id: string;
//         razorpay_payment_id: string;
//         razorpay_signature: string;
//         [key: string]: any;
//     };
// }

// const orderSchema = new Schema<IOrder>(
//     {
//         courseId: {
//             type: String,
//             required: true,
//         },
//         userId: {
//             type: String,
//             required: true,
//         },
//         payment_info: {
//             type: Object,
//             required: true,
//         },
//     },
//     { timestamps: true }
// );

// const OrderModel: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

// export default OrderModel;
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
    courseId: string;
    userId: string;
    payment_info: {
        status_code: number;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    };
}

const orderSchema = new Schema<IOrder>(
    {
        courseId: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        payment_info: {
            status_code: Number,
            razorpay_order_id: String,
            razorpay_payment_id: String,
            razorpay_signature: String,
        },
    },
    { timestamps: true }
);

const OrderModel: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default OrderModel;