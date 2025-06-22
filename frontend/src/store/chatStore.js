import {create} from "zustand";
import axios from "axios";


const API_URL = import.meta.env.MODE === "development" ? 'http://localhost:5000/api/chats' : "/api/chats"; // Adjust the API URL based on the environment
axios.defaults.withCredentials = true; 

export const useChatStore = create((set, get) => ({
  chats: [], // <-- NEW: To store the list of conversations
  users: [],
  selectedChat: null,
  messages: [],
  typingUsers: {}, // { chatId: ['username1', 'username2'] }
  isModalOpen: false, // <-- NEW: To control the "Add Chat" modal
  isGroupInfoModalOpen: false,
  onlineUsers: [], // <-- NEW: To store IDs of online users

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  openGroupInfoModal: () => set({ isGroupInfoModalOpen: true }),
  closeGroupInfoModal: () => set({ isGroupInfoModalOpen: false }),
  
  fetchChats: async () => {
    try {
      const res = await axios.get(API_URL);
      set({ chats: res.data.data });
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  },

  createChat : async (payload) => {
    try {
      const res = await axios.post(API_URL, payload);
      return res.data.data;
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  },

  fetchUsers: async () => {
    try {
      const res = await axios.get(`${API_URL}/allusers`);
      set({ users: res.data.data });
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  },

  selectChat: (chat) => {
    set({ selectedChat: chat , messages: []});
    get().fetchMessages(chat._id);
  },

  fetchMessages: async (chatId) => {
    try { 
      const res = await axios.get(`${API_URL}/${chatId}/messages`);
      set({ messages: res.data.data });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  },

  // This is called by the API response for the user who *created* the chat
  addChat: (chat) => {
    set((state) => ({ chats: [chat, ...state.chats] }));
    get().selectChat(chat); // Automatically select the new chat
  },

  // This is called by the socket event for all *other* participants
  addNewChat: (newChat) => {
    set((state) => {
        // Prevent adding a duplicate if it already exists (edge case)
        if (state.chats.some(chat => chat._id === newChat._id)) {
            return state;
        }
        // Add the new chat to the top of the list
        return {
            chats: [newChat, ...state.chats]
        };
    });
  },

  addMessage: (message) => {
    set(state => {
      const updatedChats = state.chats.map(chat => {
          if (chat._id === message.chat) {
            // We update `updatedAt` to the new message's creation time to ensure it sorts to the top
            return { ...chat, lastMessage: message , updatedAt: message.createdAt};
          }
          return chat;
      });
      // Sort to bring the updated chat to the top
      updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      // If the message is for the currently selected chat, add it to the message window
      if (state.selectedChat?._id === message.chat) {
        return {
          messages: [...state.messages, message],
          chats: updatedChats,
        };
      } else {
        // Otherwise, just update the chat list and don't touch the open messages
        return {
          chats: updatedChats,
        };
      }
    });
  },

  setTypingUser: (chatId, user) => {
    set((state) => {
      const usersInChat = state.typingUsers[chatId] || [];
      // Avoid adding duplicates
      if (!usersInChat.find(u => u.userId === user.userId)) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [chatId]: [...usersInChat, user],
          },
        };
      }
      return state; // No change needed
    });
  },

  removeTypingUser: (chatId, user) => {
    set((state) => {
      const usersInChat = state.typingUsers[chatId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: usersInChat.filter((u) => u.userId !== user.userId),
        },
      };
    });
  },

  deleteChat: async (chatId) => {
    try {
      await axios.delete(`${API_URL}/${chatId}`);
      // We don't need to update state here. The socket event will handle it.
      // This ensures all participants' UI updates consistently.
    } catch (error) {
      console.error("Failed to delete chat:", error);
      alert("Error: " + (error.response?.data?.data || "Could not delete chat."));
    }
  },

  removeChat: (chatId) => {
    set((state) => {
      // If the deleted chat is the currently selected one, unselect it.
      const newSelectedChat = state.selectedChat?._id === chatId ? null : state.selectedChat;
      return {
        chats: state.chats.filter(chat => chat._id !== chatId),
        selectedChat: newSelectedChat,
        messages: newSelectedChat ? state.messages : [], // Clear messages if chat is deselected
      };
    });
  }

}));
