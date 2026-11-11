
import { Request, Response, NextFunction } from "express";
import authService from "./auth.service";
import { loginSchema } from "./auth.dto";

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);

      const result = await authService.login(validatedData);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
