import { z } from "zod";
import { Region } from "./certificate";

/** A site whose annual electricity use must be covered by certificates. */
export const Facility = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  region: Region,
  /** Reporting year; certificate vintage must equal this. */
  year: z.number().int(),
  usageMwh: z.number().int().positive(),
});
export type Facility = z.infer<typeof Facility>;
