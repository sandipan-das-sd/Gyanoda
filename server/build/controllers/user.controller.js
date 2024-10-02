"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateProfilePicture = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registrationUser = void 0;
require("dotenv").config();
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.registrationUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = {
            name,
            email,
            password,
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({
        user,
        activationCode,
    }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = await user_model_1.default.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = await user_model_1.default.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.loginUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// logout user
exports.logoutUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id || "";
        // console.log(req.user)
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update access token
// access token will expire soon (5m) but refresh token  expire (3d)
exports.updateAccessToken = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const refresh_token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        const session = await redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login for access this resources!", 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "1440m",
        });
        // const refreshToken = jwt.sign(
        //   { id: user._id },
        //   process.env.REFRESH_TOKEN as string,
        //   {
        //     expiresIn: "3d",
        //   }
        // );
        req.user = user;
        // res.cookie("access_token", accessToken, accessTokenOptions);
        // res.cookie("refresh_token", refreshToken, refreshTokenOptions);
        res.cookie("access_token", accessToken, { httpOnly: true, sameSite: 'lax' });
        // res.cookie("refresh_token", refreshToken, { httpOnly: true, sameSite: 'lax' });
        await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7days
        res.status(200).json({
            status: "Success",
            accessToken,
        });
        return next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get user info
exports.getUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler_1.default("User ID not found", 400));
        }
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.socialAuth = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = await user_model_1.default.create({ email, name, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler_1.default("User ID not found", 400));
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        if (email) {
            const isEmailExist = await user_model_1.default.findOne({ email });
            if (isEmailExist) {
                return next(new ErrorHandler_1.default("Email Already Exists", 400));
            }
            user.email = email;
        }
        if (name) {
            user.name = name;
        }
        await user.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updatePassword = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old and new password", 400));
        }
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler_1.default("User ID not found", 400));
        }
        const user = await user_model_1.default.findById(userId).select("+password");
        if (!user || user.password === undefined) {
            return next(new ErrorHandler_1.default("Invalid user", 400));
        }
        const isPasswordMatch = await user.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid old password", 400));
        }
        user.password = newPassword;
        await user.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateProfilePicture = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler_1.default("User ID not found", 400));
        }
        const user = await user_model_1.default.findById(userId).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        if (avatar) {
            // Delete the old avatar if it exists
            if (user.avatar?.public_id) {
                await cloudinary_1.default.v2.uploader.destroy(user.avatar.public_id);
            }
            // Upload the new avatar
            const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                folder: "avatars",
                width: 150,
            });
            // Update user avatar information
            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
            await user.save();
            await redis_1.redis.set(userId, JSON.stringify(user));
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get all users --- only for admin
exports.getAllUsers = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update user role --- only for admin
exports.updateUserRole = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const isUserExist = await user_model_1.default.findOne({ email });
        if (isUserExist) {
            const id = isUserExist._id;
            (0, user_service_1.updateUserRoleService)(res, id, role);
        }
        else {
            res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Delete user --- only for admin
exports.deleteUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// // Reset Password
// interface IPasswordReset {
//   resetToken: string;
//   newPassword: string;
// }
// interface IPasswordResetRequest {
//   email: string;
// }
// export const requestPasswordReset = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { email } = req.body as IPasswordResetRequest;
//       // Find the user by email
//       const user = await userModel.findOne({ email });
//       if (!user) {
//         return next(new ErrorHandler("User with this email does not exist", 400));
//       }
//       // Generate a reset token and set its expiration
//       const resetToken = crypto.randomBytes(32).toString('hex');
//       user.passwordResetToken = resetToken;
//       user.passwordResetTokenExpire = new Date(Date.now() + 3600000); // 1 hour
//       await user.save();
//       // Prepare data for the email content
//       const userName = user.name;
//       const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
//       const supportUrl = `${process.env.FRONTEND_URL}/support`;
//       // Directly create the HTML email content
//       const emailContent = `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Password Reset Request</title>
//           <style>
//             body {
//               margin: 0;
//               padding: 0;
//               min-width: 100%;
//               font-family: Arial, sans-serif;
//               font-size: 16px;
//               line-height: 1.5;
//               background-color: #fafafa;
//               color: #222222;
//             }
//             a {
//               color: #0070f3;
//               text-decoration: none;
//             }
//             .email-wrapper {
//               max-width: 600px;
//               margin: 0 auto;
//               background-color: #ffffff;
//               border-radius: 8px;
//               box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
//             }
//             .email-header {
//               background-color: #0070f3;
//               padding: 24px;
//               color: #ffffff;
//               text-align: center;
//             }
//             .email-body {
//               padding: 24px;
//             }
//             .button {
//               display: inline-block;
//               background-color: #0070f3;
//               color: #ffffff;
//               font-size: 16px;
//               font-weight: 700;
//               text-align: center;
//               text-decoration: none;
//               padding: 12px 24px;
//               border-radius: 4px;
//               margin-top: 10px;
//             }
//             .email-footer {
//               background-color: #f6f6f6;
//               padding: 24px;
//               text-align: center;
//               font-size: 14px;
//               color: #666666;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="email-wrapper">
//             <div class="email-header">
//               <h1>Password Reset Request</h1>
//             </div>
//             <div class="email-body">
//               <p>Hello ${userName},</p>
//               <p>We received a request to reset your password for your SolviT account. If you did not request this change, please ignore this email.</p>
//               <p>To reset your password, please click the button below:</p>
//               <a href="${resetLink}" class="button">Reset Password</a>
//               <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
//               <p>${resetLink}</p>
//             </div>
//             <div class="email-footer">
//               <p>Thank you for using SolviT!</p>
//               <p>For any questions or support, please visit our <a href="${supportUrl}">support page</a>.</p>
//               <p>&copy; ${new Date().getFullYear()} SolviT. All rights reserved.</p>
//             </div>
//           </div>
//         </body>
//         </html>
//       `;
//       // Adjust to fit your sendMail function's API
//       try {
//         await sendMail({
//           to: user.email, // Typically, 'to' or 'recipient' might be used
//           subject: "Reset Your Password",
//           text: emailContent, // Use 'text' if 'html' is not supported
//           // Add any other required properties based on your `sendMail` implementation
//         });
//         res.status(200).json({
//           success: true,
//           message: `A password reset link has been sent to ${user.email}`,
//         });
//       } catch (error: any) {
//         return next(new ErrorHandler(error.message, 400));
//       }
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400));
//     }
//   }
// );
// export const resetPassword = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { resetToken, newPassword } = req.body as IPasswordReset;
//       // Find the user by the reset token and check if the token has expired
//       const user = await userModel.findOne({
//         passwordResetToken: resetToken,
//         passwordResetTokenExpire: { $gt: Date.now() },
//       });
//       if (!user) {
//         return next(new ErrorHandler("Invalid or expired reset token", 400));
//       }
//       // Hash the new password before saving
//       user.password = await bcrypt.hash(newPassword, 10);
//       user.passwordResetToken = undefined;
//       user.passwordResetTokenExpire = undefined;
//       await user.save();
//       res.status(200).json({
//         success: true,
//         message: "Password has been successfully reset",
//       });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400));
//     }
//   }
// );
