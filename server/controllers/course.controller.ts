


import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import CourseModel, { ISubject } from "../models/course.model";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.Model";
import axios from "axios";
import { IYear, IQuestion } from "../models/course.model";
import DoubtModel from '../models/doubt.model'; 
import nodemailer from 'nodemailer';
import { FileArray } from 'express-fileupload';
import  { Types } from 'mongoose';
import { IUser } from "../models/user.model";
import { IDoubt } from "../models/doubt.model";
import OrderModel from "../models/order.Model";
import { ICourse } from "../models/course.model";

//SMS Auth Details (Tiliwo)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken)

interface TwilioError extends Error {
  code?: string;
  status?: number;
}

const sendSMS = async (body: string, to: string): Promise<{ success: boolean; sid?: string; error?: string }> => {
  console.log('SMS function called with:', { body, to });

  let formattedNumber = to.replace(/^\+?91/, '');
  formattedNumber = `+91${formattedNumber}`; 
  console.log(`Formatted number for SMS: ${formattedNumber}`);

  const msgOptions = {
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to: formattedNumber,
    body
  };

  console.log('Twilio message options:', JSON.stringify(msgOptions, null, 2));

  try {
    console.log('Attempting to send SMS via Twilio...');
    const message = await client.messages.create(msgOptions);
    console.log('SMS sent successfully. Details:', JSON.stringify(message, null, 2));
    
    // Additional check for message status
    if (message.status === 'queued' || message.status === 'sent' || message.status === 'delivered') {
      console.log(`Message status: ${message.status}`);
      return { success: true, sid: message.sid };
    } else {
      console.warn(`Unexpected message status: ${message.status}`);
      return { success: false, error: `Unexpected message status: ${message.status}` };
    }
  } catch (error: unknown) {
    const twilioError = error as TwilioError;
    console.error('Error sending SMS:', twilioError);
    if (twilioError.code) {
      console.error('Twilio error code:', twilioError.code);
    }
    if (twilioError.message) {
      console.error('Error message:', twilioError.message);
    }
    if (twilioError.status) {
      console.error('Error status:', twilioError.status);
    }
    return { success: false, error: twilioError.message || 'Unknown error occurred' };
  }
};
const extractVideoId = (url: string): string | null => {
  let videoId = null;
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  const vimeoPattern = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;

  for (let pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      videoId = match[1];
      break;
    }
  }

  if (!videoId) {
    const match = url.match(vimeoPattern);
    if (match && match[1]) {
      videoId = match[1];
    }
  }

  return videoId;
};




export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      // Check if thumbnail is a string
      if (thumbnail && typeof thumbnail === 'string') {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }


      // Remove `years` from the data before creating the course
      const { years, ...courseData } = data;

      // Create the course with the processed data
      const course = await CourseModel.create(courseData);



      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//delete section of course
export const deleteSection = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, sectionIndex } = req.params;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Convert sectionIndex to a number
      const index = parseInt(sectionIndex, 10);

      // Check if the parsed index is a valid number
      if (isNaN(index)) {
        return next(new ErrorHandler("Invalid section index", 400));
      }

      // Ensure the section index is valid
      if (index < 0 || index >= course.courseData.length) {
        return next(new ErrorHandler("Invalid section index", 400));
      }

      // Remove the section
      course.courseData.splice(index, 1);

      // Save the updated course
      await course.save();

      res.status(200).json({
        success: true,
        message: "Section deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const AddYeartoCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, subjects } = req.body;
    const newYear = { year, subjects }; // Ensure this matches IYear
    const course = await CourseModel.findById(req.params.courseId);
    if (!course) return res.status(404).send('Course not found');
    course.years.push(newYear as any); // Cast to 'any' if TypeScript complains
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send('An unknown error occurred');
    }
  }
};



//get the year
// export const GetYearsOfCourse = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const courseId = req.params.courseId;

//     if (!courseId) {
//       return res.status(400).json({ success: false, message: 'Course ID is required' });
//     }

//     const course = await CourseModel.findById(courseId);
//     if (!course) {
//       return res.status(404).json({ success: false, message: 'Course not found' });
//     }

//     const years = course.years.map(year => ({ _id: year._id, year: year.year }));

//     res.status(200).json({ success: true, years });
//   } catch (error: any) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// };



export const GetYearsOfCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
     // Assuming userId is passed as a parameter

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }
    const cacheKey = `years:${courseId}`;

    // Try to get data from Redis cache
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      // If data is in cache, return it
      return res.status(200).json({
        success: true,
        years: JSON.parse(cachedData),
      });
    }

    

    // Fetch the course
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler('Course not found', 404));
    }

    const years = course.years.map(year => ({ _id: year._id, year: year.year }));
     // Store data in Redis cache
    await redis.set(cacheKey, JSON.stringify(years), 'EX', 604800); // Cache for 1 hour
    res.status(200).json({ success: true, years });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};



export const EditYear = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId } = req.params;
    const { year } = req.body;

    if (!year) {
      return res.status(400).json({ success: false, message: 'Year is required' });
    }

    // Find the course by ID
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find the year to edit
    const yearToEdit = course.years.find(y => y._id.toString() === yearId);
    if (!yearToEdit) {
      return res.status(404).json({ success: false, message: 'Year not found' });
    }

    // Update the year
    yearToEdit.year = year;
    await course.save();

    res.status(200).json({ success: true, course });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});







export const DeleteYear = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId } = req.params;

    // Find the course by ID
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find the year to delete
    const yearToDelete = course.years.find(y => y._id.toString() === yearId);
    if (!yearToDelete) {
      return res.status(404).json({ success: false, message: 'Year not found' });
    }

    // Remove the year from the array
    course.years = course.years.filter(y => y._id.toString() !== yearId);
    await course.save();

    res.status(200).json({ success: true, course });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//

export const AddSubjectToYear = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Subject name is required" });
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Find the year document in the array manually
    const year = course.years.find((y) => y._id.toString() === yearId);
    if (!year) {
      return res.status(404).json({ success: false, message: "Year not found" });
    }

    // Create a new subject instance using the schema
    const SubjectModel = mongoose.model('Subject', CourseModel.schema.paths.years.schema.paths.subjects.schema);
    const newSubject = new SubjectModel({
      name,
      questions: []
    });

    // Push the new subject to the year
    year.subjects.push(newSubject as any); // Type assertion to bypass TypeScript error

    // Save the updated course
    await course.save();

    res.status(201).json({ success: true, course });
  } catch (error: any) {
    console.error(error); // Improved error logging
    return next(new ErrorHandler(error.message, 500));
  }
});





export const EditSubject = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId, subjectId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    // Find the course by ID
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find the specific year within the course
    const year = course.years.find(y => y._id.toString() === yearId);
    if (!year) {
      return res.status(404).json({ success: false, message: 'Year not found' });
    }

    // Find the specific subject within the year
    const subjectToEdit = year.subjects.find(s => s._id.toString() === subjectId);
    if (!subjectToEdit) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Update the subject name
    subjectToEdit.name = name;

    // Save the updated course
    await course.save();

    res.status(200).json({ success: true, course });
  } catch (error: any) {
    console.error(error); // Improved error logging
    return next(new ErrorHandler(error.message, 500));
  }
});







