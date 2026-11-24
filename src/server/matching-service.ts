/** Orchestrates repositories + pure matching. Routes call this, not the repos directly. */
import { allocationRepo, certificateRepo, facilityRepo } from "@/server/container";
import { allocate, coverage } from "@/server/matching";
import { log } from "@/lib/logger";

export async function getCoverage() {
  const [facilities, certificates, allocations] = await Promise.all([
    facilityRepo.list(),
    certificateRepo.list(),
    allocationRepo.list(),
  ]);
  return {
    facilities: coverage(facilities, certificates, allocations),
    hasRun: allocations.length > 0,
  };
}

/** Idempotent: drafts are recomputed from scratch; final allocations are kept. */
export async function runMatching() {
  const [facilities, certificates, existing] = await Promise.all([
    facilityRepo.list(),
    certificateRepo.list(),
    allocationRepo.list(),
  ]);
  const finals = existing.filter((a) => a.status === "final");
  const drafts = allocate(facilities, certificates, finals);
  await allocationRepo.replaceDrafts(drafts);
  log.info("matching_run", { drafts: drafts.length, finals: finals.length });
  return getCoverage();
}
