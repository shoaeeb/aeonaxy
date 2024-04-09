import crypto from "crypto";
import { Resend } from "resend";
import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.email,
    pass: process.env.email_password,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const generateOTP = (): string => {
  const buffer = crypto.randomBytes(3);
  const otp = Math.abs(buffer.readIntLE(0, 3) % 1000000)
    .toString()
    .padStart(6, "0");
  return otp;
};

export { generateOTP, transport };
