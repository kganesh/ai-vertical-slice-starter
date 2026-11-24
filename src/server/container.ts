/**
 * Composition root: the only place that picks concrete implementations.
 * Swap storage or AI provider here without touching routes or UI.
 */
import path from "node:path";
import os from "node:os";
import { JsonFileCertificateRepository } from "@/server/repository/json-file-repository";
import type { CertificateRepository } from "@/server/repository/types";
import {
  InMemoryFacilityRepository,
  type FacilityRepository,
} from "@/server/repository/facility-repository";
import { seedCertificates, seedFacilities } from "@/server/seed";

const dataDir =
  process.env.DATA_DIR ??
  (process.env.VERCEL ? path.join(os.tmpdir(), "app-data") : path.join(process.cwd(), ".data"));

// Survive Next.js dev hot-reloads without creating a new instance each time.
const g = globalThis as unknown as {
  certificateRepo?: CertificateRepository;
  facilityRepo?: FacilityRepository;
};

export const certificateRepo: CertificateRepository =
  g.certificateRepo ??
  new JsonFileCertificateRepository(path.join(dataDir, "certificates.json"), seedCertificates);

export const facilityRepo: FacilityRepository =
  g.facilityRepo ?? new InMemoryFacilityRepository(seedFacilities);

if (process.env.NODE_ENV !== "production") {
  g.certificateRepo = certificateRepo;
  g.facilityRepo = facilityRepo;
}
