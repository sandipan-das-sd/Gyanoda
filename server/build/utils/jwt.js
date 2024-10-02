"use strict";
// require("dotenv").config();
// import { Response } from "express";
// import jwt from "jsonwebtoken";
// import { IUser } from "../models/user.model";
// import { redis } from "./redis";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
const redis_1 = require("./redis");
// Parse environment variables
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none"
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none"
};
const sendToken = (user, statusCode, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();
    // Convert _id to string for Redis key
    const userIdAsString = user._id.toString();
    // Upload session to redis
    redis_1.redis.set(userIdAsString, JSON.stringify(user));
    // Option for cookies
    if (process.env.NODE_ENV === "production") {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
};
exports.sendToken = sendToken;
