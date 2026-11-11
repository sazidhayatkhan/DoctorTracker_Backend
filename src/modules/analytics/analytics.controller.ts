import { Request, Response } from "express";

import analyticsService from "./analytics.service";
import {
  dashboardQuerySchema,
  patientsPerDoctorQuerySchema,
  registrationsQuerySchema,
} from "./analytics.dto";
import ApiResponse from "../../utils/ApiResponse";

class AnalyticsController {
  async getDashboard(req: Request, res: Response) {
    const query = dashboardQuerySchema.parse(req.query);
    const data = await analyticsService.getDashboard(query);

    return ApiResponse.success(res, 200, "Dashboard analytics retrieved", data);
  }

  async getOverview(req: Request, res: Response) {
    const data = await analyticsService.getOverview();

    return ApiResponse.success(res, 200, "Overview retrieved", data);
  }

  async getPatientRegistrations(req: Request, res: Response) {
    const { months } = registrationsQuerySchema.parse(req.query);
    const data = await analyticsService.getPatientRegistrations(months);

    return ApiResponse.success(res, 200, "Patient registrations retrieved", data);
  }

  async getGenderSplit(req: Request, res: Response) {
    const data = await analyticsService.getGenderSplit();

    return ApiResponse.success(res, 200, "Gender split retrieved", data);
  }

  async getAgeGroups(req: Request, res: Response) {
    const data = await analyticsService.getAgeGroups();

    return ApiResponse.success(res, 200, "Age groups retrieved", data);
  }

  async getPatientsPerDoctor(req: Request, res: Response) {
    const { limit } = patientsPerDoctorQuerySchema.parse(req.query);
    const data = await analyticsService.getPatientsPerDoctor(limit);

    return ApiResponse.success(res, 200, "Patients per doctor retrieved", data);
  }
}

export default new AnalyticsController();
