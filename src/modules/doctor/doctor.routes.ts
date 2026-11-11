
import { Router } from "express";

import doctorController from "./doctor.controller";
import assignmentController from "../assignment/assignment.controller";

const router = Router();

router.post("/", (req, res) => doctorController.createDoctor(req, res));

router.get("/", (req, res) => doctorController.getAllDoctors(req, res));

router.get("/:id", (req, res) => doctorController.getDoctorById(req, res));

router.put("/:id", (req, res) => doctorController.updateDoctor(req, res));

router.patch("/:id/status", (req, res) =>
  doctorController.updateDoctorStatus(req, res)
);

router.delete("/:id", (req, res) => doctorController.deleteDoctor(req, res));

// Doctor-patient assignments
router.post("/:id/patients", (req, res) =>
  assignmentController.assignPatient(req, res)
);

router.get("/:id/patients", (req, res) =>
  assignmentController.getDoctorPatients(req, res)
);

router.delete("/:id/patients/:patientId", (req, res) =>
  assignmentController.unassignPatient(req, res)
);

export default router;