export const DeleteSubject = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId, subjectId } = req.params;

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find the year document in the array manually
    const year = course.years.find((y: IYear) => y._id.toString() === yearId);
    if (!year) {
      return res.status(404).json({ success: false, message: 'Year not found' });
    }

    const subjectIndex = year.subjects.findIndex(s => s._id.toString() === subjectId);
    if (subjectIndex === -1) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Remove the subject from the array
    year.subjects.splice(subjectIndex, 1);
    await course.save();

    res.status(200).json({ success: true, course });
  } catch (error: any) {
    console.error(error);
    return next(new ErrorHandler(error.message, 500));
  }
});



// export const GetAllSubjects = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { courseId, yearId } = req.params;

//     console.log("courseId:", courseId);
//     console.log("yearId:", yearId);

//     // Fetch the course and its years and subjects
//     const course = await CourseModel.findById(courseId)
//       .populate({
//         path: 'years',
//         match: { _id: yearId },
//         populate: {
//           path: 'subjects',
//         },
//       });

//     if (!course) {
//       return res.status(404).json({ success: false, message: 'Course not found' });
//     }

//     const year = course.years.find((year) => year._id.toString() === yearId);
//     if (!year) {
//       return res.status(404).json({ success: false, message: 'Year not found' });
//     }

//     res.status(200).json({
//       success: true,
//       subjects: year.subjects,
//     });
//   } catch (error: any) {
//     return next(new ErrorHandler(error.message, 500));
//   }


// });
export const GetAllSubjects = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId } = req.params;
    // Assuming userId is passed as a parameter

    console.log("courseId:", courseId);
    console.log("yearId:", yearId);
  
    if (!courseId || !yearId) {
      return res.status(400).json({ success: false, message: 'Course ID and Year ID are required' });
    }
    const cacheKey = `subjects:${courseId}:${yearId}`;

    // Try to get data from Redis cache
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      // If data is in cache, return it
      return res.status(200).json({
        success: true,
        subjects: JSON.parse(cachedData),
      });
    }
    

    
   

    

    // Fetch the course and its years and subjects
    const course = await CourseModel.findById(courseId)
      .populate({
        path: 'years',
        match: { _id: yearId },
        populate: {
          path: 'subjects',
        },
      });

    if (!course) {
      return next(new ErrorHandler('Course not found', 404));
    }

    const year = course.years.find((year) => year._id.toString() === yearId);
    if (!year) {
      return next(new ErrorHandler('Year not found', 404));
    }
    // Store data in Redis cache
    await redis.set(cacheKey, JSON.stringify(year.subjects), 'EX', 604800); // Cache for 1 hour


    res.status(200).json({
      success: true,
      subjects: year.subjects,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});


//ADMIN PANEL ADD EDIT DELETE UPDATE QUESTION ANSWER VIDEO LINK LOGIC

export const AddQuestToSubject = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId, subjectId } = req.params;
  
    const { questionText, answerText, videoLink, questiontag } = req.body;
    const questionImage = req.files?.questionImage;
    const answerImage = req.files?.answerImage;

    let questionImageUrl: string | null = null;
    let questionImagePublicId: string | null = null;
    if (questionImage) {
      const result = await cloudinary.v2.uploader.upload((questionImage as any).tempFilePath, {
        folder: 'questions',
      });
      questionImageUrl = result.secure_url;
      questionImagePublicId = result.public_id;
    }

    let answerImageUrl: string | null = null;
    let answerImagePublicId: string | null = null;
    if (answerImage) {
      const result = await cloudinary.v2.uploader.upload((answerImage as any).tempFilePath, {
        folder: 'answers',
      });
      answerImageUrl = result.secure_url;
      answerImagePublicId = result.public_id;
    }

    const videoId = videoLink ? extractVideoId(videoLink) : null;

    const course = await CourseModel.findById(courseId)
      .populate({
        path: 'years.subjects',
        populate: {
          path: 'questions'
        }
      });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const year = (course.years as IYear[]).find(y => y._id.toString() === yearId);
    if (!year) {
      return res.status(404).json({ success: false, message: "Year not found" });
    }

    const subject = (year.subjects as ISubject[]).find(sub => sub._id.toString() === subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: `Subject not found with ID: ${subjectId}` });
    }

    // Create a new question document using the Question model
    const newQuestion = {
      questionText,
      questionImage: {
        url: questionImageUrl || '',
        public_id: questionImagePublicId || '',
      },
      answerText,
      answerImage: {
        url: answerImageUrl || '',
        public_id: answerImagePublicId || '',
      },
      videoLink,
      videoId,
      questiontag: questiontag||[]
    };

    subject.questions.push(newQuestion as any); // Casting to `any` to bypass TypeScript error

    await course.save();

    res.status(201).json({
      success: true,
      course,
      uploadedImages: {
        question: questionImageUrl || null,
        answers: answerImageUrl || null
      }
    });

  } catch (error: any) {
    console.error(error);
    return next(new ErrorHandler(error.message, 500));
  }
});



type UserCourse = {
  _id?: string;
  courseId?: string;
};
export const GetQuestions = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId, subjectId } = req.params;
    const cacheKey = `questions:${courseId}:${yearId}:${subjectId}`;

    // Try to get data from Redis cache
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      // If data is in cache, return it
      return res.status(200).json({
        success: true,
        questions: JSON.parse(cachedData),
      });
    }
 
    // Fetch the course
    const course = await CourseModel.findById(courseId)
      .populate({
        path: 'years',
        match: { _id: yearId },
        populate: {
          path: 'subjects',
          match: { _id: subjectId },
          populate: {
            path: 'questions',
          },
        },
      });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const year = course.years.find((y) => y._id.toString() === yearId);
    if (!year) {
      return res.status(404).json({ success: false, message: 'Year not found' });
    }

    const subject = year.subjects.find((s) => s._id.toString() === subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const questions = subject.questions.map((question) => ({
      _id: question._id,
      questionText: question.questionText,
      questionImage: question.questionImage,
      answerText: question.answerText,
      answerImage: question.answerImage,
      videoLink: question.videoLink,
      videoId: question.videoId,
      questiontag:question.questiontag,
      likes: question.likes,
      dislike:question.dislikes,
      
    }));
    // Store data in Redis cache
    await redis.set(cacheKey, JSON.stringify(questions), 'EX', 604800); // Cache for 7 days
    res.status(200).json({
      success: true,
      questions,
    });
  } catch (error: any) {
    console.error(error);
    return next(new ErrorHandler(error.message, 500));
  }
});





