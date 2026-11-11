import { Request, Response } from "express";
import { Types } from "mongoose";

import patientService from "./patient.service";
import {
  createPatientSchema,
  listPatientsQuerySchema,
  updatePatientSchema,
} from "./patient.dto";
import AppError from "../../utils/AppError";
import ApiResponse from "../../utils/ApiResponse";

const parseId = (value: unknown): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError("Invalid patient ID", 400);
  }

  return value;
};

class PatientController {
  async createPatient(req: Request, res: Response) {
    const validatedData = createPatientSchema.parse(req.body);
    const patient = await patientService.createPatient(validatedData);

    return ApiResponse.success(
      res,
      201,
      "Patient created successfully",
      patient
    );
  }

  async getAllPatients(req: Request, res: Response) {
    const query = listPatientsQuerySchema.parse(req.query);
    const patients = await patientService.getAllPatients(query);

    return ApiResponse.success(
      res,
      200,
      "Patients retrieved successfully",
      patients
    );
  }

  async getPatientById(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const patient = await patientService.getPatientById(id);

    return ApiResponse.success(
      res,
      200,
      "Patient retrieved successfully",
      patient
    );
  }

  async updatePatient(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const validatedData = updatePatientSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      throw new AppError("At least one field is required for update", 400);
    }

    const patient = await patientService.updatePatient(id, validatedData);

    return ApiResponse.success(
      res,
      200,
      "Patient updated successfully",
      patient
    );
  }

  async deletePatient(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const patient = await patientService.deletePatient(id);

    return ApiResponse.success(
      res,
      200,
      "Patient deleted successfully",
      patient
    );
  }
}

export default new PatientController();
