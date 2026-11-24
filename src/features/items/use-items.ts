"use client";

/**
 * Data hook for the items list. Deliberately tiny (no React Query) so it's
 * easy to read in a demo; mention React Query/SWR as the production choice.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CreateItemInput, Item, ListItemsQuery, UpdateItemInput } from "@/domain/item";
import { api, ApiError } from "@/lib/api-client";

export function useItems(query: ListItemsQuery) {
  const [items, setItems] = useState<Item[] | null>(null);
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
      const res = await api<{ items: Item[] }>(`/api/items${qs ? `?${qs}` : ""}`);
      if (id === reqId.current) {
        setItems(res.items);
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

  const create = useCallback(async (input: CreateItemInput) => {
    const { item } = await api<{ item: Item }>("/api/items", { method: "POST", json: input });
    setItems((prev) => (prev ? [item, ...prev] : [item]));
    toast.success(`Saved "${item.name}"`);
    return item;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateItemInput) => {
    const { item } = await api<{ item: Item }>(`/api/items/${id}`, {
      method: "PATCH",
      json: patch,
    });
    setItems((prev) => prev?.map((i) => (i.id === id ? item : i)) ?? null);
    return item;
  }, []);

  /** Optimistic delete with rollback on failure. */
  const remove = useCallback(
    async (item: Item) => {
      const snapshot = items;
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
      try {
        await api(`/api/items/${item.id}`, { method: "DELETE" });
        toast.success(`Deleted "${item.name}"`);
      } catch (e) {
        setItems(snapshot);
        toast.error((e as ApiError).message);
      }
    },
    [items],
  );

  return { items, error, loading, reload, create, update, remove };
}
