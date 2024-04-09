import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import AppDataSource from "../DataSource/app-data-source";
import asyncWrapper from "../async-wrapper";
import { User, UserRole } from "../models/User";
import { BadRequestError } from "../errors";
import { Resend } from "resend";
import { generateOTP, transport } from "../utils/utils";
import { OTPHolder } from "../models/OtpHolder";
import { UserProfile } from "../models/UserProfile";
import { v2 as cloudinary } from "cloudinary";
import { error, profile } from "console";
import { SentMessageInfo } from "nodemailer";
import { validationResult } from "express-validator";

export const register = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      res.status(400).json({errors:errors.array().map((error:any)=> {
        return `${error.path} + " "+ ${error.msg} + " "`
      })})
      return;
    }
    const { email, password, name } = req.body;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { email },
    });
    if (user) {
      throw new BadRequestError("User Already Exists");
    }
    let otpExists = await AppDataSource.getRepository(OTPHolder).findOne({
      where: { email },
    });
    if (otpExists) {
      throw new BadRequestError("OTP already sent");
    }
    const otp = generateOTP();

    const otpHolder = await AppDataSource.getRepository(OTPHolder).save({
      name,
      email,
      password,
      otp,
      createdAt: new Date(),
    });
    const mailOptions = {
      from: "onboarding@resend.dev",
      to: email,
      subject: "OTP for registration",
      text: `Your OTP is ${otp} valid for 3 minutes`,
    };

    transport.sendMail(
      mailOptions,
      (err: Error | null, info: SentMessageInfo) => {
        if (err) {
          next(err);
          return;
        } else {
          res.status(200).json({ message: `OTP sent to your ${email}` });
        }
      }
    );
  }
);

export const verifyOTP = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty() ) {
      res.status(400).json({errors:errors.array().map((error:any)=> {
        return `${error.path} + " "+ ${error.msg} + " "`
      })})
      return;
    }
    const otpHolder = await AppDataSource.getRepository(OTPHolder).findOne({
      where: { email, otp },
    });
    if (!otpHolder) {
      throw new BadRequestError("Invalid OTP");
    }
    const password = otpHolder.password;
    const name = otpHolder.name;
    let user = new User();
    user.name = name;
    user.email = email;
    user.password = password;
    user = await AppDataSource.getRepository(User).save(user);
    const userProfile = new UserProfile();
    userProfile.profilePicture = "";
    userProfile.user = user;
    await AppDataSource.getRepository(UserProfile).save(userProfile);
    await AppDataSource.getRepository(OTPHolder).delete({ email, otp });
    await AppDataSource.getRepository(User).update(
      { id: user.id },
      {
        profile: userProfile,
      }
    );
    const token = user.generateToken();
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({ message: "User Registered" });
  }
);

export const signIn = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      res.status(400).json({errors:errors.array().map((error:any)=> {
        return `${error.path} + " "+ ${error.msg} + " "`
      })})
      return;
    }
    const user = await AppDataSource.getRepository(User).findOne({
      where: { email },
    });
    if (!user) {
      throw new BadRequestError("Invalid credentials");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new BadRequestError("Invalid credentials");
    }
    const otp = generateOTP();
    const otpHolder = await AppDataSource.getRepository(OTPHolder).save({
      email,
      otp,
      name: user.name,
      createdAt: new Date(),
      password: "",
    });
    const mailOptions = {
      from: "onboarding@resend.dev",
      to: email,
      subject: "OTP for login",
      text: `Your OTP is ${otp} valid for 3 minutes`,
    };
    transport.sendMail(
      mailOptions,
      (err: Error | null, info: SentMessageInfo) => {
        if (err) {
          next(err);
          return;
        } else {
          res.status(200).json({ message: `OTP sent to your ${email}` });
        }
      }
    );
  }
);

