import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { AdminNotification, IAdminNotification } from '../models/admin_user_notification.model';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { FileArray, UploadedFile } from 'express-fileupload';
import { v2 as cloudinary } from 'cloudinary';
let getIO: () => SocketIOServer;

export const setSocketIOGetter = (getter: () => SocketIOServer) => {
  getIO = getter;
};
// Rate limiting middleware
const createNotificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many notifications created from this IP, please try again later'
  });
  
  // Interface for grouped notifications
  interface IGroupedNotification {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    textNotification: string;
    imageNotification?: string;
    linkNotification?: string;
    read: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    count: number;
  }
  
  // Helper function to group notifications
  const groupNotifications = (notifications: IAdminNotification[]): IGroupedNotification[] => {
    const grouped = notifications.reduce((acc, notification) => {
      const key = notification.textNotification;
      if (!acc[key]) {
        acc[key] = { 
          ...notification.toObject(), 
          count: 1 
        } as IGroupedNotification;
      } else {
        acc[key].count += 1;
      }
      return acc;
    }, {} as Record<string, IGroupedNotification>);
  
    return Object.values(grouped);
  };
  // export const adminUserNotification = CatchAsyncError(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const io = getIO();
  //     if (!io) {
  //       return res.status(500).json({
  //         success: false,
  //         message: "Socket.IO instance not initialized",
  //         errorCode: "SOCKET_NOT_INITIALIZED"
  //       });
  //     }
      
  //     const { userId, textNotification, imageNotification, linkNotification } = req.body;
  
  //     if (!userId || !textNotification) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "userId and textNotification are required",
  //         errorCode: "MISSING_REQUIRED_FIELDS"
  //       });
  //     }
  
  //     try {
  //       const newNotification: IAdminNotification = new AdminNotification({
  //         user: userId,
  //         textNotification,
  //         imageNotification,
  //         linkNotification,
  //         read: false,
  //         isGlobal: true,
  //         expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
  //       });
  
  //       await newNotification.save();
  
  //       io.to(userId.toString()).emit('adminNotification', newNotification);
  
  //       res.status(200).json({
  //         success: true,
  //         message: "Notification sent successfully",
  //         notification: newNotification
  //       });
  //     } catch (error) {
  //       console.error('Error in adminUserNotification:', error);
  //       res.status(500).json({
  //         success: false,
  //         message: "Failed to send notification",
  //         errorCode: "NOTIFICATION_SEND_FAILED"
  //       });
  //     }
  //   }
  // );

  //send notification to particular users
  

  export const adminUserNotification = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      const io = getIO();
      if (!io) {
        return res.status(500).json({
          success: false,
          message: "Socket.IO instance not initialized",
          errorCode: "SOCKET_NOT_INITIALIZED"
        });
      }
      
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
  
      const { userId, textNotification, linkNotification } = req.body;
  
      if (!userId || !textNotification) {
        return res.status(400).json({
          success: false,
          message: "userId and textNotification are required",
          errorCode: "MISSING_REQUIRED_FIELDS"
        });
      }
  
      try {
        let imageNotification;
  
        if (req.files && 'imageNotification' in req.files) {
          const file = req.files.imageNotification as UploadedFile;
          console.log('Uploading file:', file);
          const result = await cloudinary.uploader.upload(file.tempFilePath);
          console.log('Cloudinary result:', result);
          imageNotification = result.secure_url;
        }
  
        const newNotification: IAdminNotification = new AdminNotification({
          user: userId,
          textNotification,
          imageNotification,
          linkNotification,
          read: false,
          isGlobal: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
        });
  
        await newNotification.save();
  
        io.to(userId.toString()).emit('adminNotification', newNotification);
  
        res.status(200).json({
          success: true,
          message: "Notification sent successfully",
          notification: newNotification
        });
      } catch (error) {
        console.error('Error in adminUserNotification:', error);
        res.status(500).json({
          success: false,
          message: "Failed to send notification",
          errorCode: "NOTIFICATION_SEND_FAILED"
        });
      }
    }
  );
//   export const sendNotificationToAllUsers = CatchAsyncError(
//     async (req: Request, res: Response, next: NextFunction) => {
//         const io = getIO();
//         if (!io) {
//             return res.status(500).json({
//                 success: false,
//                 message: "Socket.IO instance not initialized"
//             });
//         }
        
//         const { textNotification, imageNotification, linkNotification } = req.body;

//         if (!textNotification) {
//             return res.status(400).json({
//                 success: false,
//                 message: "textNotification is required"
//             });
//         }

//         try {
//             // Create a new notification without a specific user
//             const newNotification: IAdminNotification = new AdminNotification({
//                 textNotification,
//                 imageNotification,
//                 linkNotification,
//                 isGlobal: true,
//                 expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
//             });

//             // Save the notification to the database
//             await newNotification.save();

//             // Emit the notification to all connected users
//             io.emit('adminNotification', newNotification);

//             res.status(200).json({
//                 success: true,
//                 message: "Notification sent to all users successfully",
//                 notification: newNotification
//             });
//         } catch (error) {
//             console.error('Error in sendNotificationToAllUsers:', error);
//             res.status(500).json({
//                 success: false,
//                 message: "Failed to send notification to all users"
//             });
//         }
//     }
// );


