import "dotenv/config";
import express from "express";
import cors from "cors";
import "reflect-metadata";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import { DataSource } from "typeorm";
import AppDataSource from "./DataSource/app-data-source";
import { errorMiddleware } from "./middleware/error-middleware";
import userRouter from "./routes/Users";
import courseRouter from "./routes/Courses";
import enrollmentRouter from "./routes/Enrollment";
import { startCronJobs } from "./utils/cron-jobs";
import swaggerDocs from "./utils/swagger";

const PORT = Number(process.env.PORT || 7000); 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => console.log(error));

startCronJobs(); //TTL for OTP
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/", userRouter);
app.use("/api/v1", courseRouter);
app.use("/api/v1", enrollmentRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});

swaggerDocs(app,PORT);