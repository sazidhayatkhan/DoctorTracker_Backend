
import { Request, Response } from "express";
import { Types } from "mongoose";

import doctorService from "./doctor.service";
import {
  createDoctorSchema,
  listDoctorsQuerySchema,
  updateDoctorSchema,
} from "./doctor.dto";
import AppError from "../../utils/AppError";
import ApiResponse from "../../utils/ApiResponse";

class DoctorController {
  async createDoctor(req: Request, res: Response) {
    const validatedData = createDoctorSchema.parse(req.body);
    const doctor = await doctorService.createDoctor(validatedData);

    return ApiResponse.success(
      res,
      201,
      "Doctor created successfully",
      doctor
    );
  }

  async getAllDoctors(req: Request, res: Response) {
    const query = listDoctorsQuerySchema.parse(req.query);
    const doctors = await doctorService.getAllDoctors(query);

    return ApiResponse.success(
      res,
      200,
      "Doctors retrieved successfully",
      doctors
    );
  }

  async getDoctorById(req: Request, res: Response) {
    const id = req.params.id;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid doctor ID", 400);
    }

    const doctor = await doctorService.getDoctorById(id);

    return ApiResponse.success(
      res,
      200,
      "Doctor retrieved successfully",
      doctor
    );
  }

  async updateDoctor(req: Request, res: Response) {
    const id = req.params.id;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid doctor ID", 400);
    }

    const validatedData = updateDoctorSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      throw new AppError("At least one field is required for update", 400);
    }

    const doctor = await doctorService.updateDoctor(id, validatedData);

    return ApiResponse.success(
      res,
      200,
      "Doctor updated successfully",
      doctor
    );
  }

  async deleteDoctor(req: Request, res: Response) {
    const id = req.params.id;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid doctor ID", 400);
    }

    const doctor = await doctorService.deleteDoctor(id);

    return ApiResponse.success(
      res,
      200,
      "Doctor deleted successfully",
      doctor
    );
  }

  async updateDoctorStatus(req: Request, res: Response) {
    const id = req.params.id;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid doctor ID", 400);
    }

    const isActive = req.body.isActive;

    if (typeof isActive !== "boolean") {
      throw new AppError("isActive must be a boolean", 400);
    }

    const doctor = await doctorService.updateDoctorStatus(id, isActive);

    return ApiResponse.success(
      res,
      200,
      "Doctor status updated successfully",
      doctor
    );
  }
}

export default new DoctorController();
