import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import {
  createOrder,
  getAllOrders,
  getUserTransactionHistory,
  verifyPayment

} from "../controllers/order.controller";
const orderRouter = express.Router();

orderRouter.post("/create-order", isAutheticated, createOrder);
orderRouter.post('/validate',isAutheticated,verifyPayment)
orderRouter.get(
  "/get-orders",
  isAutheticated,
  authorizeRoles("admin"),
  getAllOrders
);
orderRouter.get("/transaction/user/:userId",isAutheticated,getUserTransactionHistory)


export default orderRouter;
