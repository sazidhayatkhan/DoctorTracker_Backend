import { Router } from "express";

import patientController from "./patient.controller";
import assignmentController from "../assignment/assignment.controller";

const router = Router();

router.post("/", (req, res) => patientController.createPatient(req, res));

router.get("/", (req, res) => patientController.getAllPatients(req, res));

router.get("/:id", (req, res) => patientController.getPatientById(req, res));

router.get("/:id/doctors", (req, res) =>
  assignmentController.getPatientDoctors(req, res)
);

router.put("/:id", (req, res) => patientController.updatePatient(req, res));

router.delete("/:id", (req, res) => patientController.deletePatient(req, res));

export default router;
