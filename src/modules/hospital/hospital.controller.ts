import { Request, Response } from "express";
import { Types } from "mongoose";

import hospitalService from "./hospital.service";
import {
  createHospitalSchema,
  listHospitalsQuerySchema,
  updateHospitalSchema,
} from "./hospital.dto";
import AppError from "../../utils/AppError";
import ApiResponse from "../../utils/ApiResponse";

const parseId = (value: unknown): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError("Invalid hospital ID", 400);
  }

  return value;
};

class HospitalController {
  async createHospital(req: Request, res: Response) {
    const validatedData = createHospitalSchema.parse(req.body);
    const hospital = await hospitalService.createHospital(validatedData);

    return ApiResponse.success(
      res,
      201,
      "Hospital created successfully",
      hospital
    );
  }

  async getAllHospitals(req: Request, res: Response) {
    const query = listHospitalsQuerySchema.parse(req.query);
    const hospitals = await hospitalService.getAllHospitals(query);

    return ApiResponse.success(
      res,
      200,
      "Hospitals retrieved successfully",
      hospitals
    );
  }

  async getHospitalOptions(req: Request, res: Response) {
    const hospitals = await hospitalService.getHospitalOptions();

    return ApiResponse.success(
      res,
      200,
      "Hospital options retrieved successfully",
      hospitals
    );
  }

  async getHospitalById(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const hospital = await hospitalService.getHospitalById(id);

    return ApiResponse.success(
      res,
      200,
      "Hospital retrieved successfully",
      hospital
    );
  }

  async updateHospital(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const validatedData = updateHospitalSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      throw new AppError("At least one field is required for update", 400);
    }

    const hospital = await hospitalService.updateHospital(id, validatedData);

    return ApiResponse.success(
      res,
      200,
      "Hospital updated successfully",
      hospital
    );
  }

  async deleteHospital(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const hospital = await hospitalService.deleteHospital(id);

    return ApiResponse.success(
      res,
      200,
      "Hospital deleted successfully",
      hospital
    );
  }
}

export default new HospitalController();