export const UpdateQuestInSubject = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId, subjectId, questionId } = req.params;
    const { questionText, answerText, videoLink, questiontag } = req.body;
    const questionImage = req.files?.questionImage;
    const answerImage = req.files?.answerImage;

    let questionImageUrl: string | null = null;
    let questionImagePublicId: string | null = null;
    if (questionImage) {
      const result = await cloudinary.v2.uploader.upload((questionImage as any).tempFilePath, {
        folder: 'questions',
      });
      questionImageUrl = result.secure_url;
      questionImagePublicId = result.public_id;
    }

    let answerImageUrl: string | null = null;
    let answerImagePublicId: string | null = null;
    if (answerImage) {
      const result = await cloudinary.v2.uploader.upload((answerImage as any).tempFilePath, {
        folder: 'answers',
      });
      answerImageUrl = result.secure_url;
      answerImagePublicId = result.public_id;
    }

    const course = await CourseModel.findById(courseId)
      .populate({
        path: 'years.subjects.questions',
      });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const year = course.years.find(y => y._id.toString() === yearId);
    if (!year) {
      return res.status(404).json({ success: false, message: 'Year not found' });
    }

    const subject = year.subjects.find(s => s._id.toString() === subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const question = subject.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Update the question fields
    question.questionText = questionText || question.questionText;
    question.answerText = answerText || question.answerText;
    question.videoLink = videoLink || question.videoLink;
    question.questiontag=questiontag||question.questiontag
    if (questionImageUrl) {
      question.questionImage.url = questionImageUrl;
      question.questionImage.public_id = questionImagePublicId as string; // Type assertion
    }

    if (answerImageUrl) {
      question.answerImage.url = answerImageUrl;
      question.answerImage.public_id = answerImagePublicId as string; // Type assertion
    }

    // Save the updated course
    await course.save();

    res.status(200).json({ success: true, question });
  } catch (error: any) {
    console.error(error);
    return next(new ErrorHandler(error.message, 500));
  }
});


//question tag
export const FilterQuestions = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { searchTerm } = req.query;
    const cacheKey = `filteredQuestions:${courseId}:${searchTerm || ''}`;

    // Try to get data from Redis cache
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      // If data is in cache, return it
      return res.status(200).json({
        success: true,
        questions: JSON.parse(cachedData),
      });
    }

    // Fetch the course
    const course = await CourseModel.findById(courseId).populate({
      path: 'years.subjects.questions',
      select: 'questionText questionImage answerText answerImage videoLink videoId questiontag likes dislikes'
    });

    if (!course) {
      return next(new ErrorHandler('Course not found', 404));
    }

    let allQuestions = course.years.flatMap(year =>
      year.subjects.flatMap(subject =>
        subject.questions.map(question => ({
          _id: question._id,
          questionText: question.questionText,
          questionImage: question.questionImage,
          answerText: question.answerText,
          answerImage: question.answerImage,
          videoLink: question.videoLink,
          videoId: question.videoId,
          questiontag: parseQuestionTag(question.questiontag),
          likes: question.likes,
          dislikes: question.dislikes,
          year: year.year,
          subject: subject.name
        }))
      )
    );

    // Apply search filter if searchTerm is provided
    if (searchTerm) {
      const lowercaseSearchTerm = searchTerm.toString().toLowerCase();
      allQuestions = allQuestions.filter(question =>
        question.questiontag.some((tag: string) =>
          tag.toLowerCase().includes(lowercaseSearchTerm)
        )
      );
    }

    // Store data in Redis cache
    await redis.set(cacheKey, JSON.stringify(allQuestions), 'EX', 3600); // Cache for 1 hour

    res.status(200).json({
      success: true,
      questions: allQuestions,
    });
  } catch (error: any) {
    console.error(error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Helper function to parse question tags
function parseQuestionTag(tag: any): string[] {
  if (Array.isArray(tag)) {
    return tag.flatMap(parseQuestionTag).filter(t => t !== '' && t !== '[]');
  }
  if (typeof tag === 'string') {
    try {
      const parsed = JSON.parse(tag);
      return Array.isArray(parsed) ? parsed.filter(t => t !== '' && t !== '[]') : [tag];
    } catch (e) {
      return tag !== '' && tag !== '[]' ? [tag] : [];
    }
  }
  return [];
}



export const DeleteQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, yearId, subjectId, questionId } = req.params;

    // Fetch the course with populated sub-documents
    const course = await CourseModel.findById(courseId).populate({
      path: 'years.subjects.questions',
    });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Find the specific year within the course
    const year = course.years.find(y => y._id.toString() === yearId);
    if (!year) {
      return res.status(404).json({ success: false, message: "Year not found" });
    }

    // Find the specific subject within the year
    const subject = year.subjects.find(s => s._id.toString() === subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    // Find the specific question within the subject
    const question = subject.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    // Remove the question from the subject's questions array
    subject.questions = subject.questions.filter(q => q._id.toString() !== questionId);

    // Save the updated course
    await course.save();

    res.status(200).json({ success: true, message: "Question deleted successfully" });
  } catch (error: any) {
    console.error(error);
    return next(new ErrorHandler(error.message, 500));
  }
});





//LIKE DISLIKE START




export const LikeQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId, yearId, subjectId, questionId } = req.params;

  if (!req.user) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  const userId = new Types.ObjectId(req.user._id);

  const course = await CourseModel.findById(courseId).populate({
    path: 'years.subjects.questions',
  });

  if (!course) {
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  const year = course.years.find(y => y._id.toString() === yearId);
  if (!year) {
    return res.status(404).json({ success: false, message: "Year not found" });
  }

  const subject = year.subjects.find(s => s._id.toString() === subjectId);
  if (!subject) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  const question = subject.questions.find(q => q._id.toString() === questionId);
  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  question.likes = question.likes ?? 0;
  question.dislikes = question.dislikes ?? 0;
  question.likedBy = question.likedBy ?? [];
  question.dislikedBy = question.dislikedBy ?? [];

  if (question.likedBy.includes(userId)) {
    return res.status(400).json({ success: false, message: "You have already liked this question" });
  }

  if (question.dislikedBy.includes(userId)) {
    question.dislikes -= 1;
    question.dislikedBy = question.dislikedBy.filter(id => !id.equals(userId));
  }

  question.likes += 1;
  question.likedBy.push(userId);

  await course.save();

  res.status(200).json({ success: true, likes: question.likes });
});


//REDIS LIKE QUESTIONS
// interface QuestionData {
//   _id: Types.ObjectId;
//   likes: number;
//   dislikes: number;
//   likedBy: Types.ObjectId[];
//   dislikedBy: Types.ObjectId[];
//   questionText: string;
// }
// const getQuestionCacheKey = (courseId: string, yearId: string, subjectId: string, questionId: string) => 
//   `question:${courseId}:${yearId}:${subjectId}:${questionId}`;
// const isObjectId = (id: any): id is Types.ObjectId => id instanceof Types.ObjectId;
// export const LikeQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   const { courseId, yearId, subjectId, questionId } = req.params;

//   if (!req.user) {
//     return next(new ErrorHandler("User not authenticated", 401));
//   }

//   const userId = new Types.ObjectId(req.user._id);
//   const cacheKey = getQuestionCacheKey(courseId, yearId, subjectId, questionId);
  
//   try {
//     let question: QuestionData;
//     let course;
//     const questionData = await redis.get(cacheKey);

//     if (questionData) {
//       question = JSON.parse(questionData);
//     } else {
//       course = await CourseModel.findById(courseId).populate({
//         path: 'years.subjects.questions',
//       });

//       if (!course) {
//         return next(new ErrorHandler("Course not found", 404));
//       }

//       const year = course.years.find(y => y._id.toString() === yearId);
//       if (!year) {
//         return next(new ErrorHandler("Year not found", 404));
//       }

