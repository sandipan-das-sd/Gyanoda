

import mongoose, { Document, Schema } from "mongoose";

export interface IAdminNotification extends Document {
  user: mongoose.Types.ObjectId;
  textNotification: string;
  imageNotification?: string;
  linkNotification?: string;
  isGlobal?:boolean;
  read: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  readBy: mongoose.Types.ObjectId[];
 
}

const adminUserNotificationSchema = new Schema<IAdminNotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    textNotification: {
      type: String,
      required: true,
    },
    imageNotification: {
      type: String,
    },
    linkNotification: {
      type: String,
    },
    isGlobal: { type: Boolean, default: false },
    read: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export const AdminNotification = mongoose.model<IAdminNotification>(
  "AdminNotification",
  adminUserNotificationSchema
);