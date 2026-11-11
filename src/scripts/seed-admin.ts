
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "../config/database";
import userRepository from "../modules/user/user.repository";
import { UserRole } from "../modules/user/user.model";

const seedAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error("Admin environment variables are missing");
    }

    if (password.length < 8) {
      throw new Error("Admin password must be at least 8 characters");
    }

    await connectDB();

    const existingAdmin = await userRepository.findByEmail(email);

    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
