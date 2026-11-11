
import { z } from "zod";

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z.string().trim().min(8, "Invalid phone number"),
  hospital: z.string().trim().min(2, "Hospital is required"),
  specialization: z.string().trim().min(2, "Specialization is required"),
});

export const updateDoctorSchema = createDoctorSchema.partial();

export type CreateDoctorDTO = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorDTO = z.infer<typeof updateDoctorSchema>;
