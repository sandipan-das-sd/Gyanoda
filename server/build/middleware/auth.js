"use strict";
// main code
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAutheticated = void 0;
const catchAsyncErrors_1 = require("./catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../utils/redis");
// authenticated user
exports.isAutheticated = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    // const decoded = jwt.decode(access_token) as JwtPayload;
    const decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN);
    if (!decoded) {
        return next(new ErrorHandler_1.default("access token is not valid", 400));
    }
    // check if the access token is expired
    const user = await redis_1.redis.get(decoded.id);
    if (!user) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    req.user = JSON.parse(user);
    next();
});
// validate user role
// code to separate  user and admin if user.role is not admin then "Role: ${req.user?.role} is not allowed to access this resource`,"
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler_1.default(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
// error solved by sandipan 
// import { Request, Response, NextFunction } from "express";
// import { CatchAsyncError } from "./catchAsyncErrors";
// import ErrorHandler from "../utils/ErrorHandler";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { redis } from "../utils/redis";
// import { updateAccessToken } from "../controllers/user.controller";
// // authenticated user
// export const isAutheticated = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const access_token = req.cookies.access_token as string;
//     if (!access_token) {
//       return next(
//         new ErrorHandler("Please login to access this resource", 400)
//       );
//     }
//     let decoded: JwtPayload;
//     try {
//       decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
//     } catch (error) {
//       // If the access token is invalid, try to refresh it
//       if (error.name === "TokenExpiredError") {
//         try {
//           await updateAccessToken(req, res, next);
//           return; // updateAccessToken already handled the response
//         } catch (updateError) {
//           return next(updateError);
//         }
//       }
//       return next(new ErrorHandler("Access token is not valid", 400));
//     }
//     // check if the access token is expired
//     const user = await redis.get(decoded.id);
//     if (!user) {
//       return next(
//         new ErrorHandler("Please login to access this resource", 400)
//       );
//     }
//     req.user = JSON.parse(user);
//     next();
//   }
// );
// // validate user role
// // code to separate  user and admin if user.role is not admin then "Role: ${req.user?.role} is not allowed to access this resource`,"
// export const authorizeRoles = (...roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!roles.includes(req.user?.role || "")) {
//       return next(
//         new ErrorHandler(
//           `Role: ${req.user?.role} is not allowed to access this resource`,
//           403
//         )
//       );
//     }
//     next();
//   };
// };
