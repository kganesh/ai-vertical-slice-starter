import { z } from "zod";

/** A slice of one certificate's MWh assigned to one facility. Splits live here. */
export const Allocation = z.object({
  id: z.string(),
  certificateId: z.string(),
  facilityId: z.string(),
  mwh: z.number().int().positive(),
  status: z.enum(["draft", "final"]),
});
export type Allocation = z.infer<typeof Allocation>;

export const FacilityCoverage = z.object({
  facilityId: z.string(),
  name: z.string(),
  city: z.string(),
  region: z.string(),
  year: z.number(),
  usageMwh: z.number(),
  matchedMwh: z.number(),
  pct: z.number(),
  allocations: z.array(
    z.object({ certificateId: z.string(), projectName: z.string(), mwh: z.number() }),
  ),
  gapReason: z.string().nullable(),
});
export type FacilityCoverage = z.infer<typeof FacilityCoverage>;
