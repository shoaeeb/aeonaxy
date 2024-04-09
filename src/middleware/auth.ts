import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../async-wrapper";
import { UnauthorizedError } from "../errors";
import jwt, { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const verifyToken = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const authToken = req.cookies["auth_token"];
    if (!authToken) {
      throw new UnauthorizedError("Unauthorized Access");
    }
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY as string);
    req.userId = (decoded as JwtPayload).userId;
    next();
  }
);
