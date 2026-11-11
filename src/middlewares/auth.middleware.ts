
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import userRepository from "../modules/user/user.repository";
import { UserRole } from "../modules/user/user.model";
import AppError from "../utils/AppError";

interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
}

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication token is required", 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError("Invalid authentication token", 401);
  }

  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new AppError("JWT secret is not configured", 500);
  }

  let decoded: AccessTokenPayload;

  try {
    decoded = jwt.verify(token, secret) as AccessTokenPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await userRepository.findById(decoded.userId);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  if (user.role !== UserRole.ADMIN || decoded.role !== UserRole.ADMIN) {
    throw new AppError("Access denied", 403);
  }

  req.user = {
    userId: user._id.toString(),
    role: user.role,
  };

  next();
};

export default authMiddleware;
