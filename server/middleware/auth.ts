











// //written code by soumadip


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
//     console.log("Access token:", access_token);

//     // const decoded = jwt.decode(access_token) as JwtPayload;
//     const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

//     if (!decoded) {
//       return next(new ErrorHandler("access token is not valid", 400));
//     }
//     console.log("Decoded token:", decoded);
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


import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { updateAccessToken } from "../controllers/user.controller";

// authenticated user
export const isAutheticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }

    // const decoded = jwt.decode(access_token) as JwtPayload;
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler("access token is not valid", 400));
    }

    // check if the access token is expired
    const user = await redis.get(decoded.id);

    if (!user) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }

    req.user = JSON.parse(user);

    next();
  }
);

// validate user role
// code to separate  user and admin if user.role is not admin then "Role: ${req.user?.role} is not allowed to access this resource`,"
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
