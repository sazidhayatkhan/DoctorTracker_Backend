import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

export const createHospitalSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  address: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/** An empty `address` clears it */
export const updateHospitalSchema = z.object({
  name: createHospitalSchema.shape.name.optional(),
  address: z.string().trim().max(300).optional(),
});

export const listHospitalsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
});

export type CreateHospitalDTO = z.infer<typeof createHospitalSchema>;
export type UpdateHospitalDTO = z.infer<typeof updateHospitalSchema>;
export type ListHospitalsQuery = z.infer<typeof listHospitalsQuerySchema>;
