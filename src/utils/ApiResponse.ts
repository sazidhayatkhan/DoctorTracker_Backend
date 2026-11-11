
import { Response } from "express";

interface ApiResponseOptions<T> {
  success: boolean;
  message: string;
  data?: T | null;
}

class ApiResponse {
  static send<T>(
    res: Response,
    statusCode: number,
    options: ApiResponseOptions<T>
  ) {
    return res.status(statusCode).json({
      success: options.success,
      message: options.message,
      data: options.data ?? null,
    });
  }

  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T
  ) {
    return this.send(res, statusCode, {
      success: true,
      message,
      data,
    });
  }
}

export default ApiResponse;
