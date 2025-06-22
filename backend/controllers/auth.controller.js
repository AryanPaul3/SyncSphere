import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail  , sendWelcomeEmail , sendResetPasswordEmail , sendResetSuccessEmail} from "../NodeMailer/email.js";

export const Signup = async (req , res)=> {
    const {name , email , password} = req.body;
    try {
        if (!name || !email || !password) {
            throw new Error("Please add all fields");
        }
        const userAlreadyExists = await User.findOne({email});

        if (userAlreadyExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit verification token

        const user = await User ({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        });
        await user.save();

        // jwt token generation can be added here for user authentication
        generateTokenAndSetCookie(res , user._id);

        await sendVerificationEmail(user.email, verificationToken , user.name); 

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc, // Spread operator to include all user fields except password
                password: undefined, // Exclude password from response
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const VerifyEmail = async (req, res) => {
    const {code} = req.body;

    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: new Date() } // Check if token is still valid
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            });
        }
        user.isVerified = true;
        user.verificationToken = undefined; // Clear the verification token
        user.verificationTokenExpiresAt = undefined; // Clear the expiration time
        await user.save();

        await sendWelcomeEmail(user.email , user.name); 

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc, 
                password: undefined, 
            }
        });

    } catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const Login = async (req , res)=> {
    const {email , password} = req.body;
    try {
        if (!email || !password) {
            throw new Error("Please add all fields");
        }
        const user =  await User.findOne({email});
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }
        const isPasswordCorrect = await bcryptjs.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password"
            });
        }
        generateTokenAndSetCookie(res , user._id);
        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: {
                ...user._doc, // Spread operator to include all user fields except password
                password: undefined, // Exclude password from response
            }
        });

    } catch (error) {
        console.log("Error logging in:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}
export const Logout = async (req , res)=> {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            throw new Error("Please provide an email address");
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }
        const resetToken = crypto.randomBytes(20).toString("hex"); // Generate a random token
        const resetTokenExpiresAt = Date.now() + 1 * 15 * 60 * 1000; 
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt; // 15 minutes from now
        await user.save();

        // Here you would send the reset token to the user's email
        await sendResetPasswordEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}` , user.name);

        res.status(200).json({
            success: true,
            message: "Reset password link sent to email",
        });

    } catch (error) {
        console.error("Error in forgot password:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() } // Check if token is still valid
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined; // Clear the reset token
        user.resetPasswordExpiresAt = undefined; // Clear the expiration time
        await user.save();

        await sendResetSuccessEmail(user.email , user.name); 

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });

    } catch (error) {
        
    }
}

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            user: {
                ...user._doc, 
                password: undefined, 
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}