export const verifyLoginOTP = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      res.status(400).json({errors:errors.array().map((error:any)=> {
        return `${error.path} + " "+ ${error.msg} + " "`
      })})
      return;
    }
    const otpHolder = await AppDataSource.getRepository(OTPHolder).findOne({
      where: { email, otp },
    });
    if (!otpHolder) {
      throw new BadRequestError("Invalid OTP");
    }
    await AppDataSource.getRepository(OTPHolder).delete({ email, otp });
    const user = await AppDataSource.getRepository(User).findOne({
      where: { email },
    });
    if (!user) {
      throw new BadRequestError("Invalid OTP");
    }
    const token = user.generateToken();
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.status(200).json({ message: "User login successful  " });
  }
);

export const logout = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("auth_token", "", { expires: new Date(0) });
  }
);

export const validateToken = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: req.userId });
  }
);

export const getUser = asyncWrapper(
  asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(req.userId) },
      select: ["id", "name", "email", "role"],
    });
    res.status(200).json(user);
  })
);
export const updateUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(req.userId) },
      relations: ["profile"],
    });
    if (!user) {
      throw new BadRequestError("User not found");
    }
    const userProfile = await AppDataSource.getRepository(UserProfile).findOne({
      where: { id: Number(user.profile.id) },
    });

    let { name, password, profilePicture } = req.body;
    if (password) {
      password = bcrypt.hashSync(password, 10);
    }
    const updatedUser = {
      name: name || user.name,
      password: password || user.password,
    };
    console.log(updatedUser);

    if (profilePicture) {
      if (userProfile?.profilePicture) {
        //delete the existing profile Picture from cloudinaty
        const publicId: string =
          userProfile.profilePicture.split("/").pop()?.split(".")[0] || "";
        await cloudinary.uploader.destroy(publicId);
      }
      const uploadResponse = await cloudinary.uploader.upload(profilePicture);
      profilePicture = uploadResponse.url;
    }

    await AppDataSource.getRepository(User)
      .createQueryBuilder()
      .update(User)
      .set({
        name: updatedUser.name,
        password: updatedUser.password,
      })
      .where("id = :id", { id: req.userId })
      .execute();

    if (profilePicture) {
      await AppDataSource.getRepository(UserProfile)
        .createQueryBuilder()
        .update(UserProfile)
        .set({ profilePicture })
        .where("id=:id", { id: Number(user.profile.id) })
        .execute();
    }

    res.status(200).json({ message: "User Updated Successfully" });
  }
);

export const updateEmail = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const errors =validationResult(req);
    if(!errors.isEmpty()) {
      res.status(400).json({errors:errors.array().map((error:any)=> {
        return `${error.path} + " "+ ${error.msg} + " "`
      })})
      return;
    }
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(req.userId) },
      relations: ["profile"],
    });
    if (!user) {
      throw new BadRequestError("User not found");
    }
    if (user.email === email) {
      throw new BadRequestError("Email already exists");
    }
    const otp = generateOTP();
    const otpHolder = await AppDataSource.getRepository(OTPHolder).save({
      email,
      otp,
      name: user.name,
      password: "",
      createdAt: new Date(),
    });
    //
    const mailOptions = {
      from: "onboarding@resend.dev",
      to: email,
      subject: "OTP for email update",
      text: `Your OTP is ${otp} valid for 3 minutes`,
    };
    transport.sendMail(
      mailOptions,
      (err: Error | null, info: SentMessageInfo) => {
        if (err) {
          next(err);
          return;
        } else {
          res.status(200).json({ message: `OTP sent to your ${email}` });
        }
      }
    );
  }
);

export const validateEmailUpdate = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      res.status(400).json({errors:errors.array().map((error:any)=> {
        return `${error.path} + " "+ ${error.msg} + " "`
      })})
      return;
    }

    const otpHolder = await AppDataSource.getRepository(OTPHolder).findOne({
      where: { email, otp },
    });
    if (!otpHolder) {
      throw new BadRequestError("Invalid OTP");
    }
    const updateUser = {
      email,
    };
    await AppDataSource.getRepository(User)
      .createQueryBuilder()
      .update(User)
      .set({ email: updateUser.email })
      .where("id = :id", { id: Number(req.userId) })
      .execute();
    await AppDataSource.getRepository(OTPHolder).delete({ email, otp });
    res.status(200).json({ message: "Email updated successfully" });
  }
);

