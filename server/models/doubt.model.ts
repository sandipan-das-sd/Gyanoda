
import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from './user.model'; // Make sure this path is correct

// Interface for individual question item
export interface QuestionItem {
    questionNumber: number;
    _id?: Types.ObjectId;
}

// Interface for the Doubt document
export interface IDoubt extends Document {
    user: Types.ObjectId | IUser;
    questions: QuestionItem[];
    date: Date;
    timeAlloted?: string;
    timeSlot: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const questionItemSchema = new Schema<QuestionItem>({
    questionNumber: { type: Number, required: true },
});

const doubtSchema = new Schema<IDoubt>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: {
        type: [questionItemSchema],
        required: true,
        validate: {
            validator: (questions: QuestionItem[]) => questions.length > 0,
            message: "At least one question is required.",
        },
    },
    date: {
        type: Date,
        required: true,
    },
    timeAlloted: {
        type: String,
        required: false, // Not required as it will be set later
      },
    timeSlot: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const DoubtModel = mongoose.model<IDoubt>('Doubt', doubtSchema);

export default DoubtModel;