import { Request, Response, NextFunction } from "express";
import { Course, CourseLevel } from "../models/Course";
import { Enrollment } from "../models/Enrollment";
import asyncWrapper from "../async-wrapper";
import { User, UserRole } from "../models/User";
import AppDataSource from "../DataSource/app-data-source";
import { v2 as cloudinary } from "cloudinary";
import { validationResult } from "express-validator";
import { LessThanOrEqual, Like, Raw } from "typeorm";

export const createCourse = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array().map((error:any) => error.path + " "+error.msg)});
      return;
    }
    const userId = req.userId;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(userId) },
      select: ["role"],
    });
    if (user?.role !== UserRole.SUPERADMIN) {
      res
        .status(403)
        .json({ message: "You are not authorized to create a course" });
      return;
    }
    let level = req.body.level.toString() || "";

    if (level.toLowerCase() === "beginner") {
      level = CourseLevel.BEGINNER;
    } else if (level.toLowerCase() === "intermediate") {
      level = CourseLevel.INTERMEDIATE;
    } else if (level.toLowerCase() === "advanced") {
      level = CourseLevel.ADVANCED;
    }

    level = level.toUpperCase();

    const course = await AppDataSource.getRepository(Course).save({
      ...req.body,
      level: CourseLevel[level as keyof typeof CourseLevel],
      createdBy: userId,
    });
    res.status(201).json(course);
  }
);

export const getCourses = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const constructedQuery = constructQuery(req.query);
    console.log(constructedQuery);
    const pageSize = 5;
    const skip = (Number(req.query.page) - 1) * pageSize || 0;

    const courses = await AppDataSource.getRepository(Course).find({
      where: constructedQuery,
      skip: skip,
      take: pageSize,
    });
    res.status(200).json(courses);
  }
);

const constructQuery = (query: any) => {
  const constructedQuery: any = {};
  if (query.name) {
    constructedQuery.name = query.name;
  }
  if (query.level) {
    constructedQuery.level = query.level;
  }
  if (query.price) {
    constructedQuery.price = LessThanOrEqual(query.price);
  }
  if (query.instructor) {
    constructedQuery.instructor = Raw(
      (columnAlias) =>
        `LOWER(${columnAlias}) LIKE LOWER('%${query.instructor}%')`
    );
  }
  if (query.duration) {
    constructedQuery.duration = LessThanOrEqual(query.duration);
  }
  if (query.rating) {
    constructedQuery.rating = LessThanOrEqual(query.rating);
  }
  return constructedQuery;
};

export const getCourse = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id.toString();
    const course = await AppDataSource.getRepository(Course).findOne({
      where: { id: Number(courseId) },
    });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    res.status(200).json(course);
  }
);

export const updateCourse = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id.toString();
    const userId = req.userId;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(userId) },
      select: ["role"],
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (user.role !== UserRole.SUPERADMIN) {
      res
        .status(403)
        .json({ message: "You are not authorized to update a course" });
      return;
    }
    // const course = await AppDataSource.getRepository(Course).findOne({
    //   where: { id: Number(courseId), createdBy: { Number(userId) } },
    //   select: [
    //     "name",
    //     "description",
    //     "price",
    //     "level",
    //     "instructor",
    //     "duration",
    //     "image",
    //     "rating",
    //   ],
    // });

    const course = await AppDataSource.getRepository(Course)
      .createQueryBuilder("course")
      .select([
        "course.name",
        "course.description",
        "course.price",
        "course.level",
        "course.instructor",
        "course.duration",
        "course.image",
        "course.rating",
      ])
      .where("course.id = :courseId", { courseId: Number(courseId) })
      .andWhere("course.createdBy = :userId", { userId: Number(userId) })
      .getOne();

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    console.log(course);

    if (req.body.image) {
      const image = req.body.image;
      if (course.image) {
        const publicId = course.image.split("/").pop()?.split(".")[0] || "";
        cloudinary.uploader.destroy(publicId);
      }
      const uploadResponse = await cloudinary.uploader.upload(image);
      req.body.image = uploadResponse.url;
    }
    let level = req.body.level.toString();
    if (level.toLowerCase() === "beginner") {
      level = CourseLevel.BEGINNER;
    } else if (level.toLowerCase() === "intermediate") {
      level = CourseLevel.INTERMEDIATE;
    } else if (level.toLowerCase() === "advanced") {
      level = CourseLevel.ADVANCED;
    }
    level = level.toUpperCase();
    const updatedCourse = {
      name: req.body.name || course.name,
      duration: req.body.duration || course.duration,
      description: req.body.description || course.description,
      price: req.body.price || course.price,
      level: CourseLevel[level as keyof typeof CourseLevel],
      instructor: req.body.instructor || course.instructor,
      image: req.body.image || course.image,
      rating: req.body.rating || course.rating,
    };

    await AppDataSource.getRepository(Course)
      .createQueryBuilder()
      .update(Course)
      .set(updatedCourse)
      .where("id = :id", { id: Number(courseId) })
      .execute();
    res.status(200).json({ message: "Course updated successfully" });
  }
);

export const deleteCourse = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id.toString();
    const userId = req.userId;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(userId) },
      select: ["role"],
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (user.role !== UserRole.SUPERADMIN) {
      res
        .status(403)
        .json({ message: "You are not authorized to delete a course" });
      return;
    }
    const course = await AppDataSource.getRepository(Course)
      .createQueryBuilder("course")
      .select(["course.image"])
      .where("course.id = :id", { id: courseId })
      .andWhere("course.createdBy = :userId", { userId: Number(userId) })
      .getOne();
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    //if there is a image delete it from cloudinary
    if (course.image) {
      const publicId = course?.image.split("/").pop()?.split(".")[0] || "";
      await cloudinary.uploader.destroy(publicId); //delete image from cloudinary
    }

    await AppDataSource.getRepository(Enrollment)
      .createQueryBuilder()
      .delete()
      .from(Enrollment)
      .where("courseId=:courseId", { courseId: courseId })
      .execute();

    if (course) {
      await AppDataSource.getRepository(Course)
        .createQueryBuilder()
        .delete()
        .from(Course)
        .where("id = :id", { id: courseId })
        .execute();
    }

    res.status(200).json({ message: "Course deleted successfully" });
  }
);
