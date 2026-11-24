/**
 * Renewable Energy Certificate (REC). 1 REC = 1 MWh of renewable generation.
 * Matching rules depend on `region` and `vintage`, so they are strict enums/ints.
 */
import { z } from "zod";

export const REGIONS = ["WECC", "ERCOT", "PJM", "MISO"] as const;
export const ENERGY_TYPES = ["wind", "solar", "hydro", "other"] as const;
export const CERTIFICATE_STATUSES = ["available", "retired"] as const;

export const Region = z.enum(REGIONS);
export type Region = z.infer<typeof Region>;
export const EnergyType = z.enum(ENERGY_TYPES);
export const CertificateStatus = z.enum(CERTIFICATE_STATUSES);
export type CertificateStatus = z.infer<typeof CertificateStatus>;

const Vintage = z.coerce
  .number()
  .int("Vintage must be a year")
  .min(2000, "Vintage looks too old")
  .max(2100, "Vintage looks wrong");

export const Certificate = z.object({
  id: z.string(),
  projectName: z.string().min(1),
  energyType: EnergyType,
  region: Region,
  vintage: z.number().int(),
  mwh: z.number().int().positive(),
  trackingId: z.string().optional(),
  status: CertificateStatus,
  /** Provenance: drafted by AI and confirmed by a human, or typed manually. */
  source: z.enum(["manual", "ai_assisted"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Certificate = z.infer<typeof Certificate>;

export const CreateCertificateInput = z.object({
  projectName: z.string().trim().min(1, "Project name is required").max(120),
  energyType: EnergyType,
  region: Region,
  vintage: Vintage,
  mwh: z.coerce.number().int("Whole MWh only").positive("Must be more than 0"),
  trackingId: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => v || undefined),
  status: CertificateStatus.default("available"),
  source: z.enum(["manual", "ai_assisted"]).default("manual"),
});
export type CreateCertificateInput = z.input<typeof CreateCertificateInput>;

export const UpdateCertificateInput = CreateCertificateInput.partial();
export type UpdateCertificateInput = z.input<typeof UpdateCertificateInput>;

export const ListCertificatesQuery = z.object({
  q: z.string().trim().optional(),
  status: CertificateStatus.optional(),
  region: Region.optional(),
});
export type ListCertificatesQuery = z.infer<typeof ListCertificatesQuery>;
