"use strict";
// import { Response } from "express";
// import CourseModel from "../models/course.model";
// import { CatchAsyncError } from "../middleware/catchAsyncErrors";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoursesService = exports.uploadImage = exports.createCourse = void 0;
const course_model_1 = __importDefault(require("../models/course.model"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const cloudinary_1 = __importDefault(require("cloudinary"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
// create course
exports.createCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (data, res) => {
    const course = await course_model_1.default.create(data);
    res.status(201).json({
        success: true,
        course
    });
});
//midlewire to upload question image to cloudinary
const uploadImage = async (req, res, next) => {
    try {
        if (req.body.questionType === 'image' && req.body.questionContent) {
            const result = await cloudinary_1.default.v2.uploader.upload(req.body.questionContent, {
                folder: 'questions',
            });
            req.body.questionContent = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }
        next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default('Image upload failed', 500));
    }
};
exports.uploadImage = uploadImage;
// Get All Courses
const getAllCoursesService = async (res) => {
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        courses,
    });
};
exports.getAllCoursesService = getAllCoursesService;
