import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import { initializeSocket } from './socket/socketHandler.js';

// const { connectDb } = require('./db/connectDb.js');
import { connectDb } from './db/connectDb.js';
import authRoutes from './routes/auth.route.js';
import chatRoutes from './routes/chat.route.js';

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

initializeSocket(io);

app.set('io', io); // Make io available to routes


app.use(cors({
  origin: 'http://localhost:5173', // your frontend URL
  credentials: true
}));

app.use(express.json());    // allows us to parse incomming requests : req.body
app.use(cookieParser()); // allows us to parse cookies from the request

// app.get('/', (req, res) => {    
//     res.send('Hello World!');
// });

app.use("/api/auth" , authRoutes)
app.use("/api/chats" , chatRoutes);

if(process.env.NODE_ENV === 'production') {
    // Serve static files from the React frontend app
    app.use(express.static(path.join(__dirname, '/frontend/dist')));
    
    app.get('*', (req, res) => {
        // Serve the index.html file for all routes
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));    
    });
}

server.listen(PORT, () => {
    connectDb();
    console.log('Server started on port ', PORT);
});
