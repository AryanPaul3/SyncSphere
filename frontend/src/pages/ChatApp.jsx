import { useEffect } from "react";
import { useChatStore } from "../store/chatStore"; 
import socket from "../socket"; 

import Header from "../components/Header";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import AddChatModal from "../components/AddChatModal";


export default function ChatApp() {
  const { setOnlineUsers , addMessage , removeChat , addNewChat } = useChatStore();

  useEffect(() => {

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };
    const handleNewMessage = (message) => {
      addMessage(message);
    };
    const handleChatDeleted = ({ chatId }) => removeChat(chatId);
    const handleNewChat = (chat) => addNewChat(chat);

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("newMessage", handleNewMessage);
    socket.on("chatDeleted", handleChatDeleted);
    socket.on("newChat", handleNewChat);

    socket.connect();

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("newMessage", handleNewMessage);
      socket.off("chatDeleted", handleChatDeleted);
      socket.off("newChat", handleNewChat);
      socket.disconnect();
    };
  }, [setOnlineUsers, addMessage , removeChat , addNewChat]);

  return (
    <div className="h-screen bg-zinc-100 dark:bg-zinc-900 flex flex-col">
      <AddChatModal />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ChatList />
        <ChatWindow />
      </div>
    </div>
  );
}
