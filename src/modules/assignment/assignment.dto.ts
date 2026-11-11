import { z } from "zod";
import { Types } from "mongoose";

export const assignPatientSchema = z.object({
  patientId: z
    .string()
    .trim()
    .refine((v) => Types.ObjectId.isValid(v), "Invalid patient ID"),
  condition: z.string().trim().min(1, "Condition is required"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be at most 2000 characters")
    .optional(),
});

export type AssignPatientDTO = z.infer<typeof assignPatientSchema>;