//       const subject = year.subjects.find(s => s._id.toString() === subjectId);
//       if (!subject) {
//         return next(new ErrorHandler("Subject not found", 404));
//       }

//       question = subject.questions.find(q => q._id.toString() === questionId) as QuestionData;
//       if (!question) {
//         return next(new ErrorHandler("Question not found", 404));
//       }
//     }

//     question.likes = question.likes ?? 0;
//     question.dislikes = question.dislikes ?? 0;
//     question.likedBy = question.likedBy ?? [];
//     question.dislikedBy = question.dislikedBy ?? [];

//     const isObjectId = (id: any): id is Types.ObjectId => id instanceof Types.ObjectId;

//     if (question.likedBy.some(id => isObjectId(id) && id.equals(userId))) {
//       return next(new ErrorHandler("You have already liked this question", 400));
//     }

//     if (question.dislikedBy.some(id => isObjectId(id) && id.equals(userId))) {
//       question.dislikes -= 1;
//       question.dislikedBy = question.dislikedBy.filter(id => isObjectId(id) && !id.equals(userId));
//     }

//     question.likes += 1;
//     question.likedBy.push(userId);

//     // Update cache
//     await redis.set(cacheKey, JSON.stringify(question), 'EX', 604800); // Cache for 1 hour

//     // Update database
//     if (!course) {
//       await CourseModel.updateOne(
//         { _id: courseId, "years._id": yearId, "years.subjects._id": subjectId, "years.subjects.questions._id": questionId },
//         { 
//           $set: { 
//             "years.$[y].subjects.$[s].questions.$[q].likes": question.likes,
//             "years.$[y].subjects.$[s].questions.$[q].dislikes": question.dislikes,
//             "years.$[y].subjects.$[s].questions.$[q].likedBy": question.likedBy,
//             "years.$[y].subjects.$[s].questions.$[q].dislikedBy": question.dislikedBy
//           }
//         },
//         { 
//           arrayFilters: [
//             { "y._id": yearId }, 
//             { "s._id": subjectId }, 
//             { "q._id": questionId }
//           ]
//         }
//       );
//     } else {
//       await course.save();
//     }

//     // Invalidate related caches
//     await redis.del(`totalLikesDislikes:${courseId}`);
//     await redis.del(`questionDetails:${courseId}:${yearId}:${subjectId}:${questionId}`);

//     res.status(200).json({ 
//       success: true, 
//       likes: question.likes,
//       message: "Question liked successfully"
//     });
//   } catch (error) {
//     console.error("Error in LikeQuestion:", error);
//     return next(new ErrorHandler("Error processing like", 500));
//   }
// });
//dislike a question




export const DislikeQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId, yearId, subjectId, questionId } = req.params;

  if (!req.user) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  const userId = new Types.ObjectId(req.user._id);

  const course = await CourseModel.findById(courseId).populate({
    path: 'years.subjects.questions',
  });

  if (!course) {
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  const year = course.years.find(y => y._id.toString() === yearId);
  if (!year) {
    return res.status(404).json({ success: false, message: "Year not found" });
  }

  const subject = year.subjects.find(s => s._id.toString() === subjectId);
  if (!subject) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  const question = subject.questions.find(q => q._id.toString() === questionId);
  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  question.likes = question.likes ?? 0;
  question.dislikes = question.dislikes ?? 0;
  question.likedBy = question.likedBy ?? [];
  question.dislikedBy = question.dislikedBy ?? [];

  if (question.dislikedBy.includes(userId)) {
    return res.status(400).json({ success: false, message: "You have already disliked this question" });
  }

  if (question.likedBy.includes(userId)) {
    question.likes -= 1;
    question.likedBy = question.likedBy.filter(id => !id.equals(userId));
  }

  question.dislikes += 1;
  question.dislikedBy.push(userId);

  await course.save();

  res.status(200).json({ success: true, dislikes: question.dislikes });
});


//REDIS  DISLIKE

// export const DislikeQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   const { courseId, yearId, subjectId, questionId } = req.params;

//   if (!req.user) {
//     return next(new ErrorHandler("User not authenticated", 401));
//   }

//   const userId = new Types.ObjectId(req.user._id);
//   const cacheKey = getQuestionCacheKey(courseId, yearId, subjectId, questionId);
  
//   try {
//     let question: QuestionData;
//     const questionData = await redis.get(cacheKey);

//     if (questionData) {
//       question = JSON.parse(questionData);
//     } else {
//       const course = await CourseModel.findById(courseId).populate({
//         path: 'years.subjects.questions',
//       });

//       if (!course) {
//         return next(new ErrorHandler("Course not found", 404));
//       }

//       const year = course.years.find(y => y._id.toString() === yearId);
//       if (!year) {
//         return next(new ErrorHandler("Year not found", 404));
//       }

//       const subject = year.subjects.find(s => s._id.toString() === subjectId);
//       if (!subject) {
//         return next(new ErrorHandler("Subject not found", 404));
//       }

//       question = subject.questions.find(q => q._id.toString() === questionId) as QuestionData;
//       if (!question) {
//         return next(new ErrorHandler("Question not found", 404));
//       }
//     }

//     question.likes = question.likes ?? 0;
//     question.dislikes = question.dislikes ?? 0;
//     question.likedBy = question.likedBy ?? [];
//     question.dislikedBy = question.dislikedBy ?? [];

//     if (question.dislikedBy.some(id => isObjectId(id) && id.equals(userId))) {
//       return next(new ErrorHandler("You have already disliked this question", 400));
//     }

//     if (question.likedBy.some(id => isObjectId(id) && id.equals(userId))) {
//       question.likes -= 1;
//       question.likedBy = question.likedBy.filter(id => isObjectId(id) && !id.equals(userId));
//     }

//     question.dislikes += 1;
//     question.dislikedBy.push(userId);

//     // Update cache
//     await redis.set(cacheKey, JSON.stringify(question), 'EX', 604800);

//     // Update database
//     await CourseModel.updateOne(
//       { _id: courseId, "years._id": yearId, "years.subjects._id": subjectId, "years.subjects.questions._id": questionId },
//       { 
//         $set: { 
//           "years.$[y].subjects.$[s].questions.$[q].likes": question.likes,
//           "years.$[y].subjects.$[s].questions.$[q].dislikes": question.dislikes,
//           "years.$[y].subjects.$[s].questions.$[q].likedBy": question.likedBy,
//           "years.$[y].subjects.$[s].questions.$[q].dislikedBy": question.dislikedBy
//         }
//       },
//       { 
//         arrayFilters: [
//           { "y._id": yearId }, 
//           { "s._id": subjectId }, 
//           { "q._id": questionId }
//         ]
//       }
//     );

//     // Invalidate related caches
//     await redis.del(`totalLikesDislikes:${courseId}`);
//     await redis.del(`questionDetails:${courseId}:${yearId}:${subjectId}:${questionId}`);

//     res.status(200).json({ 
//       success: true, 
//       dislikes: question.dislikes,
//       message: "Question disliked successfully"
//     });
//   } catch (error) {
//     console.error("Error in DislikeQuestion:", error);
//     return next(new ErrorHandler("Error processing dislike", 500));
//   }
// });


