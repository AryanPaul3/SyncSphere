import { io } from "socket.io-client";

const URL = import.meta.env.MODE ==='development' ? "http://localhost:5000" : "/";
const socket = io(URL, {
    autoConnect: false,
  withCredentials: true,
});


export default socket;