//send notification to all users
export const sendNotificationToAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const io = getIO();
    if (!io) {
      return res.status(500).json({
        success: false,
        message: "Socket.IO instance not initialized"
      });
    }
    
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const { textNotification, linkNotification } = req.body;

    if (!textNotification) {
      return res.status(400).json({
        success: false,
        message: "textNotification is required"
      });
    }

    try {
      let imageNotification;

      if (req.files && 'imageNotification' in req.files) {
        const file = req.files.imageNotification as UploadedFile;
        const result = await cloudinary.uploader.upload(file.tempFilePath);
        imageNotification = result.secure_url;
      }

      const newNotification: IAdminNotification = new AdminNotification({
        textNotification,
        imageNotification,
        linkNotification,
        isGlobal: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
      });

      await newNotification.save();

      io.emit('adminNotification', newNotification);

      res.status(200).json({
        success: true,
        message: "Notification sent to all users successfully",
        notification: newNotification
      });
    } catch (error) {
      console.error('Error in sendNotificationToAllUsers:', error);
      res.status(500).json({
        success: false,
        message: "Failed to send notification to all users"
      });
    }
  }
);
export const getUserNotifications = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.params.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
  
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
          errorCode: "MISSING_USER_ID"
        });
      }
  
      try {
        const notifications = await AdminNotification.find({ 
          user: userId,
          expiresAt: { $gt: new Date() } // Only fetch non-expired notifications
        })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);
  
        const totalCount = await AdminNotification.countDocuments({ 
          user: userId,
          expiresAt: { $gt: new Date() }
        });
  
        const groupedNotifications = groupNotifications(notifications);
  
        res.status(200).json({
          success: true,
          notifications: groupedNotifications,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalNotifications: totalCount
        });
      } catch (error) {
        console.error('Error in getUserNotifications:', error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch user notifications",
          errorCode: "FETCH_NOTIFICATIONS_FAILED"
        });
      }
    }
  );
  export const markNotificationAsRead = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      const { notificationId } = req.params;
  
      try {
        const notification = await AdminNotification.findByIdAndUpdate(
          notificationId,
          { read: true },
          { new: true }
        );
  
        if (!notification) {
          return res.status(404).json({
            success: false,
            message: "Notification not found",
            errorCode: "NOTIFICATION_NOT_FOUND"
          });
        }
  
        res.status(200).json({
          success: true,
          message: "Notification marked as read",
          notification
        });
      } catch (error) {
        console.error('Error in markNotificationAsRead:', error);
        res.status(500).json({
          success: false,
          message: "Failed to mark notification as read",
          errorCode: "MARK_READ_FAILED"
        });
      }
    }
  );
  

// Get all notifications (for admin)
export const getAllNotifications = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const notifications = await AdminNotification.find()
                .sort({ createdAt: -1 }) // Sort by creation date, newest first
                .limit(100); // Limit to 100 notifications, adjust as needed
                const totalCount = await AdminNotification.countDocuments();

            res.status(200).json({
                success: true,
                notifications,
                totalCount
            });
        } catch (error) {
            console.error('Error in getAllNotifications:', error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch all notifications"
            });
        }
    }
);




export const clearNotificationsOfUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        errorCode: "MISSING_USER_ID"
      });
    }

    try {
      // Delete user-specific read notifications
      const deleteResult = await AdminNotification.deleteMany({
        user: userId,
        read: true
      });

      // Mark global notifications as read for this user
      const updateResult = await AdminNotification.updateMany(
        { isGlobal: true, read: false },
        { $addToSet: { readBy: userId } }
      );

      const totalAffected = deleteResult.deletedCount + updateResult.modifiedCount;

      console.log(`Cleared ${totalAffected} notifications for user ${userId}`);

      const io = getIO();
      if (io) {
        io.to(userId).emit('notificationsCleared', { clearedCount: totalAffected });
      }

      res.status(200).json({
        success: true,
        message: "Notifications cleared successfully",
        clearedCount: totalAffected
      });
    } catch (error) {
      console.error('Error in clearNotifications:', error);
      res.status(500).json({
        success: false,
        message: "Failed to clear notifications",
        errorCode: "CLEAR_NOTIFICATIONS_FAILED"
      });
    }
  }
);
//clear all notifcation for all uers


export const clearAllNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AdminNotification.deleteMany({
        $or: [
          { read: true },
          { expiresAt: { $lte: new Date() } }
        ]
      });

      const io = getIO();
      if (io) {
        io.emit('allNotificationsCleared', { clearedCount: result.deletedCount });
      }

      res.status(200).json({
        success: true,
        message: "All notifications cleared successfully",
        clearedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error in clearAllNotifications:', error);
      res.status(500).json({
        success: false,
        message: "Failed to clear all notifications",
        errorCode: "CLEAR_ALL_NOTIFICATIONS_FAILED"
      });
    }
  }
);
// Get total count of notifications
export const getNotificationCount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        errorCode: "MISSING_USER_ID"
      });
    }

    try {
      const currentDate = new Date();

      // Count user-specific notifications
      const userNotifications = await AdminNotification.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            expiresAt: { $gt: currentDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] }
            }
          }
        }
      ]);

      // Count admin-sent notifications to all users
      const globalNotifications = await AdminNotification.aggregate([
        {
          $match: {
            user: { $exists: false },  // Notifications without a specific user
            expiresAt: { $gt: currentDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] }
            }
          }
        }
      ]);

      // Combine the counts
      const userCounts = userNotifications[0] || { totalCount: 0, unreadCount: 0 };
      const globalCounts = globalNotifications[0] || { totalCount: 0, unreadCount: 0 };

      const totalCount = userCounts.totalCount + globalCounts.totalCount;
      const unreadCount = userCounts.unreadCount + globalCounts.unreadCount;

      res.status(200).json({
        success: true,
        totalCount,
        unreadCount,
        userSpecificCount: userCounts.totalCount,
        userSpecificUnreadCount: userCounts.unreadCount,
        globalCount: globalCounts.totalCount,
        globalUnreadCount: globalCounts.unreadCount
      });
    } catch (error) {
      console.error('Error in getNotificationCount:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get notification count",
        errorCode: "GET_COUNT_FAILED"
      });
    }
  }
);