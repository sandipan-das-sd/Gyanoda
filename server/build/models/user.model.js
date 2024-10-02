"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
//for validation og email need RegExp
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "please enter a valid email",
        },
        unique: true,
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    courses: [
        {
            courseId: String,
        },
    ],
}, { timestamps: true });
// Hash Password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcryptjs_1.default.hash(this.password, 10);
    next();
});
// sign access token
userSchema.methods.SignAccessToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
        expiresIn: "1d",
    });
};
// sign refresh token
userSchema.methods.SignRefreshToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
        expiresIn: "3d",
    });
};
// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
const userModel = mongoose_1.default.model("User", userSchema);
exports.default = userModel;
// require("dotenv").config();
// import mongoose, { Document, Model, Schema } from "mongoose";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// // For email validation
// const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// export interface IUser extends Document {
//   _id: string;
//   name: string;
//   email: string;
//   password: string;
//   avatar: {
//     public_id: string;
//     url: string;
//   };
//   role: string;
//   isVerified: boolean;
//   courses: Array<{ courseId: string }>;
//   passwordResetToken?: string;
//   passwordResetTokenExpire?: Date;
//   comparePassword: (password: string) => Promise<boolean>;
//   SignAccessToken: () => string;
//   SignRefreshToken: () => string;
// }
// const userSchema: Schema<IUser> = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Please enter your name"],
//     },
//     email: {
//       type: String,
//       required: [true, "Please enter your email"],
//       validate: {
//         validator: function (value: string) {
//           return emailRegexPattern.test(value);
//         },
//         message: "Please enter a valid email",
//       },
//       unique: true,
//     },
//     password: {
//       type: String,
//       minlength: [6, "Password must be at least 6 characters"],
//       select: false,
//     },
//     avatar: {
//       public_id: String,
//       url: String,
//     },
//     role: {
//       type: String,
//       default: "user",
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     courses: [
//       {
//         courseId: String,
//       },
//     ],
//     passwordResetToken: {
//       type: String,
//     },
//     passwordResetTokenExpire: {
//       type: Date,
//     },
//   },
//   { timestamps: true }
// );
// // Hash Password before saving
// userSchema.pre<IUser>("save", async function (next) {
//   if (!this.isModified("password")) {
//     return next();
//   }
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });
// // Sign access token
// userSchema.methods.SignAccessToken = function () {
//   return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
//     expiresIn: "1d",
//   });
// };
// // Sign refresh token
// userSchema.methods.SignRefreshToken = function () {
//   return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
//     expiresIn: "3d",
//   });
// };
// // Compare password
// userSchema.methods.comparePassword = async function (
//   enteredPassword: string
// ): Promise<boolean> {
//   return await bcrypt.compare(enteredPassword, this.password);
// };
// const userModel: Model<IUser> = mongoose.model("User", userSchema);
// export default userModel;
