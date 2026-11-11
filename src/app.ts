
import express, { Application } from "express";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware";
import AppError from "./utils/AppError";

const app: Application = express();

// Global middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
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


app.use(errorMiddleware);

export default app;
