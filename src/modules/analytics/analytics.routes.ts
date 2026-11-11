import { Router } from "express";

import analyticsController from "./analytics.controller";

const router = Router();

router.get("/dashboard", (req, res) =>
  analyticsController.getDashboard(req, res)
);

router.get("/overview", (req, res) =>
  analyticsController.getOverview(req, res)
);

router.get("/patients/registrations", (req, res) =>
  analyticsController.getPatientRegistrations(req, res)
);

router.get("/patients/gender", (req, res) =>
  analyticsController.getGenderSplit(req, res)
);

router.get("/patients/age-groups", (req, res) =>
  analyticsController.getAgeGroups(req, res)
);

router.get("/doctors/patient-counts", (req, res) =>
  analyticsController.getPatientsPerDoctor(req, res)
);

export default router;
