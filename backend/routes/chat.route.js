import express from 'express';
import { createChat , fetchUserChats , fetchMessages , fetchAllUsers , deleteChat } from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, createChat);
router.get('/', verifyToken, fetchUserChats);
router.get('/:chatId/messages', verifyToken, fetchMessages);
router.get('/allusers' , verifyToken, fetchAllUsers);
router.delete('/:chatId', verifyToken, deleteChat);

export default router;