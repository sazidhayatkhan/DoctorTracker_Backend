import { z } from "zod";

import { GENDERS } from "./patient.model";
import { paginationQuerySchema } from "../../utils/pagination";
import {
  dateRangeError,
  dateRangeQueryShape,
  isValidDateRange,
} from "../../utils/dateRange";

const todayISO = () => new Date().toISOString().slice(0, 10);

const birthDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be in yyyy-mm-dd format")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid birth date")
  .refine((v) => v <= todayISO(), "Birth date can't be in the future")
  .refine(
    (v) => new Date().getFullYear() - Number(v.slice(0, 4)) <= 130,
    "Enter a valid birth date"
  );

export const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(8, "Invalid phone number"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email("Invalid email address").optional()),
  birthDate: birthDateSchema,
  gender: z.enum(GENDERS, "Gender must be Male, Female or Other"),
  address: z.string().trim().min(1, "Address is required"),
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  /** "" removes the email; omit the field to leave it unchanged */
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.union([z.literal(""), z.string().email("Invalid email address")]))
    .optional(),
});

/** `GET /patients?q=&from=&to=&page=&limit=` */
export const listPatientsQuerySchema = paginationQuerySchema
  .extend({
    /** Name, 4-digit patient code, phone digits or email */
    q: z.string().trim().max(100).optional(),
    ...dateRangeQueryShape,
  })
  .refine(isValidDateRange, dateRangeError);

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;

export type CreatePatientDTO = z.infer<typeof createPatientSchema>;
export type UpdatePatientDTO = z.infer<typeof updatePatientSchema>;
