// import { Response } from "express";
// import CourseModel from "../models/course.model";
// import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// // create course
// export const createCourse = CatchAsyncError(async(data:any,res:Response)=>{
//     const course = await CourseModel.create(data);
//     res.status(201).json({
//         success:true,
//         course
//     });
// })

// // Get All Courses
// export const getAllCoursesService = async (res: Response) => {
//     const courses = await CourseModel.find().sort({ createdAt: -1 });
  
//     res.status(201).json({
//       success: true,
//       courses,
//     });
//   };
  


import { Response } from "express";
import CourseModel from "../models/course.model";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { Request, NextFunction } from 'express';
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
// create course
export const createCourse = CatchAsyncError(async (data: any, res: Response) => {
  const course = await CourseModel.create(data);
  res.status(201).json({
    success: true,
    course
  });
})

//midlewire to upload question image to cloudinary
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.questionType === 'image' && req.body.questionContent) {
      const result = await cloudinary.v2.uploader.upload(req.body.questionContent, {
        folder: 'questions',
      });
      req.body.questionContent = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }
    next();
  } catch (error) {
    return next(new ErrorHandler('Image upload failed', 500));
  }
};

// Get All Courses
export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 });

  res.status(201).json({
    success: true,
    courses,
  });
};
