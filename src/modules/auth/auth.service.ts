
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import userRepository from "../user/user.repository";
import { LoginDTO } from "./auth.dto";
import AppError from "../../utils/AppError";

class AuthService {
  async login(data: LoginDTO) {
    const { email, password } = data;

    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }


    if (!user.isActive) {
      throw new AppError("Your account is inactive", 403);
    }


    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export default new AuthService();
