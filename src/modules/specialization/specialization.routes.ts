import { Router } from "express";

import specializationController from "./specialization.controller";

const router = Router();

router.post("/", (req, res) => specializationController.createSpecialization(req, res));

router.get("/", (req, res) => specializationController.getAllSpecializations(req, res));

// Declared before "/:id" so "options" isn't treated as an ID.
router.get("/options", (req, res) =>
  specializationController.getSpecializationOptions(req, res)
);

router.get("/:id", (req, res) => specializationController.getSpecializationById(req, res));

router.put("/:id", (req, res) => specializationController.updateSpecialization(req, res));

router.delete("/:id", (req, res) =>
  specializationController.deleteSpecialization(req, res)
);

export default router;
