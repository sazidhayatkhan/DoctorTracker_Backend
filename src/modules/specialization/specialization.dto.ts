import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

export const createSpecializationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/** An empty `description` clears it */
export const updateSpecializationSchema = z.object({
  name: createSpecializationSchema.shape.name.optional(),
  description: z.string().trim().max(500).optional(),
});

export const listSpecializationsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
});

export type CreateSpecializationDTO = z.infer<typeof createSpecializationSchema>;
export type UpdateSpecializationDTO = z.infer<typeof updateSpecializationSchema>;
export type ListSpecializationsQuery = z.infer<typeof listSpecializationsQuerySchema>;
