import type { Facility } from "@/domain/facility";

/** Facilities are read-only reference data for this slice. */
export interface FacilityRepository {
  list(): Promise<Facility[]>;
}

export class InMemoryFacilityRepository implements FacilityRepository {
  constructor(private readonly facilities: Facility[]) {}
  async list() {
    return [...this.facilities].sort((a, b) => a.name.localeCompare(b.name));
  }
}
