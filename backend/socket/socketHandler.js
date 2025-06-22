import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { User } from '../models/user.model.js';
import { ChatMessage } from "../models/chatMessage.model.js"; 
import { Chat } from "../models/chat.model.js"; 

const onlineUsers = new Set();
const userSocketMap = {}; // { userId: socket.id }

export const initializeSocket = (io) => {

  io.use(async(socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error('No cookies found'));
    }
    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.token;

    if (!token) {
      return next(new Error('No token found'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }
        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new Error('User not found'));
        }
        socket.user = { userId: user._id, username: user.name }; // Attach user info to socket object
        next();
    }catch (error) {
        return next(new Error('Token verification failed'));
    }
  });

  // The helper function approach is cleaner than passing io through every middleware. By attaching it to io itself and io to the app, we can access it from the req.app.get('io') in the controller.
  io.emitChatDeleted = (chat) => {
    chat.participants.forEach(participantId => {
      const participantSocketId = userSocketMap[participantId.toString()];
      if (participantSocketId) {
        io.to(participantSocketId).emit("chatDeleted", { chatId: chat._id });
      }
    });
  };

  io.emitNewChat = (chat , creatorId) => {
    chat.participants.forEach(participant => {
      // Find the socket of the participant
      if (participant._id.toString() !== creatorId.toString()) {
        const participantSocketId = userSocketMap[participant._id.toString()];
        // If they are online, send them the new chat object
        if (participantSocketId) {
          io.to(participantSocketId).emit("newChat", chat);
        }
      }
    });
  };

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.user.username); // Good for debugging
    
    onlineUsers.add(socket.user.userId.toString());
    userSocketMap[socket.user.userId.toString()] = socket.id;

    // Broadcast the updated list to EVERYONE (updates existing clients)
    io.emit("onlineUsers", Array.from(onlineUsers));
    console.log("Online users:", Array.from(onlineUsers));

    // Also, send the list directly to the user who just connected.
    // This solves the race condition where the client might not be ready for the global broadcast.
    socket.emit("onlineUsers", Array.from(onlineUsers));

    socket.on("join", (chatId) => {
      console.log(`User ${socket.user.username} joined chat ${chatId}`); // Good for debugging
      socket.join(chatId);
    });

    socket.on("sendMessage", async ({ chatId, content }) => {
      if (!content || !chatId) {
        // You can emit an error back to the client if you want
        return;
      }
      
      try {
        // 1. Create and save the new message
        const message = await ChatMessage.create({
          sender: socket.user.userId,
          content: content,
          chat: chatId,
        });
      
        // 2. Populate the sender information
        const populatedMessage = await message.populate(
          "sender",
          "name email"
        );

        // 3. Update the last message of the chat
        const chat = await Chat.findByIdAndUpdate(
          chatId, 
          { lastMessage: populatedMessage._id },
          { new: true } // Return the updated document
        );

        if (!chat) return;

        // Instead of emitting to a room, we'll emit to each participant's socket directly.
        chat.participants.forEach(participantId => {
          const participantSocketId = userSocketMap[participantId.toString()];
          
          // Check if the participant is online
          if (participantSocketId) {
            // Emit the message directly to this user's socket
            io.to(participantSocketId).emit("newMessage", populatedMessage);
          }
        });

      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    socket.on("typing_start", ({ chatId }) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.broadcast.to(chatId).emit("typing_start", {
        chatId: chatId,
        user: socket.user,
      });
    });

    socket.on("typing_stop", ({ chatId }) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.broadcast.to(chatId).emit("typing_stop", {
        chatId: chatId,
        user: socket.user,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user.username);
      onlineUsers.delete(socket.user.userId.toString());
      delete userSocketMap[socket.user.userId.toString()];
      io.emit("onlineUsers", Array.from(onlineUsers));
      console.log("Online users:", Array.from(onlineUsers));
    });
  });
};
