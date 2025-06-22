import { trusted } from 'mongoose';
import { Chat } from '../models/chat.model.js';
import { ChatMessage } from '../models/chatMessage.model.js';
import { User } from '../models/user.model.js';

export const createChat = async (req, res) => {
  const { userIds, groupName } = req.body; // Expect an array of user IDs and an optional group name
  const myId = req.userId;

  if (!userIds || userIds.length === 0) {
    return res.status(400).json({ success: false, data: "User IDs are required" });
  }

  const allParticipants = [...new Set([...userIds, myId])]; // Use a Set to ensure no duplicate IDs

  // --- HANDLE 1-on-1 CHATS ---
  if (allParticipants.length === 2 && !groupName) {
    try {
      let chat = await Chat.findOne({
        isGroupChat: false,
        participants: { $all: allParticipants, $size: 2 }
      })
      .populate('participants', 'name email')
      .populate('admin', 'name email');

      if (!chat) {
        const newChatData = {
          isGroupChat: false,
          participants: allParticipants,
        };
        const createdChat = await Chat.create(newChatData);
        chat = await Chat.findById(createdChat._id).populate("participants", "name email").populate("admin", "name email");
        req.app.get('io').emitNewChat(chat , myId);
      }
      return res.status(200).json({ success: true, data: chat });
    } catch (err) {
      return res.status(500).json({ success: false, data: err.message });
    }
  }

  // --- HANDLE GROUP CHATS ---
  if (!groupName) {
    return res.status(400).json({ success: false, data: "Group name is required for group chats." });
  }

  try {
    const groupChat = await Chat.create({
      name: groupName,
      isGroupChat: true,
      participants: allParticipants,
      admin: myId, // The creator is the admin
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("participants", "name email")
      .populate("admin", "name email");
    
    req.app.get('io').emitNewChat(fullGroupChat , myId);
      
    return res.status(201).json({ success: true, data: fullGroupChat });

  } catch (err) {
    return res.status(500).json({ success: false, data: err.message });
  }
};

export const fetchUserChats = async (req, res) => {
  const myId = req.userId;
  try {
    const chats = await Chat.find({ participants: { $in: [myId] } })
      .populate("participants", "name email")
      .populate("admin", "name email")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name"
        }
      })
      .sort({ updatedAt: -1 }); // Sort by latest activity

    return res.status(200).json({ success: true, data: chats });
  } catch (err) {
    return res.status(500).json({ success: false, data: err.message });
  }
};

export const fetchMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await ChatMessage.find({ chat: chatId })
      .populate("sender", "name email") // <-- POPULATE THE SENDER HERE
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, data: err.message });
  }
};


export const fetchAllUsers = async (req, res) => {
    const myId = req.userId;
    try {
        const users = await User.find({ 
          _id: { $ne: myId } ,
          isVerified : true
        
        })
        .select('_id name email');
        return res.status(200).json({ success: true, data: users });
    } catch (err) {
        return res.status(500).json({ success: false, data: err.message });
    }  
}

export const deleteChat = async (req, res) => {
  const { chatId } = req.params;
  const myId = req.userId;

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, data: "Chat not found" });
    }

    // Authorization Check
    const isParticipant = chat.participants.some(p => p.toString() === myId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, data: "You are not a participant of this chat." });
    }

    if (chat.isGroupChat) {
      // For group chats, only the admin can delete
      if (chat.admin.toString() !== myId) {
        return res.status(403).json({ success: false, data: "Only the group admin can delete this chat." });
      }
    }
    // For 1-on-1 chats, any participant can delete, so the check passes.

    // Proceed with deletion
    // 1. Delete all messages in the chat
    await ChatMessage.deleteMany({ chat: chatId });

    // 2. Delete the chat itself
    await Chat.findByIdAndDelete(chatId);
    
    // The chat object is still in memory here, which is useful for the socket event
    req.app.get('io').emitChatDeleted(chat);

    return res.status(200).json({ success: true, data: "Chat deleted successfully." });

  } catch (err) {
    return res.status(500).json({ success: false, data: err.message });
  }
};


