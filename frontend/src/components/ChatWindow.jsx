import { useChatStore } from "../store/chatStore.js";
import { useAuthStore } from "../store/authStore.js";
import { useEffect, useRef, useState } from "react";
import socket from "../socket.js";
import { format, isToday, isYesterday } from "date-fns";
import GroupInfoModal from "./GroupInfoModal.jsx";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo"

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor" className="w-5 h-5">
      <path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z"/>
    </svg>
);

const formatTimestamp = (date) => {
    const d = new Date(date);
    if (isToday(d)) {
        return format(d, 'p'); // '12:03 PM'
    }
    if (isYesterday(d)) {
        return `Yesterday at ${format(d, 'p')}`;
    }
    return format(d, 'MMM d, yyyy, p'); // 'Jul 2, 2024, 12:03 PM'
};


export default function ChatWindow() {
  const { 
    selectedChat, 
    messages, 
    typingUsers, 
    setTypingUser, 
    removeTypingUser,
    openGroupInfoModal,
    onlineUsers
  } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) return;

    // Join the chat room
    socket.emit("join", selectedChat._id);

    
    const handleTypingStart = ({ chatId, user: typingUser }) => {
      if (chatId === selectedChat._id) {
        setTypingUser(chatId, typingUser);
      }
    };
    const handleTypingStop = ({ chatId, user: typingUser }) => {
      if (chatId === selectedChat._id) {
        removeTypingUser(chatId, typingUser);
      }
    };

    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);

    // Clean up the listener when the component unmounts or the chat changes
    return () => {
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
    };
  }, [selectedChat, setTypingUser, removeTypingUser]); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleTyping = (e) => {
    setInput(e.target.value);

    // Auto-grow textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;

    // Emit "typing_start" on the first keypress
    if (!typingTimeoutRef.current) {
      socket.emit("typing_start", { chatId: selectedChat._id });
    }
    
    // Clear the previous timeout
    clearTimeout(typingTimeoutRef.current);

    // Set a new timeout to emit "typing_stop" after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { chatId: selectedChat._id });
      typingTimeoutRef.current = null; // Reset the ref
    }, 2000);
  };

  const handleSend = () => { 
    if (!input.trim() || !selectedChat) return;

    // The new, simplified send logic
    socket.emit("sendMessage", {
      chatId: selectedChat._id,
      content: input,
    });

    clearTimeout(typingTimeoutRef.current);
    socket.emit("typing_stop", { chatId: selectedChat._id });
    typingTimeoutRef.current = null;
    
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // --- NEW: Handle Enter and Shift+Enter in textarea ---
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        handleSend();
    }
  };


  const getChatDetails = () => {
    if (!selectedChat) return { name: "", otherUser: null };
    if (selectedChat.isGroupChat) {
      return { name: selectedChat.name, otherUser: null };
    }
    const otherUser = selectedChat.participants.find(p => p._id !== user._id);
    return { name: otherUser?.name || "Chat", otherUser };
  };

  const { name: chatTitle, otherUser } = getChatDetails();
  const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  if (!selectedChat) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        <div className="flex flex-col items-center text-center">
            {/* Use the Logo component with sizing and opacity classes */}
            <Logo className="w-24 h-24 mb-6 dark:opacity-40" />
            <h2 className="text-2xl font-semibold text-zinc-600 dark:text-zinc-300">Welcome to SyncSphere</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Select a conversation to start messaging.</p>
        </div>
      </div>
    );
  }

  const getTypingText = () => {
    const users = typingUsers[selectedChat._id] || [];
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].username} is typing...`;
    if (users.length === 2) return `${users[0].username} and ${users[1].username} are typing...`;
    return 'Several people are typing...';
  };

  return (
    <div className="relative flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-800">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm z-10">
        <div className="flex items-center gap-3">
            <Avatar name={chatTitle} />
            <div>
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{chatTitle}</h2>
                {!selectedChat.isGroupChat && (
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isOtherUserOnline ? 'bg-green-500' : 'bg-zinc-400'}`}></span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{isOtherUserOnline ? 'Online' : 'Offline'}</p>
                    </div>
                )}
            </div>
        </div>
        {selectedChat.isGroupChat && (
          <button 
            onClick={openGroupInfoModal}
            className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="View group info"
          >
            <UsersIcon />
          </button>
        )}
      </div>

      {/* Messages Area - this will be the scrollable part */}
      <div className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
        {messages.map((msg, index) => {
            const isMyMessage = msg.sender._id === user._id;
            const prevMessage = messages[index - 1];
            // Show avatar/name if it's the first message or if the sender is different from the previous one.
            const showSenderInfo = !prevMessage || prevMessage.sender._id !== msg.sender._id;

            return (
              <div
                key={msg._id}
                className={`group flex items-start gap-3 w-full ${isMyMessage ? 'flex-row-reverse pr-1' : ''} ${showSenderInfo ? 'mt-6' : 'mt-1'}`}
              >
                  {/* Avatar Column */}
                  {selectedChat.isGroupChat && !isMyMessage ? 
                  <div className="w-8 flex-shrink-0">
                      {!isMyMessage && showSenderInfo && <Avatar name={msg.sender.name} />}
                  </div> :
                  ""}
                  

                  {/* Message Content Column */}
                  <div className={`flex flex-col w-full ${isMyMessage ? 'items-end' : 'items-start'}`}>
                      {/* --- NEW: Show sender name only once for group chats --- */}
                      {showSenderInfo && !isMyMessage && selectedChat.isGroupChat && (
                          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-1 ml-2">{msg.sender.name}</p>
                      )}
                      <div
                        className={`relative max-w-lg rounded-2xl py-2 px-3  ${
                          isMyMessage
                            ? 'bg-teal-500 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {/* Message content with padding on the right to make space for the timestamp */}
                        <span className="break-words pr-16 whitespace-pre-wrap">{msg.content}</span>
                        
                        {/* Absolutely positioned timestamp */}
                        <span
                          className={`absolute bottom-1.5 right-3 text-xs ${
                            isMyMessage
                              ? 'text-teal-100'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                          style={{
                            textShadow: isMyMessage ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          {format(new Date(msg.createdAt), 'p')}
                        </span>
                      </div>
                  </div>
              </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>


      {/* Typing Indicator */}
      {getTypingText()? 
        <div className="h-6 px-6 text-sm text-zinc-500 dark:text-zinc-200 italic">
          {getTypingText() && <span className="animate-pulse">{getTypingText()}</span>}
        </div>
        : ""
      }

      {/* Message Input */}
      <div className="p-4 ">
        <div className="flex items-start bg-zinc-200 dark:bg-zinc-700 rounded-3xl m-auto">
          {/* --- NEW: Changed input to textarea for multiline support --- */}
          <textarea
            className="flex-1 bg-transparent p-3 focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 resize-none overflow-y-auto max-h-40"
            rows="1"
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            ref={textareaRef}
          />
          <button
            className="p-3 self-end text-zinc-500 dark:text-zinc-400 hover:text-teal-500 transition-colors disabled:opacity-50 disabled:hover:text-zinc-400"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
      <GroupInfoModal />
    </div>
  );
}