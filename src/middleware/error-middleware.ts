import { Request, Response, NextFunction } from "express";
import { CustomAPIError } from "../errors";
interface ErrorWithStatusCode extends Error {
  statusCode: number;
  code?: string;
  detail?: string;
  column?: string;
}

export const errorMiddleware = (
  err: ErrorWithStatusCode,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customError = {
    message: err.message || "Something went wrong   ",
    statusCode: err.statusCode || 500,
  };

  if (err instanceof CustomAPIError) {
    customError.message = err.message;
    customError.statusCode = err.statusCode;
  }

  if (err && err.code === "23505") {
    customError.message =
      err.detail?.slice(err.detail.indexOf("=") + 2, -1) || "";
    customError.statusCode = 400;
  }

  if (err && err.code === "23502") {
    (customError.message = err?.column + "is undefined" || ""),
      (customError.statusCode = 400);
  }

  console.log(err);
  res.status(customError.statusCode).json({ errors: customError.message });
};
