import { Request, Response } from "express";
import { Types } from "mongoose";

import specializationService from "./specialization.service";
import {
  createSpecializationSchema,
  listSpecializationsQuerySchema,
  updateSpecializationSchema,
} from "./specialization.dto";
import AppError from "../../utils/AppError";
import ApiResponse from "../../utils/ApiResponse";

const parseId = (value: unknown): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError("Invalid specialization ID", 400);
  }

  return value;
};

class SpecializationController {
  async createSpecialization(req: Request, res: Response) {
    const validatedData = createSpecializationSchema.parse(req.body);
    const specialization = await specializationService.createSpecialization(validatedData);

    return ApiResponse.success(
      res,
      201,
      "Specialization created successfully",
      specialization
    );
  }

  async getAllSpecializations(req: Request, res: Response) {
    const query = listSpecializationsQuerySchema.parse(req.query);
    const specializations = await specializationService.getAllSpecializations(query);

    return ApiResponse.success(
      res,
      200,
      "Specializations retrieved successfully",
      specializations
    );
  }

  async getSpecializationOptions(req: Request, res: Response) {
    const specializations = await specializationService.getSpecializationOptions();

    return ApiResponse.success(
      res,
      200,
      "Specialization options retrieved successfully",
      specializations
    );
  }

  async getSpecializationById(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const specialization = await specializationService.getSpecializationById(id);

    return ApiResponse.success(
      res,
      200,
      "Specialization retrieved successfully",
      specialization
    );
  }

  async updateSpecialization(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const validatedData = updateSpecializationSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      throw new AppError("At least one field is required for update", 400);
    }

    const specialization = await specializationService.updateSpecialization(id, validatedData);

    return ApiResponse.success(
      res,
      200,
      "Specialization updated successfully",
      specialization
    );
  }

  async deleteSpecialization(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const specialization = await specializationService.deleteSpecialization(id);

    return ApiResponse.success(
      res,
      200,
      "Specialization deleted successfully",
      specialization
    );
  }
}

export default new SpecializationController();
