import express from "express";
import { verifyToken } from "../middleware/auth";
import { enrollInCourse, getEnrolledCourses } from "../controller/enrollment";

const router = express.Router();


/**
 * @openapi
 * /api/v1/enroll/{id}:
 *   post:
 *     tags:
 *       - "Enrollment"
 *     description: "Enroll in a course"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "Course ID"
 *         schema:
 *           type: "string"
 *     responses:
 *       "200":
 *         description: "Enrolled successfully"
 */
router.post("/enroll/:id", verifyToken, enrollInCourse);

/**
 * @openapi
 * /api/v1/enrolled-courses:
 *   get:
 *     tags:
 *       - "Enrollment"
 *     description: "Get all enrolled courses"
 *     responses:
 *       "200":
 *         description: "Enrolled courses retrieved successfully"
 */
router.get("/enrolled-courses", verifyToken, getEnrolledCourses);

export default router;
