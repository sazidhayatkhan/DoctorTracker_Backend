
import { z } from "zod";
import { Types } from "mongoose";

import { paginationQuerySchema } from "../../utils/pagination";

const objectId = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => Types.ObjectId.isValid(v), `Invalid ${label} ID`);

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z.string().trim().min(8, "Invalid phone number"),
  hospitalId: objectId("hospital"),
  specializationId: objectId("specialization"),
});

export const updateDoctorSchema = createDoctorSchema.partial();

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in yyyy-mm-dd format");

/** `GET /doctors?q=&specializationId=&hospitalId=&from=&to=&page=&limit=` */
export const listDoctorsQuerySchema = paginationQuerySchema
  .extend({
    /** Matches name, email or hospital name (case-insensitive, contains) */
    q: z.string().trim().max(100).optional(),
    specializationId: objectId("specialization").optional(),
    hospitalId: objectId("hospital").optional(),
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
