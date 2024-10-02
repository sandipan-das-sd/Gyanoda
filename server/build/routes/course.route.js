"use strict";
// import express from "express";
// import {
//   addAnwser,
//   addQuestion,
//   addReplyToReview,
//   addReview,
//   deleteCourse,
//   editCourse,
//   generateVideoUrl,
//   getAdminAllCourses,
//   getAllCourses,
//   getCourseByUser,
//   getSingleCourse,
//   uploadCourse,
// } from "../controllers/course.controller";
// import { authorizeRoles, isAutheticated } from "../middleware/auth";
// const courseRouter = express.Router();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// courseRouter.post(
//   "/create-course",
//   isAutheticated,
//   authorizeRoles("admin"),
//   uploadCourse
// );
// courseRouter.put(
//   "/edit-course/:id",
//   isAutheticated,
//   authorizeRoles("admin"),
//   editCourse
// );
// courseRouter.get("/get-course/:id", getSingleCourse);
// courseRouter.get("/get-courses", getAllCourses);
// courseRouter.get(
//   "/get-admin-courses",
//   isAutheticated,
//   authorizeRoles("admin"),
//   getAdminAllCourses
// );
// courseRouter.get("/get-course-content/:id", isAutheticated, getCourseByUser);
// courseRouter.put("/add-question", isAutheticated, addQuestion);
// courseRouter.put("/add-answer", isAutheticated, addAnwser);
// courseRouter.put("/add-review/:id", isAutheticated, addReview);
// courseRouter.put(
//   "/add-reply",
//   isAutheticated,
//   authorizeRoles("admin"),
//   addReplyToReview
// );
// courseRouter.post("/getVdoCipherOTP", generateVideoUrl);
// courseRouter.delete(
//   "/delete-course/:id",
//   isAutheticated,
//   authorizeRoles("admin"),
//   deleteCourse
// );
// export default courseRouter;
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("../controllers/course.controller");
const auth_1 = require("../middleware/auth");
const course_service_1 = require("../services/course.service");
const courseRouter = express_1.default.Router();
courseRouter.post("/create-course", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.uploadCourse);
//add year to course
courseRouter.post("/course/:courseId/year", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), (req, res, next) => {
    console.log("Route hit!");
    next();
}, course_controller_1.AddYeartoCourse);
//get the year
courseRouter.get("/course/:courseId/years", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.GetYearsOfCourse);
//add subject to year
courseRouter.post("/course/:courseId/year/:yearId/subject", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.AddSubjectToYear);
//Add question to subject
courseRouter.post("/course/:courseId/year/:yearId/subject/:subjectId/question", auth_1.isAutheticated, course_controller_1.AddQuestToSubject, course_service_1.uploadImage, (0, auth_1.authorizeRoles)("admin"));
// Update a question
courseRouter.put("/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId", auth_1.isAutheticated, course_service_1.uploadImage, // Ensure this middleware is only used when you are uploading images
(0, auth_1.authorizeRoles)("admin"), course_controller_1.UpdateQuestInSubject);
// Delete a question
courseRouter.delete("/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.DeleteQuestion);
courseRouter.put("/course/:courseId/year/:yearId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.EditYear);
courseRouter.delete("/course/:courseId/year/:yearId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.DeleteYear);
courseRouter.put("/course/:courseId/year/:yearId/subject/:subjectId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.EditSubject);
courseRouter.delete("/course/:courseId/year/:yearId/subject/:subjectId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.DeleteSubject);
courseRouter.get("/course/:courseId/year/:yearId/subjects", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.GetAllSubjects);
//get question
courseRouter.get('/course/:courseId/year/:yearId/subject/:subjectId/questions', auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.GetQuestions);
//delete question
courseRouter.delete("/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.DeleteQuestion);
//reorder question
// Reorder questions route
// courseRouter.patch('/:courseId/years/:yearId/subjects/:subjectId/questions/reorder', QuestionReorder);
// //
courseRouter.put("/edit-course/:id", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.editCourse);
courseRouter.get("/get-course/:id", course_controller_1.getSingleCourse);
courseRouter.get("/get-courses", course_controller_1.getAllCourses);
courseRouter.get("/get-admin-courses", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.getAdminAllCourses);
courseRouter.get("/get-course-content/:id", auth_1.isAutheticated, course_controller_1.getCourseByUser);
courseRouter.put("/add-question", auth_1.isAutheticated, course_controller_1.addQuestion);
courseRouter.put("/add-answer", auth_1.isAutheticated, course_controller_1.addAnwser);
courseRouter.put("/add-review/:id", auth_1.isAutheticated, course_controller_1.addReview);
courseRouter.put("/add-reply", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.addReplyToReview);
courseRouter.post("/getVdoCipherOTP", course_controller_1.generateVideoUrl);
courseRouter.delete("/delete-course/:id", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.deleteCourse);
exports.default = courseRouter;
