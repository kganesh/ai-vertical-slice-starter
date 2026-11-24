"use client";

/**
 * Data hook for the certificate list. Deliberately tiny (no React Query) so
 * it's easy to read in a demo; mention React Query/SWR as the production choice.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  Certificate,
  CreateCertificateInput,
  ListCertificatesQuery,
  UpdateCertificateInput,
} from "@/domain/certificate";
import { api, ApiError } from "@/lib/api-client";

export function useCertificates(query: ListCertificatesQuery) {
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const qs = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v) as [string, string][],
  ).toString();

  const reload = useCallback(async () => {
    const id = ++reqId.current; // ignore out-of-order responses while typing
    setLoading(true);
    try {
      const res = await api<{ certificates: Certificate[] }>(
        `/api/certificates${qs ? `?${qs}` : ""}`,
      );
      if (id === reqId.current) {
        setCertificates(res.certificates);
        setError(null);
      }
    } catch (e) {
      if (id === reqId.current) setError(e as ApiError);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    const t = setTimeout(reload, 200); // debounce search
    return () => clearTimeout(t);
  }, [reload]);

  const create = useCallback(async (input: CreateCertificateInput) => {
    const { certificate } = await api<{ certificate: Certificate }>("/api/certificates", {
      method: "POST",
      json: input,
    });
    setCertificates((prev) => (prev ? [certificate, ...prev] : [certificate]));
    toast.success(`Saved "${certificate.projectName}"`);
    return certificate;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateCertificateInput) => {
    const { certificate } = await api<{ certificate: Certificate }>(`/api/certificates/${id}`, {
      method: "PATCH",
      json: patch,
    });
    setCertificates((prev) => prev?.map((c) => (c.id === id ? certificate : c)) ?? null);
    return certificate;
  }, []);

  /** Optimistic delete with rollback on failure. */
  const remove = useCallback(
    async (cert: Certificate) => {
      const snapshot = certificates;
      setCertificates((prev) => prev?.filter((c) => c.id !== cert.id) ?? null);
      try {
        await api(`/api/certificates/${cert.id}`, { method: "DELETE" });
        toast.success(`Deleted "${cert.projectName}"`);
      } catch (e) {
        setCertificates(snapshot);
        toast.error((e as ApiError).message);
      }
    },
    [certificates],
  );

  return { certificates, error, loading, reload, create, update, remove };
}
