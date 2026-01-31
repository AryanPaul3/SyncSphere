import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// export const transporter = nodemailer.createTransport({
//   service: "Gmail",
//   auth: {
//     user: process.env.NODEMAIL_EMAIL,         // your Gmail address
//     pass: process.env.NODEMAIL_PASS,       // the 16-character app password from Google
//   },
// });

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",   // Explicit host
  port: 587,                // Explicit port (standard for TLS)
  secure: false,            // true for 465, false for other ports
  auth: {
    user: process.env.NODEMAIL_EMAIL,
    pass: process.env.NODEMAIL_PASS,
  },
  // CRITICAL FIX: Force the connection to use IPv4 to prevent timeouts
  family: 4, 
});