//total like and dislike
export const getTotalLikesAndDislikes = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId } = req.params;

  const course = await CourseModel.findById(courseId).populate({
    path: 'years.subjects.questions',
  });

  if (!course) {
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  const allQuestions = course.years
    .flatMap(year => year.subjects.flatMap(subject => subject.questions));

  const totalLikes = allQuestions.reduce((total, question) => total + (question.likes ?? 0), 0);
  const totalDislikes = allQuestions.reduce((total, question) => total + (question.dislikes ?? 0), 0);

  res.status(200).json({
    success: true,
    totalLikes,
    totalDislikes,
  });
});


//unlike

export const UnlikeQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, yearId, subjectId, questionId } = req.params;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const userId = new Types.ObjectId(req.user._id);

    const course = await CourseModel.findById(courseId).populate({
      path: "years.subjects.questions",
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const year = course.years.find((y) => y._id.toString() === yearId);
    if (!year) {
      return res
        .status(404)
        .json({ success: false, message: "Year not found" });
    }

    const subject = year.subjects.find((s) => s._id.toString() === subjectId);
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    const question = subject.questions.find(
      (q) => q._id.toString() === questionId
    );
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    // Initialize likedBy if it's undefined
    if (!question.likedBy) {
      question.likedBy = [];
    }

    const likedIndex = question.likedBy.findIndex((id) => id.equals(userId));
    if (likedIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You have not liked this question",
      });
    }

    // Remove user from likedBy array
    question.likedBy.splice(likedIndex, 1);

    // Decrease likes count, ensuring it doesn't go below 0
    question.likes = Math.max(0, (question.likes || 0) - 1);

    await course.save();

    res.status(200).json({
      success: true,
      message: "Question unliked successfully",
      likes: question.likes,
    });
  }
);



//UNLIKE REDIS
// export const UnlikeQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   const { courseId, yearId, subjectId, questionId } = req.params;

//   if (!req.user) {
//     return next(new ErrorHandler("User not authenticated", 401));
//   }

//   const userId = new Types.ObjectId(req.user._id);
//   const cacheKey = getQuestionCacheKey(courseId, yearId, subjectId, questionId);
  
//   try {
//     let question: QuestionData;
//     const questionData = await redis.get(cacheKey);

//     if (questionData) {
//       question = JSON.parse(questionData);
//     } else {
//       const course = await CourseModel.findById(courseId).populate({
//         path: 'years.subjects.questions',
//       });

//       if (!course) {
//         return next(new ErrorHandler("Course not found", 404));
//       }

//       const year = course.years.find(y => y._id.toString() === yearId);
//       if (!year) {
//         return next(new ErrorHandler("Year not found", 404));
//       }

//       const subject = year.subjects.find(s => s._id.toString() === subjectId);
//       if (!subject) {
//         return next(new ErrorHandler("Subject not found", 404));
//       }

//       question = subject.questions.find(q => q._id.toString() === questionId) as QuestionData;
//       if (!question) {
//         return next(new ErrorHandler("Question not found", 404));
//       }
//     }

//     if (!question.likedBy.some(id => isObjectId(id) && id.equals(userId))) {
//       return next(new ErrorHandler("You have not liked this question", 400));
//     }

//     question.likes = Math.max(0, (question.likes || 0) - 1);
//     question.likedBy = question.likedBy.filter(id => isObjectId(id) && !id.equals(userId));

//     // Update cache
//     await redis.set(cacheKey, JSON.stringify(question), 'EX', 604800);

//     // Update database
//     await CourseModel.updateOne(
//       { _id: courseId, "years._id": yearId, "years.subjects._id": subjectId, "years.subjects.questions._id": questionId },
//       { 
//         $set: { 
//           "years.$[y].subjects.$[s].questions.$[q].likes": question.likes,
//           "years.$[y].subjects.$[s].questions.$[q].likedBy": question.likedBy,
//         }
//       },
//       { 
//         arrayFilters: [
//           { "y._id": yearId }, 
//           { "s._id": subjectId }, 
//           { "q._id": questionId }
//         ]
//       }
//     );

//     // Invalidate related caches
//     await redis.del(`totalLikesDislikes:${courseId}`);
//     await redis.del(`questionDetails:${courseId}:${yearId}:${subjectId}:${questionId}`);

//     res.status(200).json({ 
//       success: true, 
//       likes: question.likes,
//       message: "Question unliked successfully"
//     });
//   } catch (error) {
//     console.error("Error in UnlikeQuestion:", error);
//     return next(new ErrorHandler("Error processing unlike", 500));
//   }
// });

//un dislike

export const UndislikeQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, yearId, subjectId, questionId } = req.params;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const userId = new Types.ObjectId(req.user._id);

    const course = await CourseModel.findById(courseId).populate({
      path: "years.subjects.questions",
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const year = course.years.find((y) => y._id.toString() === yearId);
    if (!year) {
      return res
        .status(404)
        .json({ success: false, message: "Year not found" });
    }

    const subject = year.subjects.find((s) => s._id.toString() === subjectId);
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    const question = subject.questions.find(
      (q) => q._id.toString() === questionId
    );
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    // Initialize dislikedBy if it's undefined
    if (!question.dislikedBy) {
      question.dislikedBy = [];
    }

    const dislikedIndex = question.dislikedBy.findIndex((id) => id.equals(userId));
    if (dislikedIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You have not disliked this question",
      });
    }

    // Remove user from dislikedBy array
    question.dislikedBy.splice(dislikedIndex, 1);

    // Decrease dislikes count, ensuring it doesn't go below 0
    question.dislikes = Math.max(0, (question.dislikes || 0) - 1);

    await course.save();

    res.status(200).json({
      success: true,
      message: "Question undisliked successfully",
      dislikes: question.dislikes,
    });
  }
);


//UN DISLIKE REDIS

// export const UndislikeQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   const { courseId, yearId, subjectId, questionId } = req.params;

//   if (!req.user) {
//     return next(new ErrorHandler("User not authenticated", 401));
//   }

//   const userId = new Types.ObjectId(req.user._id);
//   const cacheKey = getQuestionCacheKey(courseId, yearId, subjectId, questionId);
  
//   try {
//     let question: QuestionData;
//     const questionData = await redis.get(cacheKey);

//     if (questionData) {
//       question = JSON.parse(questionData);
//     } else {
//       const course = await CourseModel.findById(courseId).populate({
//         path: 'years.subjects.questions',
//       });

//       if (!course) {
//         return next(new ErrorHandler("Course not found", 404));
//       }

//       const year = course.years.find(y => y._id.toString() === yearId);
//       if (!year) {
//         return next(new ErrorHandler("Year not found", 404));
//       }

//       const subject = year.subjects.find(s => s._id.toString() === subjectId);
//       if (!subject) {
//         return next(new ErrorHandler("Subject not found", 404));
//       }

//       question = subject.questions.find(q => q._id.toString() === questionId) as QuestionData;
//       if (!question) {
//         return next(new ErrorHandler("Question not found", 404));
//       }
//     }

//     if (!question.dislikedBy.some(id => isObjectId(id) && id.equals(userId))) {
//       return next(new ErrorHandler("You have not disliked this question", 400));
//     }

