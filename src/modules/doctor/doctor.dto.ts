
import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z.string().trim().min(8, "Invalid phone number"),
  hospital: z.string().trim().min(2, "Hospital is required"),
  specialization: z.string().trim().min(2, "Specialization is required"),
});

export const updateDoctorSchema = createDoctorSchema.partial();

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in yyyy-mm-dd format");

/** `GET /doctors?q=&specialization=&from=&to=&page=&limit=` */
export const listDoctorsQuerySchema = paginationQuerySchema
  .extend({
    /** Matches name, email or hospital (case-insensitive, contains) */
    q: z.string().trim().max(100).optional(),
    specialization: z.string().trim().min(1).optional(),
    /** Registered on or after this date (yyyy-mm-dd) */
    from: isoDate.optional(),
    /** Registered on or before this date (yyyy-mm-dd, inclusive) */
    to: isoDate.optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "'from' must be on or before 'to'",
    path: ["from"],
  });

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;

export type CreateDoctorDTO = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorDTO = z.infer<typeof updateDoctorSchema>;
