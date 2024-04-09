import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from "../controller/courses";
import { check } from "express-validator";
import { verifyToken } from "../middleware/auth";
import { verify } from "crypto";

const router = express.Router();



/**
 * @openapi
 * /api/v1/courses/create:
 *     post:
 *      tags:
 *       - "Courses"
 *      description: "Create a new course"
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: "object"
 *              properties:
 *                name:
 *                  type: "string"
 *                description:
 *                  type: "string"
 *                price:
 *                  type: "number"
 *                level:
 *                  type: "string"
 *                  enum: ["beginner","intermediate","advanced"]
 *                instructor:
 *                  type: "string"
 *                duration:
 *                  type: "number"
 *                image:
 *                  type: "string"
 *                rating:
 *                  type: "number"
 *     responses:
 *          "201":
 *             description: "Course created successfully"
 */
router.post(
  "/create",
  [
    check("name", "This field is required").isString().notEmpty(),
    check("description", "This field is required").isString().notEmpty(),
    check("price", "This field is required").isNumeric().notEmpty(),
    check("level", "This field is required").isString().notEmpty(),
    check("instructor", "This field is required").isString().notEmpty(),
  ],
  verifyToken,
  createCourse
);


/**
 * @openapi
 * /api/v1/courses:
 *   get:
 *     tags:
 *       - "Courses"
 *     description: "Get all courses"
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: "Page number"
 *         required: false
 *       - name: name
 *         in: query
 *         schema:
 *           type: string
 *         description: "Course name"
 *         required: false
 *       - name: instructor
 *         in: query
 *         schema:
 *           type: string
 *         description: "Course instructor name"
 *         required: false
 *       - name: duration
 *         in: query
 *         schema:
 *           type: number
 *         description: "Course duration"
 *         required: false
 *       - name: level
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["beginner", "intermediate", "advanced"]
 *         description: "Course level"
 *         required: false
 *       - name: price
 *         in: query
 *         schema:
 *           type: number
 *         description: "Course price"
 *         required: false
 *       - name: rating
 *         in: query
 *         schema:
 *           type: number
 *         description: "Course rating"
 *         required: false
 *     responses:
 *       "200":
 *         description: "Courses retrieved successfully"
 */
router.get("/courses", getCourses);


/**
 * @openapi
 * /api/v1/courses/{id}:
 *   delete:
 *     tags:
 *       - "Courses"
 *     description: "Delete a course"
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: "Course ID"
 *         required: true
 *     responses:
 *       "200":
 *         description: "Course deleted successfully"
 */
router.delete("/courses/:id", verifyToken, deleteCourse);

/**
 * @openapi
 * /api/v1/courses/{id}:
 *   put:
 *     tags:
 *       - "Courses"
 *     description: "Update a course"
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: "Course ID"
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             properties:
 *               name:
 *                 type: "string"
 *               description:
 *                 type: "string"
 *               price:
 *                 type: "number"
 *               level:
 *                 type: "string"
 *                 enum: ["beginner","intermediate","advanced"]
 *               instructor:
 *                 type: "string"
 *               duration:
 *                 type: "number"
 *               image:
 *                 type: "string"
 *               rating:
 *                 type: "number"
 *     responses:
 *       "200":
 *         description: "Course updated successfully"
 */
router.put("/courses/:id", verifyToken, updateCourse);

export default router;
