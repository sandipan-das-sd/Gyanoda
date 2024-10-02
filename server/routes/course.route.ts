


import express from "express";
import {
  addAnwser,
  addQuestion,
  AddQuestToSubject,
  addReplyToReview,
  addReview,
  AddSubjectToYear,
  AddYeartoCourse,
  deleteCourse,
  editCourse,
  doubtMeetingLinkSend,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
  uploadCourse,
  generateDoubt,
  EditYear,
  DeleteYear,
  EditSubject,
  DeleteSubject,
 
  DeleteQuestion,
  UpdateQuestInSubject,
  GetYearsOfCourse,
  GetAllSubjects,
  GetQuestions,
  LikeQuestion,
  DislikeQuestion,
  getTotalLikesAndDislikes,
  getUserLikeDislikeDetails,
  getQuestionLikeDislikeDetails,
  getDoubts,
  getAllCoursesPurchase,
  getQuestionStats,
  deleteSection,
  UnlikeQuestion,
  UndislikeQuestion,
  getMinimalCourses,
  getAllQuestionsForCourse,
  getVimeoVideo,
  FilterQuestions
  
 
 
} from "../controllers/course.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";

import { uploadImage } from "../services/course.service";
const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  isAutheticated,
  authorizeRoles("admin"),
  uploadCourse
);

//add year to course
courseRouter.post(
  "/course/:courseId/year",
  isAutheticated,
  authorizeRoles("admin"),
  (req, res, next) => {
    console.log("Route hit!");
    next();
  },
  AddYeartoCourse);

//get the year
  

courseRouter.get("/course/:courseId/years", isAutheticated,  GetYearsOfCourse);



//add subject to year
courseRouter.post(
  "/course/:courseId/year/:yearId/subject",
  isAutheticated,
  authorizeRoles("admin"),
  AddSubjectToYear)

//Add question to subject
courseRouter.post(
  "/course/:courseId/year/:yearId/subject/:subjectId/question",
  isAutheticated,
  AddQuestToSubject,
  uploadImage,
  authorizeRoles("admin"),
)

// Update a question
courseRouter.put(
  "/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId",
  isAutheticated,
  uploadImage, // Ensure this middleware is only used when you are uploading images
  authorizeRoles("admin"),
UpdateQuestInSubject
);

// Delete a question
courseRouter.delete(
  "/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId",
  isAutheticated,
  authorizeRoles("admin"),
  DeleteQuestion
);
courseRouter.put(
  "/course/:courseId/year/:yearId",
  isAutheticated,
  authorizeRoles("admin"),
  EditYear
);

courseRouter.delete(
  "/course/:courseId/year/:yearId",
  isAutheticated,
  authorizeRoles("admin"),
  DeleteYear
);

courseRouter.put(
  "/course/:courseId/year/:yearId/subject/:subjectId",
  isAutheticated,
  authorizeRoles("admin"),
  EditSubject
);

courseRouter.delete(
  "/course/:courseId/year/:yearId/subject/:subjectId",
  isAutheticated,
  authorizeRoles("admin"),
  DeleteSubject
);

//get all subject 
courseRouter.get(
  "/course/:courseId/year/:yearId/subjects",
  isAutheticated,
  
 GetAllSubjects
);

//get question
courseRouter.get('/course/:courseId/year/:yearId/subject/:subjectId/questions', isAutheticated, GetQuestions);
//delete question
courseRouter.delete(
  "/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId",
  isAutheticated,
  authorizeRoles("admin"),
  DeleteQuestion
);
//get question tag

courseRouter.get('/course/:courseId/filter-questions',isAutheticated,FilterQuestions);
//reorder question

// Reorder questions route
// courseRouter.patch('/:courseId/years/:yearId/subjects/:subjectId/questions/reorder', QuestionReorder);
// //
courseRouter.put(
  "/edit-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", isAutheticated, getAllCourses);
//fetch vimeo video url

courseRouter.get('/get-vimeo-videos/:vimeoVideoId', getVimeoVideo)
//get all courses of home scrren 

// courseRouter.get("/get-courses", getMinimalCourses);


courseRouter.get("/get-all-courses/:userId", isAutheticated,  getAllCoursesPurchase);

courseRouter.get(
  "/get-admin-courses",
  isAutheticated,
  authorizeRoles("admin"),
  getAdminAllCourses
);

courseRouter.get("/get-course-content/:id", isAutheticated, getCourseByUser);

courseRouter.put("/add-question", isAutheticated, addQuestion);

courseRouter.put("/add-answer", isAutheticated, addAnwser);

courseRouter.put("/add-review/:id", isAutheticated, addReview);

courseRouter.put(
  "/add-reply",
  isAutheticated,
  authorizeRoles("admin"),
  addReplyToReview
);

courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

courseRouter.delete(
  "/delete-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  deleteCourse
);
// Like a question
courseRouter.post("/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId/like", isAutheticated, LikeQuestion);
// unlike a question

courseRouter.post(
  "/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId/unlike",
  isAutheticated,
  UnlikeQuestion
);
courseRouter.post(
  "/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId/undislike",
  isAutheticated,
 UndislikeQuestion
);
// Dislike a question
courseRouter.post("/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId/dislike", isAutheticated, DislikeQuestion);
//get all like and dislike

courseRouter.get(
  "/course/:courseId/likes-dislikes",
  isAutheticated,
  
  getTotalLikesAndDislikes
);

//get like and dislike by user
courseRouter.get(
  "/user/:userId/likes-dislikes",
  isAutheticated,
  getUserLikeDislikeDetails
);

//get like dislike count of each questions
courseRouter.get(
  "/course/:courseId/year/:yearId/subject/:subjectId/question/:questionId/likes-dislikes",
  isAutheticated,
  authorizeRoles("admin"),
  getQuestionLikeDislikeDetails
);

//questions stts

courseRouter.get("/questions/stats", isAutheticated,authorizeRoles("admin"),  getQuestionStats);
//doubt
courseRouter.post(
  "/get-doubt",
  isAutheticated,
  generateDoubt
);

courseRouter.post(
  "/doubt-meeting/:id",
  doubtMeetingLinkSend
);

//get all doubts
courseRouter.get('/get-doubts/:userId', isAutheticated,getDoubts);

//delete section

courseRouter.delete(
 
  "/delete-section/:courseId/:sectionIndex", isAutheticated,authorizeRoles("admin"),deleteSection
 
);

courseRouter.get(
  "/course/:courseId/all-questions",
isAutheticated,
getAllQuestionsForCourse
);
export default courseRouter;
