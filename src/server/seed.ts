import type { Certificate } from "@/domain/certificate";
import type { Facility } from "@/domain/facility";

/**
 * Seeded so the demo shows every coverage outcome:
 *  - PJM:   fully covered
 *  - ERCOT: certificates exist but run out across two facilities
 *  - WECC:  partly covered; one certificate is the wrong vintage (2025)
 *  - MISO:  only a 2025 certificate, so 0% covered
 */
export const REPORTING_YEAR = 2026;

export const seedFacilities: Facility[] = [
  {
    id: "fac-dal",
    name: "Dallas Distribution Center",
    city: "Dallas, TX",
    region: "ERCOT",
    year: REPORTING_YEAR,
    usageMwh: 3000,
  },
  {
    id: "fac-hou",
    name: "Houston Plant",
    city: "Houston, TX",
    region: "ERCOT",
    year: REPORTING_YEAR,
    usageMwh: 1800,
  },
  {
    id: "fac-pdx",
    name: "Portland HQ",
    city: "Portland, OR",
    region: "WECC",
    year: REPORTING_YEAR,
    usageMwh: 2200,
  },
  {
    id: "fac-chi",
    name: "Chicago Office",
    city: "Chicago, IL",
    region: "PJM",
    year: REPORTING_YEAR,
    usageMwh: 2400,
  },
  {
    id: "fac-msp",
    name: "Minneapolis Warehouse",
    city: "Minneapolis, MN",
    region: "MISO",
    year: REPORTING_YEAR,
    usageMwh: 900,
  },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export function seedCertificates(): Certificate[] {
  const rows: Array<Omit<Certificate, "id" | "createdAt" | "updatedAt" | "status" | "source">> = [
    {
      projectName: "Lone Star Wind Farm II",
      energyType: "wind",
      region: "ERCOT",
      vintage: 2026,
      mwh: 2500,
      trackingId: "TX-88213",
    },
    {
      projectName: "Panhandle Solar",
      energyType: "solar",
      region: "ERCOT",
      vintage: 2026,
      mwh: 1500,
      trackingId: "TX-90114",
    },
    {
      projectName: "Columbia River Hydro",
      energyType: "hydro",
      region: "WECC",
      vintage: 2026,
      mwh: 1800,
      trackingId: "WR-55102",
    },
    {
      projectName: "Mesa Verde Solar",
      energyType: "solar",
      region: "WECC",
      vintage: 2025,
      mwh: 800,
      trackingId: "WR-41877",
    },
    {
      projectName: "Appalachian Ridge Wind",
      energyType: "wind",
      region: "PJM",
      vintage: 2026,
      mwh: 2400,
      trackingId: "PJM-7731",
    },
    {
      projectName: "Prairie Gust Wind",
      energyType: "wind",
      region: "MISO",
      vintage: 2025,
      mwh: 600,
      trackingId: "M-RETS-2209",
    },
  ];
  return rows.map((r, i) => ({
    ...r,
    id: `cert-${i + 1}`,
    status: "available",
    source: "manual",
    createdAt: daysAgo(10 + i),
    updatedAt: daysAgo(10 + i),
  }));
}
