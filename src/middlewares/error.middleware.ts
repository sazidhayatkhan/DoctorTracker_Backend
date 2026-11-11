import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import AppError from "../utils/AppError";

const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Request validation failed: 400 with a message per field.
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};

    for (const issue of err.issues) {
      const field = issue.path.join(".") || "_";
      errors[field] ??= issue.message;
    }

    res.status(400).json({
      success: false,
      message: err.issues[0]?.message ?? "Validation failed",
      errors,
    });
    return;
  }

  const statusCode =
    err instanceof AppError ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

export default errorMiddleware;