//     question.dislikes = Math.max(0, (question.dislikes || 0) - 1);
//     question.dislikedBy = question.dislikedBy.filter(id => isObjectId(id) && !id.equals(userId));

//     // Update cache
//     await redis.set(cacheKey, JSON.stringify(question), 'EX', 604800);

//     // Update database
//     await CourseModel.updateOne(
//       { _id: courseId, "years._id": yearId, "years.subjects._id": subjectId, "years.subjects.questions._id": questionId },
//       { 
//         $set: { 
//           "years.$[y].subjects.$[s].questions.$[q].dislikes": question.dislikes,
//           "years.$[y].subjects.$[s].questions.$[q].dislikedBy": question.dislikedBy,
//         }
//       },
//       { 
//         arrayFilters: [
//           { "y._id": yearId }, 
//           { "s._id": subjectId }, 
//           { "q._id": questionId }
//         ]
//       }
//     );

//     // Invalidate related caches
//     await redis.del(`totalLikesDislikes:${courseId}`);
//     await redis.del(`questionDetails:${courseId}:${yearId}:${subjectId}:${questionId}`);

//     res.status(200).json({ 
//       success: true, 
//       dislikes: question.dislikes,
//       message: "Question undisliked successfully"
//     });
//   } catch (error) {
//     console.error("Error in UndislikeQuestion:", error);
//     return next(new ErrorHandler("Error processing undislike", 500));
//   }
// });

//GET LIKE AND DISLIKE BY USER

export const getUserLikeDislikeDetails = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  const questions = await CourseModel.aggregate([
    { $unwind: "$years" },
    { $unwind: "$years.subjects" },
    { $unwind: "$years.subjects.questions" },
    {
      $match: {
        "years.subjects.questions.likedBy": new Types.ObjectId(userId),
        "years.subjects.questions.dislikedBy": new Types.ObjectId(userId)
      }
    },
    {
      $project: {
        _id: "$years.subjects.questions._id",
        questionText: "$years.subjects.questions.questionText",
        likes: "$years.subjects.questions.likes",
        dislikes: "$years.subjects.questions.dislikes",
        likedBy: {
          $cond: {
            if: { $in: [new Types.ObjectId(userId), "$years.subjects.questions.likedBy"] },
            then: true,
            else: false
          }
        },
        dislikedBy: {
          $cond: {
            if: { $in: [new Types.ObjectId(userId), "$years.subjects.questions.dislikedBy"] },
            then: true,
            else: false
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    questions
  });
});


//Get Like and Dislike Counts and Details for Each Question

export const getQuestionLikeDislikeDetails = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId, yearId, subjectId, questionId } = req.params;

  const course = await CourseModel.findById(courseId).populate({
    path: 'years.subjects.questions',
    populate: {
      path: 'likedBy dislikedBy',
      select: 'name email'
    }
  });

  if (!course) {
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  const year = course.years.find(y => y._id.toString() === yearId);
  if (!year) {
    return res.status(404).json({ success: false, message: "Year not found" });
  }

  const subject = year.subjects.find(s => s._id.toString() === subjectId);
  if (!subject) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  const question = subject.questions.find(q => q._id.toString() === questionId);
  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  res.status(200).json({
    success: true,
    question: {
      questionId: question._id,
      questionText: question.questionText,
      likes: question.likes ?? 0,
      dislikes: question.dislikes ?? 0,
      likedBy: (question.likedBy || []).map((user: any) => ({
        userId: user._id,
        userName: user.name,
        email: user.email
      })),
      dislikedBy: (question.dislikedBy || []).map((user: any) => ({
        userId: user._id,
        userName: user.name,
        email: user.email
      })),
    }
  });
});

//GET QUSTION LIKE DISLIKE DETAILS REDIS
// export const getQuestionLikeDislikeDetails = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   const { courseId, yearId, subjectId, questionId } = req.params;
//   const cacheKey = `questionDetails:${courseId}:${yearId}:${subjectId}:${questionId}`;

//   try {
//     const cachedData = await redis.get(cacheKey);

//     if (cachedData) {
//       return res.status(200).json(JSON.parse(cachedData));
//     }

//     const course = await CourseModel.findById(courseId).populate({
//       path: 'years.subjects.questions',
//       populate: {
//         path: 'likedBy dislikedBy',
//         select: 'name email'
//       }
//     });

//     if (!course) {
//       return next(new ErrorHandler("Course not found", 404));
//     }

//     const year = course.years.find(y => y._id.toString() === yearId);
//     if (!year) {
//       return next(new ErrorHandler("Year not found", 404));
//     }

//     const subject = year.subjects.find(s => s._id.toString() === subjectId);
//     if (!subject) {
//       return next(new ErrorHandler("Subject not found", 404));
//     }

//     const question = subject.questions.find(q => q._id.toString() === questionId);
//     if (!question) {
//       return next(new ErrorHandler("Question not found", 404));
//     }

//     const result = {
//       success: true,
//       question: {
//         questionId: question._id,
//         questionText: question.questionText,
//         likes: question.likes ?? 0,
//         dislikes: question.dislikes ?? 0,
//         likedBy: (question.likedBy || []).map((user: any) => ({
//           userId: user._id,
//           userName: user.name,
//           email: user.email
//         })),
//         dislikedBy: (question.dislikedBy || []).map((user: any) => ({
//           userId: user._id,
//           userName: user.name,
//           email: user.email
//         })),
//       }
//     };

//     await redis.set(cacheKey, JSON.stringify(result), 'EX', 604800);

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error in getQuestionLikeDislikeDetails:", error);
//     return next(new ErrorHandler("Error fetching question details", 500));
//   }
// });

//GET QUESTIONS STATS

export const getQuestionStats = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await CourseModel.find().populate({
      path: 'years.subjects.questions',
      populate: {
        path: 'likedBy dislikedBy',
        select: 'name email'
      }
    });

    const questions = courses.flatMap(course => 
      course.years?.flatMap(year => 
        year.subjects?.flatMap(subject => 
          subject.questions?.map(question => ({
            _id: question._id,
            questionText: question.questionText,
            questionImage: question.questionImage,
            answerImage: question.answerImage,
            courseName: course.name,
            year: year.year,
            subject: subject.name,
            likes: question.likes ?? 0,
            dislikes: question.dislikes ?? 0,
            likedBy: question.likedBy?.map((user: any) => user?.name ?? '') ?? [],
            dislikedBy: question.dislikedBy?.map((user: any) => user?.name ?? '') ?? []
          })) ?? []
        ) ?? []
      ) ?? []
    );

    res.status(200).json({
      success: true,
      questions
    });
  } catch (error) {
    next(new ErrorHandler((error as Error).message, 500));
  }
});

//get allquestion tags

