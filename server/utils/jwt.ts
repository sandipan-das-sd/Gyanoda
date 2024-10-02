
// require("dotenv").config();
// import { Response } from "express";
// import jwt from "jsonwebtoken";
// import { IUser } from "../models/user.model";
// import { redis } from "./redis";

// interface ITokenOptions {
//   expires: Date;
//   maxAge: number;
//   httpOnly: boolean;
//   sameSite: "lax" | "strict" | "none" | undefined;
//   secure?: boolean;
// }

// // Parse environment variables
// const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
// const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);

// const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
// const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

// // Options for cookies
// export const accessTokenOptions: ITokenOptions = {
//   expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
//   maxAge: accessTokenExpire * 60 * 60 * 1000,
//   httpOnly: true,
//   sameSite: "none",
//   secure: true,
// };

// export const refreshTokenOptions: ITokenOptions = {
//   expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
//   maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
//   httpOnly: true,
//   sameSite: "none",
//   secure: true,
// };

// // Only set secure true for production
// if (process.env.NODE_ENV === "production") {
//   accessTokenOptions.secure = true;
// }

// export const sendToken = (user: IUser, statusCode: number, res: Response) => {
//   if (!accessTokenSecret || !refreshTokenSecret) {
//     return res.status(500).json({ success: false, message: "Secret keys are missing" });
//   }

//   const accessToken = jwt.sign({ id: user._id }, accessTokenSecret, {
//     expiresIn: accessTokenExpire,
//   });
//   const refreshToken = jwt.sign({ id: user._id }, refreshTokenSecret, {
//     expiresIn: refreshTokenExpire,
//   });

//   // Ensure user._id is treated as a string
//   const userId = String(user._id);

//   // Upload session to redis
//   redis.set(userId, JSON.stringify(user), 'EX', refreshTokenExpire * 24 * 60 * 60);

//   res.cookie("access_token", accessToken, accessTokenOptions);
//   res.cookie("refresh_token", refreshToken, refreshTokenOptions);

//   res.status(statusCode).json({
//     success: true,
//     user,
//     accessToken,
//   });
// };















//written code



// require("dotenv").config();
// import { Response } from "express";
// import jwt from "jsonwebtoken";
// import { IUser } from "../models/user.model";
// import { redis } from "./redis";

// interface ITokenOptions {
//   expires: Date;
//   maxAge: number;
//   httpOnly: boolean;
//   sameSite: "lax" | "strict" | "none" | undefined;
//   secure?: boolean;
// }

// // Parse environment variables
// //parse environent to intrigates with fall back value
// const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
// const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);

// const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
// const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

// export const accessTokenOptions: ITokenOptions = {
//   expires: new Date(Date.now() + accessTokenExpire*24 * 60 * 60 * 1000),//5m accessTokenExpire=5
//   maxAge: accessTokenExpire*24 * 60 * 60 * 1000,
//   httpOnly: true,
//   sameSite: "lax"
// }
// export const refreshTokenOptions: ITokenOptions = {
//   expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),//3d refreshTokenExpire=3
//   maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
//   httpOnly: true,
//   sameSite: "lax"
// }

// export const sendToken = (user: IUser, statusCode: number, res: Response) => {
//   const accessToken = user.SignAccessToken();
//   const refreshToken = user.SignRefreshToken();

//   // Upload session to redis
//   redis.set(user._id, JSON.stringify(user) as any);

  
 
//   //option for cookies


//   //only set Secure to true in production
//   if (process.env.NODE_ENV === "production") {
//     accessTokenOptions.secure = true
//   }

//   res.cookie("access_token", accessToken, accessTokenOptions);
//   res.cookie("refresh_token", refreshToken, refreshTokenOptions);

//   res.status(statusCode).json({
//     success: true,
//     user,
//     accessToken,
//   });
// };

import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// Parse environment variables
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);

export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none"
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none"
};




export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // Convert _id to string for Redis key
  const userIdAsString = user._id.toString();

  // Upload session to redis
  try {
    redis.set(userIdAsString, JSON.stringify(user));
  } catch (error) {
    console.error("Redis session upload failed:", error);
  }
  

  // Option for cookies
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
  }

  // res.cookie("access_token", accessToken, accessTokenOptions);
  // res.cookie("refresh_token", refreshToken, refreshTokenOptions);
 // Set access_token cookie
res.cookie("access_token", accessToken, {
  ...accessTokenOptions,
  secure: true,  // Secure is required for SameSite: "none"
  sameSite: "none"  // Allow cross-site cookie sharing
});

// Set refresh_token cookie
res.cookie("refresh_token", refreshToken, {
  ...refreshTokenOptions,
  secure: true,  // Secure is required for SameSite: "none"
  sameSite: "none"  // Allow cross-site cookie sharing
});

  

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
    refreshToken
  });
};
