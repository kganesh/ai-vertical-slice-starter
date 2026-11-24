/**
 * Deterministic certificate matching. Pure functions, no I/O, no AI:
 * the same inputs always give the same allocations, so an auditor can
 * re-run and verify every number.
 *
 * Rules:
 *  - a certificate only covers a facility in the same region
 *  - certificate vintage must equal the facility's reporting year
 *  - a certificate's MWh may be split, but allocations never exceed its MWh
 */
import type { Allocation, FacilityCoverage } from "@/domain/allocation";
import type { Certificate } from "@/domain/certificate";
import type { Facility } from "@/domain/facility";
import { AppError } from "@/lib/errors";

export type DraftAllocation = Omit<Allocation, "id" | "status">;
type Alloc = Pick<Allocation, "certificateId" | "facilityId" | "mwh">;

const byName = (a: Facility, b: Facility) => a.name.localeCompare(b.name);
const byVintageThenId = (a: Certificate, b: Certificate) =>
  a.vintage - b.vintage || a.id.localeCompare(b.id);

const sumBy = <T>(xs: T[], f: (x: T) => number) => xs.reduce((n, x) => n + f(x), 0);

export const isEligible = (c: Certificate, f: Facility) =>
  c.status === "available" && c.region === f.region && c.vintage === f.year;

/** MWh already committed per certificate. */
function usedByCertificate(allocations: Alloc[]) {
  const used = new Map<string, number>();
  for (const a of allocations) used.set(a.certificateId, (used.get(a.certificateId) ?? 0) + a.mwh);
  return used;
}

/** The auditor's rule. Called after every allocation run. */
export function assertNoOverAllocation(certificates: Certificate[], allocations: Alloc[]) {
  const used = usedByCertificate(allocations);
  for (const c of certificates) {
    const u = used.get(c.id) ?? 0;
    if (u > c.mwh) {
      throw new AppError("CONFLICT", `Certificate ${c.projectName} over-allocated`, {
        certificateId: c.id,
        allocated: u,
        mwh: c.mwh,
      });
    }
  }
}

/**
 * Greedy allocation. Facilities in name order; for each, eligible certificates
 * in vintage/id order, taking min(need, remaining). Existing FINAL allocations
 * are respected (their MWh is already spent; their facility need is reduced).
 */
export function allocate(
  facilities: Facility[],
  certificates: Certificate[],
  existingFinal: Alloc[] = [],
): DraftAllocation[] {
  const used = usedByCertificate(existingFinal);
  const remaining = (c: Certificate) => c.mwh - (used.get(c.id) ?? 0);
  const drafts: DraftAllocation[] = [];

  for (const f of [...facilities].sort(byName)) {
    let need =
      f.usageMwh -
      sumBy(
        existingFinal.filter((a) => a.facilityId === f.id),
        (a) => a.mwh,
      );
    const eligible = certificates.filter((c) => isEligible(c, f)).sort(byVintageThenId);
    for (const c of eligible) {
      if (need <= 0) break;
      const take = Math.min(need, remaining(c));
      if (take <= 0) continue;
      drafts.push({ certificateId: c.id, facilityId: f.id, mwh: take });
      used.set(c.id, (used.get(c.id) ?? 0) + take);
      need -= take;
    }
  }

  assertNoOverAllocation(certificates, [...existingFinal, ...drafts]);
  return drafts;
}

/** Plain-language reason a facility isn't fully covered. Rule-based, not AI. */
function gapReason(
  f: Facility,
  certificates: Certificate[],
  allocations: Alloc[],
  shortfall: number,
): string | null {
  if (shortfall <= 0) return null;
  const inRegion = certificates.filter((c) => c.region === f.region && c.status === "available");
  if (inRegion.length === 0) return `No certificates in ${f.region}`;

  const wrongVintage = inRegion.filter((c) => c.vintage !== f.year);
  const eligible = inRegion.filter((c) => c.vintage === f.year);
  const usedElsewhere = allocations.some(
    (a) => a.facilityId !== f.id && eligible.some((c) => c.id === a.certificateId),
  );

  const parts: string[] = [];
  if (wrongVintage.length) {
    const byVintage = new Map<number, number>();
    for (const c of wrongVintage) byVintage.set(c.vintage, (byVintage.get(c.vintage) ?? 0) + c.mwh);
    for (const [v, mwh] of byVintage) {
      parts.push(
        `${mwh.toLocaleString()} MWh of ${f.region} certificates are vintage ${v}, not ${f.year}`,
      );
    }
  }
  if (usedElsewhere) parts.push(`${f.region} certificates are used by other facilities`);
  if (!parts.length) parts.push(`Not enough ${f.year} ${f.region} certificates`);
  return `${shortfall.toLocaleString()} MWh short: ${parts.join("; ")}`;
}

export function coverage(
  facilities: Facility[],
  certificates: Certificate[],
  allocations: Alloc[],
): FacilityCoverage[] {
  const certById = new Map(certificates.map((c) => [c.id, c]));
  return [...facilities].sort(byName).map((f) => {
    const mine = allocations.filter((a) => a.facilityId === f.id);
    const matchedMwh = sumBy(mine, (a) => a.mwh);
    return {
      facilityId: f.id,
      name: f.name,
      city: f.city,
      region: f.region,
      year: f.year,
      usageMwh: f.usageMwh,
      matchedMwh,
      pct: Math.min(100, Math.round((matchedMwh / f.usageMwh) * 100)),
      allocations: mine.map((a) => ({
        certificateId: a.certificateId,
        projectName: certById.get(a.certificateId)?.projectName ?? "Unknown certificate",
        mwh: a.mwh,
      })),
      gapReason: gapReason(f, certificates, allocations, f.usageMwh - matchedMwh),
    };
  });
}
