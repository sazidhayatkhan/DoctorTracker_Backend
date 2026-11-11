import express, { Application } from "express";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware";
import AppError from "./utils/AppError";
import authRoutes from "./modules/auth/auth.routes";
import authMiddleware from "./middlewares/auth.middleware";
import doctorRoutes from "./modules/doctor/doctor.routes";
import patientRoutes from "./modules/patient/patient.routes";
import hospitalRoutes from "./modules/hospital/hospital.routes";
import specializationRoutes from "./modules/specialization/specialization.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";

const app: Application = express();

/**
 * Frontends allowed to call the API: CORS_ORIGINS as a comma-separated list
 * (e.g. "https://doctor-tracker-admin.vercel.app,http://localhost:3000").
 * Defaults to local dev plus the deployed admin app.
 */
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "https://doctor-tracker-admin.vercel.app",
];

const allowedOrigins = (
  process.env.CORS_ORIGINS?.split(",") ?? DEFAULT_CORS_ORIGINS
)
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// Global middlewares
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Tracker API is running",
  });
});

// Temporary error testing route
app.get("/api/test-error", (req, res, next) => {
  next(new AppError("Something went wrong!", 400));
});

app.use("/api/auth", authRoutes);

app.use("/api/doctors", authMiddleware, doctorRoutes);
app.use("/api/patients", authMiddleware, patientRoutes);
app.use("/api/hospitals", authMiddleware, hospitalRoutes);
app.use("/api/specializations", authMiddleware, specializationRoutes);
app.use("/api/analytics", authMiddleware, analyticsRoutes);
app.use(errorMiddleware);

export default app;
