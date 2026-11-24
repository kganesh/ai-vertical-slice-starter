import type { Item } from "@/domain/item";

/**
 * Realistic-looking seed data makes the UI demo well. On interview day, ask
 * your AI assistant: "Generate 8 realistic seed records for <domain> matching
 * the Item schema in src/domain/item.ts" and paste them here.
 */
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export function seedItems(): Item[] {
  const rows: Array<Omit<Item, "id" | "createdAt" | "updatedAt"> & { age: number }> = [
    {
      name: "Wind farm output – Q3",
      description: "Metered generation from the West Texas wind portfolio.",
      category: "energy",
      status: "active",
      quantity: 12_400,
      unit: "MWh",
      source: "manual",
      age: 2,
    },
    {
      name: "Solar RECs – Oregon",
      description: "Renewable energy certificates issued for community solar sites.",
      category: "certificate",
      status: "active",
      quantity: 3_200,
      unit: "RECs",
      source: "ai_assisted",
      age: 5,
    },
    {
      name: "HQ electricity – Scope 2",
      description: "Purchased electricity for the Portland headquarters.",
      category: "emissions",
      status: "draft",
      quantity: 418,
      unit: "tCO2e",
      source: "manual",
      age: 9,
    },
    {
      name: "Fleet fuel – 2025",
      description: "Diesel consumption for the delivery fleet, pending invoice reconciliation.",
      category: "emissions",
      status: "archived",
      quantity: 96,
      unit: "tCO2e",
      source: "manual",
      age: 40,
    },
  ];
  return rows.map(({ age, ...r }, i) => ({
    ...r,
    id: `seed-${i + 1}`,
    createdAt: daysAgo(age),
    updatedAt: daysAgo(age),
  }));
}
