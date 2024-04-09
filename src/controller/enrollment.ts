import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../async-wrapper";
import AppDataSource from "../DataSource/app-data-source";
import { User, UserRole } from "../models/User";
import { Enrollment } from "../models/Enrollment";
import { Course } from "../models/Course";
import { UserProfile } from "../models/UserProfile";
import { In } from "typeorm";

export const enrollInCourse = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id.toString();
    const userId = req.userId;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(userId) },
      relations: ["profile"],
    });

    console.log(user);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user?.role !== UserRole.USER) {
      res
        .status(403)
        .json({ message: "You are not authorized to enroll in a course" });
      return;
    }
    const userProfile = await AppDataSource.getRepository(UserProfile).findOne({
      where: { id: Number(user.profile.id) },
    });
    if (!userProfile) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const course = await AppDataSource.getRepository(Course).findOne({
      where: { id: Number(courseId) },
    });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    const enrollment = await AppDataSource.getRepository(Enrollment).findOne({
      where: { user: userProfile, course },
    });
    if (enrollment) {
      res
        .status(400)
        .json({ message: "You are already enrolled in this course" });
      return;
    }

    await AppDataSource.getRepository(Enrollment).save({
      user: userProfile,
      course,
    });
    res.status(201).json({ message: "Enrolled in course successfully" });
  }
);

export const getEnrolledCourses = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(userId) },
      relations: ["profile"],
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const userProfile = await AppDataSource.getRepository(UserProfile).findOne({
      where: { user },
    });
    if (!userProfile) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const enrollments = await AppDataSource.getRepository(Enrollment).find({
      where: { user: userProfile },
      relations: ["course"],
    });

    //pagination
    const pageSize = 5;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * pageSize;

    const course = await AppDataSource.getRepository(Course).find({
      where: { id: In(enrollments.map((enrollment) => enrollment.course.id)) },
      skip,
      take: pageSize,
    });
    res.status(200).json(course);
  }
);
