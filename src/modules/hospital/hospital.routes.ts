import { Router } from "express";

import hospitalController from "./hospital.controller";

const router = Router();

router.post("/", (req, res) => hospitalController.createHospital(req, res));

router.get("/", (req, res) => hospitalController.getAllHospitals(req, res));

// Declared before "/:id" so "options" isn't treated as an ID.
router.get("/options", (req, res) =>
  hospitalController.getHospitalOptions(req, res)
);

router.get("/:id", (req, res) => hospitalController.getHospitalById(req, res));

router.put("/:id", (req, res) => hospitalController.updateHospital(req, res));

router.delete("/:id", (req, res) =>
  hospitalController.deleteHospital(req, res)
);

export default router;
