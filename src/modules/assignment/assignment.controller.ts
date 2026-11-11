import { Request, Response } from "express";
import { Types } from "mongoose";

import assignmentService from "./assignment.service";
import { assignPatientSchema } from "./assignment.dto";
import AppError from "../../utils/AppError";
import ApiResponse from "../../utils/ApiResponse";

const parseId = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label} ID`, 400);
  }

  return value;
};

class AssignmentController {
  async assignPatient(req: Request, res: Response) {
    const doctorId = parseId(req.params.id, "doctor");
    const validatedData = assignPatientSchema.parse(req.body);

    const assignment = await assignmentService.assignPatient(
      doctorId,
      validatedData
    );

    return ApiResponse.success(
      res,
      201,
      "Patient assigned successfully",
      assignment
    );
  }

  async getDoctorPatients(req: Request, res: Response) {
    const doctorId = parseId(req.params.id, "doctor");
    const assignments = await assignmentService.getDoctorPatients(doctorId);

    return ApiResponse.success(
      res,
      200,
      "Doctor patients retrieved successfully",
      assignments
    );
  }

  async getPatientDoctors(req: Request, res: Response) {
    const patientId = parseId(req.params.id, "patient");
    const assignments = await assignmentService.getPatientDoctors(patientId);

    return ApiResponse.success(
      res,
      200,
      "Patient doctors retrieved successfully",
      assignments
    );
  }

  async unassignPatient(req: Request, res: Response) {
    const doctorId = parseId(req.params.id, "doctor");
    const patientId = parseId(req.params.patientId, "patient");

    const assignment = await assignmentService.unassignPatient(
      doctorId,
      patientId
    );

    return ApiResponse.success(
      res,
      200,
      "Patient unassigned successfully",
      assignment
    );
  }
}

export default new AssignmentController();
