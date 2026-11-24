import type {
  CreateCertificateInput,
  Certificate,
  ListCertificatesQuery,
  UpdateCertificateInput,
} from "@/domain/certificate";

/**
 * Storage port. Routes and services depend on this interface only, so the
 * JSON-file adapter can be swapped for Postgres/Prisma/Drizzle without
 * touching the API or UI.
 */
export interface CertificateRepository {
  list(query?: ListCertificatesQuery): Promise<Certificate[]>;
  get(id: string): Promise<Certificate | null>;
  create(input: CreateCertificateInput): Promise<Certificate>;
  update(id: string, input: UpdateCertificateInput): Promise<Certificate | null>;
  delete(id: string): Promise<boolean>;
}
