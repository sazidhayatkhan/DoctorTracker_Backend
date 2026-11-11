import { z } from "zod";

export const registrationsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const patientsPerDoctorQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const dashboardQuerySchema = registrationsQuerySchema.extend(
  patientsPerDoctorQuerySchema.shape
);

export type RegistrationsQuery = z.infer<typeof registrationsQuerySchema>;
export type PatientsPerDoctorQuery = z.infer<typeof patientsPerDoctorQuerySchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
