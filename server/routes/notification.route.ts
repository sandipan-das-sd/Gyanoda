import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import { getNotifications, updateNotification } from "../controllers/notification.controller";
import { adminUserNotification,sendNotificationToAllUsers,getAllNotifications,getUserNotifications,markNotificationAsRead,getNotificationCount, clearNotificationsOfUsers,clearAllNotifications } from "../controllers/admin_user_notification.controller";
import { send } from "process";
const notificationRoute = express.Router();

notificationRoute.get(
  "/get-all-notifications",
  isAutheticated,
  authorizeRoles("admin"),
  getNotifications
);
notificationRoute.put("/update-notification/:id", isAutheticated, authorizeRoles("admin"), updateNotification);

// Route to send notification to a specific user
notificationRoute.post(
  '/send-notification',
  isAutheticated,
  authorizeRoles('admin'),
  adminUserNotification
);

// Route to send notification to all users
notificationRoute.post(
  '/send-notification-all',
  isAutheticated,
  authorizeRoles('admin'),
  sendNotificationToAllUsers
);

// New route to get notifications for a specific user
notificationRoute.get(
  '/user-notifications/:userId',
  isAutheticated,
  getUserNotifications
);

// New route to get all notifications (for admin)
notificationRoute.get(
  '/all-notifications',
  isAutheticated,
  
  getAllNotifications
);

//mark notiifaction
notificationRoute.put(
  '/mark-notification-read/:notificationId',
  isAutheticated,
  markNotificationAsRead
);

notificationRoute.delete('/clear-notifications/:userId', isAutheticated, clearNotificationsOfUsers);
notificationRoute.delete('/notifications/clear-all', clearAllNotifications);
notificationRoute.get('/notification-count/:userId', isAutheticated, getNotificationCount);

export default notificationRoute;
