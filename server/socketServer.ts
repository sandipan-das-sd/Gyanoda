// import { Server as SocketIOServer } from 'socket.io';
// import http from "http";
// import { adminUserNotification, sendNotificationToAllUsers } from './controllers/admin_user_notification.controller';

// export const initSocketServer = (server: http.Server) => {
//   const io = new SocketIOServer(server);

//   io.on("connection", (socket) => {
//     console.log("A user connected");

//     // Listen for 'notification' event from the frontend
//     socket.on("notification", (data) => {
//       // Broadcast the notification data to all connected clients (admin dashboard)
//       io.emit("newNotification", data);
//     });

//     socket.on("disconnect", () => {
//       console.log("A user disconnected");
//     });
//   });
// };
import { Server as SocketIOServer } from 'socket.io';
import http from "http";
import { adminUserNotification, sendNotificationToAllUsers } from './controllers/admin_user_notification.controller';

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server);

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Listen for 'notification' event from the frontend
    socket.on("notification", (data) => {
      // Broadcast the notification data to all connected clients (admin dashboard)
      io.emit("newNotification", data);
    });

    // Join a room based on the user's ID
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Admin sending notification to a specific user
    socket.on('adminNotification', async (data) => {
      try {
        const { userId, textNotification, imageNotification, linkNotification } = data;
        const req = { body: { userId, textNotification, imageNotification, linkNotification } };
        const res = {
          status: (code: number) => ({
            json: (data: any) => {
              console.log('Admin notification sent:', data);
              socket.emit('adminNotificationSent', data);
            }
          })
        };
        await adminUserNotification(req as any, res as any, () => {});
      } catch (error) {
        console.error('Error sending admin notification:', error);
        socket.emit('adminNotificationError', { message: 'Failed to send notification' });
      }
    });

    // Admin sending notification to all users
    socket.on('adminNotificationAll', async (data) => {
      try {
        const { textNotification, imageNotification, linkNotification } = data;
        const req = { body: { textNotification, imageNotification, linkNotification } };
        const res = {
          status: (code: number) => ({
            json: (data: any) => {
              console.log('Admin notification sent to all:', data);
              socket.emit('adminNotificationAllSent', data);
            }
          })
        };
        await sendNotificationToAllUsers(req as any, res as any, () => {});
      } catch (error) {
        console.error('Error sending admin notification to all users:', error);
        socket.emit('adminNotificationAllError', { message: 'Failed to send notification to all users' });
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return {
    io,
    getIO: () => io
  };
};