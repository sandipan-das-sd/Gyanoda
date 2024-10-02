"use strict";
// import mongoose, { Document, Model, Schema } from "mongoose";
// import { IUser } from "./user.model";
// export interface IQuestion extends Document {
//   _id: mongoose.Types.ObjectId;
//   questionText: string; // Changed to lowercase
//   questionImage: {
//     url: string; // Changed to lowercase
//     public_id: string; // Changed to lowercase
//   };
//   answerText: string; // Changed to lowercase
//   answerImage: {
//     url: string; // Changed to lowercase
//     public_id: string; // Changed to lowercase
//   };
//   videoLink?: string;
//   videoId?: string | null;
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// }
// export interface ISubject extends Document {
//   // _id:string,
//   _id: mongoose.Types.ObjectId,
//   name: string;
//   questions: IQuestion[];
// }
// export interface IYear extends Document {
//   _id: mongoose.Types.ObjectId;
//   year: number;
//   subjects: ISubject[];
// }
// export interface IComment extends Document {
//   user: IUser;
//   question: string;
//   questionReplies: IComment[];
// }
// interface IReview extends Document {
//   user: IUser;
//   rating?: number;
//   comment: string;
//   commentReplies?: IReview[];
// }
// interface ILink extends Document {
//   title: string;
//   url: string;
// }
// interface ICourseData extends Document {
//   title: string;
//   description: string;
//   videoUrl: string;
//   videoThumbnail: object;
//   videoSection: string;
//   videoLength: number;
//   videoPlayer: string;
//   links: ILink[];
//   suggestion: string;
//   questions: IComment[];
// }
// export interface ICourse extends Document {
//   _id: string;
//   name: string;
//   description: string;
//   categories: string;
//   price: number;
//   estimatedPrice?: number;
//   thumbnail: object;
//   tags: string;
//   level: string;
//   demoUrl: string;
//   benefits: { title: string }[];
//   prerequisites: { title: string }[];
//   reviews: IReview[];
//   courseData: ICourseData[];
//   ratings?: number;
//   purchased: number;
//   years: IYear[];
// }
// const questionSchema = new Schema<IQuestion>({
//   _id: mongoose.Types.ObjectId,
//   questionText: String,
//   questionImage: {
//     url: String,
//     public_id: String,
//   },
//   answerText: String,
//   answerImage: {
//     url: String,
//     public_id: String,
//   },
//   videoLink: String,
//   videoId: String,
// });
// const subjectSchema = new Schema<ISubject>({
//   name: {
//     type: String,
//   },
//   questions: [questionSchema],
// });
// const yearSchema = new Schema<IYear>({
//   year: {
//     type: Number,
//     required: true,
//   },
//   subjects: [subjectSchema],
// });
// const commentSchema = new Schema<IComment>({
//   user: Object,
//   question: String,
//   questionReplies: [Object],
// }, { timestamps: true });
// const reviewSchema = new Schema<IReview>({
//   user: Object,
//   rating: {
//     type: Number,
//     default: 0,
//   },
//   comment: String,
//   commentReplies: [Object],
// }, { timestamps: true });
// const linkSchema = new Schema<ILink>({
//   title: String,
//   url: String,
// });
// const courseDataSchema = new Schema<ICourseData>({
//   videoUrl: String,
//   videoThumbnail: Object,
//   title: String,
//   videoSection: String,
//   description: String,
//   videoLength: Number,
//   videoPlayer: String,
//   links: [linkSchema],
//   suggestion: String,
//   questions: [commentSchema],
// });
// const courseSchema = new Schema<ICourse>({
//   name: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   categories: {
//     type: String,
//     required: true,
//   },
//   price: {
//     type: Number,
//     required: true,
//   },
//   estimatedPrice: {
//     type: Number,
//   },
//   thumbnail: {
//     public_id: {
//       type: String,
//     },
//     url: {
//       type: String,
//     },
//   },
//   tags: {
//     type: String,
//     required: true,
//   },
//   level: {
//     type: String,
//     required: true,
//   },
//   demoUrl: {
//     type: String,
//     required: true,
//   },
//   benefits: [{ title: String }],
//   prerequisites: [{ title: String }],
//   reviews: [reviewSchema],
//   courseData: [courseDataSchema],
//   ratings: {
//     type: Number,
//     default: 0,
//   },
//   purchased: {
//     type: Number,
//     default: 0,
//   },
//   years: [yearSchema],
// }, { timestamps: true });
// const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);
// export default CourseModel;
const mongoose_1 = __importStar(require("mongoose"));
const questionSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true }, // Use Schema.Types.ObjectId
    questionText: { type: String }, // Add required: true if needed
    questionImage: {
        url: { type: String },
        public_id: { type: String },
    },
    answerText: { type: String },
    answerImage: {
        url: { type: String },
        public_id: { type: String },
    },
    videoLink: { type: String },
    videoId: { type: String },
});
const subjectSchema = new mongoose_1.Schema({
    name: { type: String },
    questions: [questionSchema],
});
const yearSchema = new mongoose_1.Schema({
    year: { type: Number },
    subjects: [subjectSchema],
});
const commentSchema = new mongoose_1.Schema({
    user: Object,
    question: String,
    questionReplies: [Object],
}, { timestamps: true });
const reviewSchema = new mongoose_1.Schema({
    user: Object,
    rating: {
        type: Number,
        default: 0,
    },
    comment: String,
    commentReplies: [Object],
}, { timestamps: true });
const linkSchema = new mongoose_1.Schema({
    title: String,
    url: String,
});
const courseDataSchema = new mongoose_1.Schema({
    videoUrl: String,
    videoThumbnail: Object,
    title: String,
    videoSection: String,
    description: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    questions: [commentSchema],
});
const courseSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    categories: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    estimatedPrice: {
        type: Number,
    },
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    tags: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    },
    demoUrl: {
        type: String,
        required: true,
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0,
    },
    purchased: {
        type: Number,
        default: 0,
    },
    years: [yearSchema],
}, { timestamps: true });
const CourseModel = mongoose_1.default.model("Course", courseSchema);
exports.default = CourseModel;
