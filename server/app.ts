require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";

import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import { rateLimit } from 'express-rate-limit'
import fileUpload from 'express-fileupload';
import path from "path";

// Set the 'views' directory
app.set('views', path.join(__dirname, 'mails'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
// origin: process.env.ORIGIN,
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));
app.use(
    cors({
        origin: [
            "https://solvit-test-deploy.vercel.app",
            "http://localhost:3000",
            "http://localhost:8081",
            "https://gyanoda.com"
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'access-token'],
        credentials: true,
    })
);
// app.use(cors({ origin: process.env.ORIGIN, credentials: true, }))

// api requests limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})

// routes
app.use(
    "/api/v1",
    userRouter,
    orderRouter,
    courseRouter,
    notificationRouter,
    analyticsRouter,
    layoutRouter,
    
);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        succcess: true,
        message: "API is working and it Takes updating from Server and Github   ",
    });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});

// middleware calls
app.use(limiter);
app.use(ErrorMiddleware);
