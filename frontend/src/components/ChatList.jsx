import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import Avatar from "./Avatar";
import toast from 'react-hot-toast'

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-5 h-5">
        <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
    </svg>
);

const ChatListItem = ({ chat, isSelected, onSelect, isOnline }) => {
  const { user } = useAuthStore();
  const { deleteChat } = useChatStore();

  const getChatDetails = () => {
    if (chat.isGroupChat) {
      return { name: chat.name };
    }
    const otherUser = chat.participants.find((p) => p._id !== user._id);
    return { name: otherUser?.name || "Unknown User" };
  };

  const { name } = getChatDetails();
  
  // --- UI IMPROVEMENT: Logic for the last message ---
  const lastMessageText = chat.lastMessage?.content
    ? chat.lastMessage.content.length > 25 // Slightly shorter for better fit
      ? chat.lastMessage.content.substring(0, 50) + "..."
      : chat.lastMessage.content
    : "No messages yet";

  let lastMessagePrefix = "";
  if (chat.lastMessage) {
    if (chat.lastMessage.sender._id === user._id) {
      lastMessagePrefix = "You: ";
    } else if (chat.isGroupChat) {
      // Show sender name for group chats if it wasn't you
      const senderName = chat.lastMessage.sender.name.split(" ")[0]; // Just the first name
      lastMessagePrefix = `${senderName}: `;
    }
  }

  const canDelete = !chat.isGroupChat || (chat.isGroupChat && user._id === chat.admin?._id);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat permanently? This action cannot be undone.")) {
      deleteChat(chat._id);
      toast.success("Chat deleted successfully!")
    }
  };

  return (
    // --- UI OVERHAUL: Theme-aware, better spacing and hover effects ---
    <div
      onClick={onSelect}
      className={`group flex items-center p-3 cursor-pointer transition-colors duration-200 rounded-lg mx-2 my-2 ${
        isSelected
          ? "bg-zinc-200 dark:bg-zinc-700" 
          : "hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
      }`}
    >
      <div className="relative mr-3 flex-shrink-0">
        <Avatar name={name} />
        {isOnline && !chat.isGroupChat && (
          <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-zinc-800"></span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${isSelected ? 'text-zinc-800 dark:text-white' : 'text-slate-700 dark:text-zinc-200'}`}>
          {name}
        </p>
        <p className={`text-sm truncate ${isSelected ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="font-medium">{lastMessagePrefix}</span>
          {lastMessageText}
        </p>
      </div>
      {canDelete && (
        <button
          onClick={handleDelete}
          className="ml-2 p-1.5 flex-shrink-0 text-zinc-400 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 hover:text-red-500 dark:hover:text-red-500"
          title="Delete Chat"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

export default function ChatList() {
  const { chats, fetchChats, selectChat, selectedChat, toggleModal, onlineUsers } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    // --- UI OVERHAUL: Light mode support and cleaner overall look ---
    <div className="w-1/3 bg-white dark:bg-zinc-800 flex flex-col border-r border-zinc-200 dark:border-zinc-700">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={toggleModal}
          className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-600 transition-colors duration-200"
        >
          New Conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
        {chats.map((chat) => {
          const otherUser = chat.isGroupChat ? null : chat.participants.find((p) => p._id !== user._id);
          const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;
          return (
            <ChatListItem
              key={chat._id}
              chat={chat}
              isSelected={selectedChat?._id === chat._id}
              onSelect={() => selectChat(chat)}
              isOnline={isOnline}
            />
          );
        })}
      </div>
    </div>
  );
}