export const passwordReset = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(req.userId) },
    });
    if (!user) {
      throw new BadRequestError("User not found");
    }
    const otp = generateOTP();
    const otpHolder = await AppDataSource.getRepository(OTPHolder).save({
      email: user.email,
      otp,
      name: user.name,
      password: "",
      createdAt: new Date(),
    });

    const mailOptions = {
      from: "onboarding@resend.dev",
      to: user?.email,
      subject: "OTP for password reset",
      text: `Your OTP is ${otp} valid for 3 minutes`,
    };
    transport.sendMail(
      mailOptions,
      (err: Error | null, info: SentMessageInfo) => {
        if (err) {
          next(err);
          return;
        } else {
          res.status(200).json({ message: `OTP sent to your ${user?.email}` });
        }
      }
    );
  }
);

export const validatePasswordReset = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    let { password, otp } = req.body;

    if (!password) {
      throw new BadRequestError("Password is required");
    }
    password = bcrypt.hashSync(password, 10);

    if (!otp) {
      throw new BadRequestError("OTP is required");
    }
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(req.userId) },
    });
    if (!user) {
      throw new BadRequestError("User not found");
    }
    const otpHolder = await AppDataSource.getRepository(OTPHolder).findOne({
      where: { email: user.email, otp },
    });
    if (!otpHolder) {
      throw new BadRequestError("Invalid OTP");
    }
    await AppDataSource.getRepository(User)
      .createQueryBuilder()
      .update(User)
      .set({ password })
      .where("id=:id", { id: req.userId })
      .execute();
    res.status(200).json({ message: "Password update succesfully" });
  }
);

export const registerSuperAdmin = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body;
    const errors =validationResult(req);
    if(!errors.isEmpty()) {
      res.status(400).json({errors:errors.array().map((error:any)=> {
        return `${error.path} + " "+ ${error.msg} + " "`
      })})
      return;
    }
    const user = await AppDataSource.getRepository(User).findOne({
      where: { email },
    });
    if (user) {
      throw new BadRequestError("User already exists");
    }
    const otp = generateOTP();
    const otpHolder = await AppDataSource.getRepository(OTPHolder).save({
      email,
      otp,
      name,
      password,
      createdAt: new Date(),
    });

    const mailOptions = {
      from: "onboarding@resend.dev",
      to: email,
      subject: "OTP for superadmin registration",
      text: `Your OTP is ${otp} valid for 3 minutes`,
    };
    transport.sendMail(
      mailOptions,
      (err: Error | null, info: SentMessageInfo) => {
        if (err) {
          next(err);
          return;
        } else {
          res.status(200).json({ message: `OTP sent to your ${email}` });
        }
      }
    );
  }
);

export const verifySuperAdmin = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const otpHolder = await AppDataSource.getRepository(OTPHolder).findOne({
      where: { email, otp },
    });
    if (!otpHolder) {
      throw new BadRequestError("Invalid OTP");
    }
    const user = await AppDataSource.getRepository(User).save({
      email: otpHolder.email,
      password: otpHolder.password,
      name: otpHolder.name,
      role: UserRole.SUPERADMIN,
    });
    let userProfile = new UserProfile();
    userProfile.profilePicture = "";
    await AppDataSource.getRepository(UserProfile).save(userProfile);
    await AppDataSource.getRepository(OTPHolder).delete({ email, otp });
    await AppDataSource.getRepository(User).update(
      { id: user.id },
      {
        profile: userProfile,
      }
    );

    res.status(201).json({ message: "SuperAdmin Registered Sucessfully" });
  }
);