export const getAllQuestionsForCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const allQuestions = course.years.flatMap(year => 
        year.subjects.flatMap(subject => 
          subject.questions.map(question => ({
            _id: question._id,
            questionText: question.questionText,
            questionImage: question.questionImage,
            answerImage: question.answerImage,
            videoLink: question.videoLink,
            likes: question.likes,
            dislikes: question.dislikes,
            questiontag: question.questiontag,
            year: year.year,
            subject: subject.name
          }))
        )
      );

      res.status(200).json({
        success: true,
        questions: allQuestions,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;
      const courseData = await CourseModel.findById(courseId) as any;

      const thumbnail = data.thumbnail;

      // If a new thumbnail is provided
      if (thumbnail && typeof thumbnail === 'string' && !thumbnail.startsWith("http")) {
        // Destroy the old image if exists
        if (courseData.thumbnail.public_id) {
          await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
        }

        // Upload the new thumbnail
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      } else {
        // Preserve the existing thumbnail if not updated
        data.thumbnail = courseData.thumbnail;
      }

      // Update the course data in the database
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      // Update the course in Redis (optional, ensure you have Redis setup correctly)
      // await redis.set(courseId, JSON.stringify(course)); 

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course --- without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      //at a minute if 100000 people visit the course and details so 100000 hit generate but among them 20 people buy course so our server slows down so maintain this CacheExists code will written
      const isCacheExist = await redis.get(courseId);

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


//get minimal courses

export const getMinimalCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().select(
        "_id name thumbnail.url price estimatedPrice tags ratings purchased"
      );

      res.status(200).json({
        success: true,
        courses: courses || [], // Ensure we always return an array
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get all courses --- without purchasing
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const totalCourses = await CourseModel.countDocuments();
      const courses = await CourseModel.find()
        .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        courses,
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalCourses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//fetch vimeo video

const fetchVimeoVideoUrl = async (vimeoVideoId: string) => {
  const videoId = vimeoVideoId.split("/").pop();
  if (!videoId || !/^\d+$/.test(videoId)) {
      throw new Error("Invalid Vimeo video ID.");
  }

  // Check Redis cache first
  const cachedData = await redis.get(videoId);
  if (cachedData) {
      return JSON.parse(cachedData); // Return cached data if available
  }

  try {
      const response = await fetch(
          `https://api.vimeo.com/videos/${videoId}?fields=files`,
          {
              headers: {
                  Authorization: `bearer 3bf28d224161d1f6aa19abe18b9aa16d`,
                  Accept: "application/vnd.vimeo.*+json; version=3.4",
              },
          }
      );
      if (!response.ok) {
          throw new Error("Failed to fetch video data.");
      }
      const data = await response.json();
      const qualities = data.files.reduce(
          (acc: Record<string, string>, file: any) => {
              if (file.quality) {
                  acc[file.quality] = file.link;
              }
              return acc;
          },
          {}
      );

      // Cache the result in Redis
      await redis.set(videoId, JSON.stringify({ qualities, defaultQuality: data?.files?.[0]?.link }), 'EX',604800); // Cache for 1 hour

      return { qualities, defaultQuality: data?.files?.[0]?.link };
  } catch (error) {
      console.error("Error fetching Vimeo video URL:", error);
      throw error;
  }
};
export const getVimeoVideo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
      const { vimeoVideoId } = req.params; 

      try {
          const videoData = await fetchVimeoVideoUrl(vimeoVideoId);

          res.status(200).json({
              success: true,
              videoData,
          });
      } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
      }
  }
);



//get all courses with purchase

// export const getAllCoursesPurchase = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.user?._id;
//       console.log("User ID:", userId); 

//       if (!userId) {
//         return next(new ErrorHandler("User not authenticated", 401));
//       }
      
//       // Fetch user's purchased courses
//       const userOrders = await OrderModel.find({ userId: userId });
//       const purchasedCourseIds = userOrders.map(order => order.courseId.toString());

//       console.log("Purchased Course IDs:", purchasedCourseIds); // Log purchased course IDs

//       // Fetch only the purchased courses
//       const purchasedCourses = await CourseModel.find({
//         _id: { $in: purchasedCourseIds }
//       }).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
//         // Store data in Redis cache
      
//       console.log("Number of purchased courses:", purchasedCourses.length); // Log number of purchased courses

//       res.status(200).json({
//         success: true,
//         courses: purchasedCourses,
//       });
//     } catch (error: any) {
//       console.error("Error in getAllCoursesPurchase:", error); // Log any errors
//       return next(new ErrorHandler(error.message, 500));
//     }
//   }
// );


export const getAllCoursesPurchase = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const userOrders = await OrderModel.find({ userId: userId });
      const purchasedCourseIds = userOrders.map(order => order.courseId.toString());

      const totalPurchasedCourses = await CourseModel.countDocuments({
        _id: { $in: purchasedCourseIds }
      });

      const purchasedCourses = await CourseModel.find({
        _id: { $in: purchasedCourseIds }
      })
      .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
      .skip(skip)
      .limit(limit);

      res.status(200).json({
        success: true,
        courses: purchasedCourses,
        currentPage: page,
        totalPages: Math.ceil(totalPurchasedCourses / limit),
        totalCourses: totalPurchasedCourses,
      });
    } catch (error: any) {
      console.error("Error in getAllCoursesPurchase:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content -- only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const couseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!couseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add this question to our course content
      couseContent.questions.push(newQuestion);

      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `You have a new question in ${couseContent.title}`,
      });

      // save the updated course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer in course question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnwser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const couseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!couseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = couseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // add this answer to our course content
      question.questionReplies.push(newAnswer);

      await course?.save();

      if (req.user?._id === question.user._id) {
        // create a notification
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Received",
          message: `You have a new question reply in ${couseContent.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: couseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in course
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;

      const courseId = req.params.id;

      // check if courseId already exists in userCourseList based on _id

      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      };

      course?.reviews.push(reviewData);

      let avg = 0;

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.ratings = avg / course.reviews.length; // one example we have 2 reviews one is 5 another one is 4 so math working like this = 9 / 2  = 4.5 ratings
      }

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

      // create notification
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Review Received",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      });


      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply in review
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses --- only for admin
export const getAdminAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete Course --- only for admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("course not found", 404));
      }

      await course.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// generate video url
export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;

      //For videmo video

      

      const response = await axios.post(
        `https://api.vimeo.com/videos/${videoId}/versions`,
       
        {
          headers: {
           "Content-Type": "application/json",
            "Accept": "application/vnd.vimeo.*+json;version=3.4",
            Authorization: `bearer ${process.env.VIMEO_ACCESTOKEN_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


//Doubt post

// interface AuthenticatedRequest extends Request {
//   user?: IUser;
// }

// export const generateDoubt = CatchAsyncError(
//   async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//     try {
//       const { questions, timeSlot, date } = req.body;

//       // Ensure the user is authenticated
//       if (!req.user || !req.user._id) {
//         return next(new ErrorHandler('User not authenticated', 401));
//       }

//       // Validate input
//       if (!Array.isArray(questions) || questions.length === 0) {
//         return next(new ErrorHandler('Questions must be a non-empty array.', 400));
//       }
//       if (!timeSlot || typeof timeSlot !== 'string') {
//         return next(new ErrorHandler('Invalid or missing time slot.', 400));
//       }
//       if (!date || isNaN(new Date(date).getTime())) {
//         return next(new ErrorHandler('Invalid or missing date.', 400));
//       }

//       // Validate each question object
//       const validatedQuestions = questions.map(question => {
//         if (!question.questionNumber || typeof question.questionNumber !== 'number') {
//           throw new ErrorHandler('Invalid question format. Each question must have a valid questionNumber.', 400);
//         }
//         return { questionNumber: question.questionNumber };
//       });

//       // Save the doubt information to the database
//       const newDoubt = new DoubtModel({
//         user: req.user._id,  // Use the authenticated user's ID
//         questions: validatedQuestions,
//         timeSlot,
//         date: new Date(date),
//       });

//       await newDoubt.save();

//       // Send back the saved data with a 201 status code
//       res.status(201).json(newDoubt);
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400));
//     }
//   }
// );

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const generateDoubt = CatchAsyncError(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { questions, timeSlot, date } = req.body;

      // Ensure the user is authenticated
      if (!req.user || !req.user._id) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      // Validate input
      if (!Array.isArray(questions) || questions.length === 0) {
        return next(new ErrorHandler('Questions must be a non-empty array.', 400));
      }
      if (!timeSlot || typeof timeSlot !== 'string') {
        return next(new ErrorHandler('Invalid or missing time slot.', 400));
      }
      if (!date || isNaN(new Date(date).getTime())) {
        return next(new ErrorHandler('Invalid or missing date.', 400));
      }

      // Validate each question object
      const validatedQuestions = questions.map(question => {
        if (!question.questionNumber || typeof question.questionNumber !== 'number') {
          throw new ErrorHandler('Invalid question format. Each question must have a valid questionNumber.', 400);
        }
        return { questionNumber: question.questionNumber };
      });

      // Save the doubt information to the database
      const newDoubt = new DoubtModel({
        user: req.user._id,  // Use the authenticated user's ID
        questions: validatedQuestions,
        timeSlot,
        date: new Date(date),
      });

      await newDoubt.save();

      // Prepare data for email and SMS
      const doubtDetails = `
        Date: ${new Date(date).toLocaleDateString()}
        Time Slot: ${timeSlot}
        Questions: ${validatedQuestions.map(q => q.questionNumber).join(', ')}
      `;

      // Send email
      await sendMail({
        email: req.user.email,
        subject: 'Your Doubt Submited Succesfully',
        template: 'doubt-confirmation.ejs',
        data: {
          name: req.user.name,
          doubtDetails: doubtDetails
        }
      });

      // Send SMS
      const smsBody = `Your doubt has been successfully submitted. Details:

      Date: ${new Date(date).toLocaleDateString()}
      Time: ${timeSlot}
      Questions: ${validatedQuestions.map(q => q.questionNumber).join(', ')}

      Note: While we strive to accommodate your preferred time, the actual session may be scheduled based on tutor availability. We will confirm the final time shortly.
      Thank you for using our service.`;
      const smsResult = await sendSMS(smsBody, req.user.phone);

      if (!smsResult.success) {
        console.error('Failed to send SMS:', smsResult.error);
      }

      // Send back the saved data with a 201 status code
      res.status(201).json({
        success: true,
        doubt: newDoubt,
        message: 'Doubt session scheduled successfully. Check your email and phone for details.'
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


//doubt send 


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const doubtMeetingLinkSend = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { meetingLink, timeAlloted } = req.body;

      if (!timeAlloted) {
        return next(new ErrorHandler("Please allot doubt class time", 400));
      }

      if (!meetingLink || typeof meetingLink !== 'string') {
        return next(new ErrorHandler('Invalid or missing meeting link.', 400));
      }

      const doubt = await DoubtModel.findById(id).populate('user');
      if (!doubt) {
        return next(new ErrorHandler('Doubt not found.', 404));
      }

      if (!doubt.user || typeof doubt.user !== 'object') {
        return next(new ErrorHandler('User information not found.', 404));
      }

      const userEmail = (doubt.user as any).email;
      if (!userEmail) {
        return next(new ErrorHandler('User email not found.', 404));
      }

      // Update the doubt with the allotted time
      doubt.timeAlloted = timeAlloted;
      await doubt.save();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'SolVit Doubt-Meeting-Link',
        text: `Hello,\n\nYour meeting link is: ${meetingLink}\n Allotted Time: ${timeAlloted}\n\nBest regards,\nFrom SolVit`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: 'Meeting link sent successfully.' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get all the doubts

interface QuestionItem {
  _id?: mongoose.Types.ObjectId;
  questionNumber: number;
}


export const getDoubts = CatchAsyncError(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;

      if (!req.user || !req.user._id) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      if (req.user._id.toString() !== userId) {
        return next(new ErrorHandler('Unauthorized access', 403));
      }

      const doubts = await DoubtModel.find({ user: userId }).sort({ date: -1 });

      if (!doubts || doubts.length === 0) {
        return res.status(404).json({ message: 'No doubts found for this user.' });
      }

      const doubtsWithCourseInfo = await Promise.all(
        doubts.map(async (doubt: IDoubt) => {
          console.log('Processing doubt:', doubt);

          const questionNumbers = doubt.questions.map(q => q.questionNumber);
          console.log('Question Numbers:', questionNumbers);

          const course = await CourseModel.findOne({
            'years.subjects.questions.questionText': { $regex: new RegExp(`^(${questionNumbers.join('|')})q$`) }
          });

          console.log('Found course:', course ? course._id : 'No course found');

          if (!course) {
            console.log('No course found for question numbers:', questionNumbers);
            return { ...doubt.toObject(), courseInfo: null };
          }

          const relevantYears: IYear[] = course.years.filter(year =>
            year.subjects.some(subject =>
              subject.questions.some(question =>
                questionNumbers.includes(parseInt(question.questionText))
              )
            )
          );

          const relevantSubjects: ISubject[] = relevantYears.flatMap(year =>
            year.subjects.filter(subject =>
              subject.questions.some(question =>
                questionNumbers.includes(parseInt(question.questionText))
              )
            )
          );

          const relevantQuestions: IQuestion[] = relevantSubjects.flatMap(subject =>
            subject.questions.filter(question =>
              questionNumbers.includes(parseInt(question.questionText))
            )
          );

          console.log('Relevant questions:', relevantQuestions);

          const courseInfo = {
            _id: course._id,
            name: course.name,
            years: relevantYears.map(year => ({
              _id: year._id,
              year: year.year,
              subjects: year.subjects
                .filter(subject => subject.questions.some(q => questionNumbers.includes(parseInt(q.questionText))))
                .map(subject => ({
                  _id: subject._id,
                  name: subject.name,
                  questions: subject.questions
                    .filter(q => questionNumbers.includes(parseInt(q.questionText)))
                    .map(q => ({
                      _id: q._id,
                      questionText: q.questionText,
                      questionImage: q.questionImage,
                      answerText: q.answerText,
                      answerImage: q.answerImage,
                      videoLink: q.videoLink,
                      questiontag: q.questiontag,
                      likes: q.likes,
                      dislikes: q.dislikes
                    }))
                }))
            }))
          };

          console.log('Course info:', courseInfo);

          return {
            ...doubt.toObject(),
            courseInfo
          };
        })
      );

      res.status(200).json({
        success: true,
        count: doubtsWithCourseInfo.length,
        doubts: doubtsWithCourseInfo
      });
    } catch (error: any) {
      console.error('Error in getDoubts:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
