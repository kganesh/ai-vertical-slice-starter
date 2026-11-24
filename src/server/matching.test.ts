import { describe, expect, it } from "vitest";
import type { Certificate } from "@/domain/certificate";
import { allocate, assertNoOverAllocation, coverage } from "./matching";
import { seedCertificates, seedFacilities } from "./seed";

const facilities = seedFacilities;
const certs = seedCertificates();
const total = (xs: { mwh: number }[]) => xs.reduce((n, x) => n + x.mwh, 0);

describe("allocate", () => {
  const drafts = allocate(facilities, certs);

  it("splits ERCOT certificates across Dallas and Houston without exceeding supply", () => {
    const ercot = drafts.filter((d) => ["fac-dal", "fac-hou"].includes(d.facilityId));
    expect(total(ercot)).toBe(4000); // 2,500 + 1,500 supply vs 4,800 demand
    expect(total(drafts.filter((d) => d.certificateId === "cert-1"))).toBe(2500);
  });

  it("never uses a wrong-vintage certificate", () => {
    expect(drafts.some((d) => ["cert-4", "cert-6"].includes(d.certificateId))).toBe(false);
  });

  it("never over-allocates any certificate", () => {
    expect(() => assertNoOverAllocation(certs, drafts)).not.toThrow();
  });

  it("is deterministic: re-running gives identical allocations", () => {
    expect(allocate(facilities, certs)).toEqual(drafts);
  });

  it("respects final allocations already made", () => {
    const final = [{ certificateId: "cert-5", facilityId: "fac-chi", mwh: 2400 }];
    const again = allocate(facilities, certs, final);
    expect(again.some((d) => d.certificateId === "cert-5")).toBe(false);
  });

  it("ignores retired certificates", () => {
    const retired: Certificate[] = certs.map((c) =>
      c.id === "cert-5" ? { ...c, status: "retired" } : c,
    );
    expect(allocate(facilities, retired).some((d) => d.certificateId === "cert-5")).toBe(false);
  });

  it("throws if allocations exceed a certificate", () => {
    expect(() =>
      assertNoOverAllocation(certs, [{ certificateId: "cert-1", facilityId: "x", mwh: 2501 }]),
    ).toThrow(/over-allocated/);
  });
});

describe("coverage", () => {
  const cov = coverage(facilities, certs, allocate(facilities, certs));
  const by = (id: string) => cov.find((c) => c.facilityId === id)!;

  it("reports full coverage with no gap reason", () => {
    expect(by("fac-chi")).toMatchObject({ pct: 100, gapReason: null });
  });

  it("explains wrong-vintage gaps", () => {
    expect(by("fac-pdx").gapReason).toMatch(/400 MWh short.*vintage 2025/);
    expect(by("fac-msp")).toMatchObject({ pct: 0 });
    expect(by("fac-msp").gapReason).toMatch(/vintage 2025/);
  });

  it("explains certificates used by other facilities", () => {
    expect(by("fac-hou").gapReason).toMatch(/used by other facilities/);
  });
});
