import express from  "express";
import {
    Signup,
    Login,
    Logout,
    VerifyEmail,
    forgotPassword,
    resetPassword,
    checkAuth
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get('/check-auth' , verifyToken , checkAuth);

router.post('/signup' , Signup);
router.post('/logout' , Logout);
router.post('/login' , Login);

router.post('/verify-email',  VerifyEmail);
router.post('/forgot-password',forgotPassword);

router.post('/reset-password/:token' , resetPassword);


export default router;