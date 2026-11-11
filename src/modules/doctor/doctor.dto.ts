
import { z } from "zod";
import { Types } from "mongoose";

import { paginationQuerySchema } from "../../utils/pagination";
import {
  dateRangeError,
  dateRangeQueryShape,
  isValidDateRange,
} from "../../utils/dateRange";

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

/** `GET /doctors?q=&specializationId=&hospitalId=&from=&to=&page=&limit=` */
export const listDoctorsQuerySchema = paginationQuerySchema
  .extend({
    /** Matches name, email or hospital name (case-insensitive, contains) */
    q: z.string().trim().max(100).optional(),
    specializationId: objectId("specialization").optional(),
    hospitalId: objectId("hospital").optional(),
    ...dateRangeQueryShape,
  })
  .refine(isValidDateRange, dateRangeError);

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;

export type CreateDoctorDTO = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorDTO = z.infer<typeof updateDoctorSchema>;
