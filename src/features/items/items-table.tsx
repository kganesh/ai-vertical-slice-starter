"use client";

import { Archive, Inbox, RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import type { Item, ItemStatus } from "@/domain/item";
import { ITEM_STATUSES } from "@/domain/item";
import type { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Badge,
  EmptyState,
  Input,
  NativeSelect,
  Skeleton,
} from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import type { z } from "zod";

type Status = z.infer<typeof ItemStatus>;

const STATUS_BADGE: Record<Status, "success" | "secondary" | "outline"> = {
  active: "success",
  draft: "secondary",
  archived: "outline",
};

export function ItemsToolbar({
  q,
  status,
  onQ,
  onStatus,
}: {
  q: string;
  status: Status | "";
  onQ: (v: string) => void;
  onStatus: (v: Status | "") => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Search items"
          placeholder="Search by name or description"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          className="pl-8"
        />
      </div>
      <NativeSelect
        aria-label="Filter by status"
        value={status}
        onChange={(e) => onStatus(e.target.value as Status | "")}
        className="sm:w-40"
      >
        <option value="">All statuses</option>
        {ITEM_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

export function ItemsTable({
  items,
  loading,
  error,
  filtered,
  onRetry,
  onArchive,
  onDelete,
}: {
  items: Item[] | null;
  loading: boolean;
  error: ApiError | null;
  filtered: boolean;
  onRetry: () => void;
  onArchive: (item: Item) => void;
  onDelete: (item: Item) => void;
}) {
  if (error && !items) {
    return (
      <Alert variant="destructive">
        <div className="flex flex-1 items-center justify-between gap-4">
          <span>Couldn&apos;t load items: {error.message}</span>
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden /> Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (!items) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading items">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Inbox />}
        title={filtered ? "No matches" : "No items yet"}
        description={
          filtered
            ? "Try a different search or clear the status filter."
            : "Draft one with AI from an email or note, or add one manually."
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card" aria-busy={loading || undefined}>
      <table className="w-full text-sm">
        <caption className="sr-only">Items</caption>
        <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Name
            </th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
              Category
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Quantity
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Status
            </th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium 2xl:table-cell">
              Updated
            </th>
            <th scope="col" className="px-4 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={loading ? "opacity-60 transition-opacity" : undefined}>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="max-w-[14rem] px-4 py-3 sm:max-w-[18rem]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="truncate">{item.name}</span>
                  {item.source === "ai_assisted" && (
                    <Sparkles
                      className="size-3.5 shrink-0 text-primary"
                      aria-label="Drafted with AI, confirmed by a person"
                    />
                  )}
                </div>
                {item.description && (
                  <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                )}
              </td>
              <td className="hidden px-4 py-3 capitalize md:table-cell">{item.category}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {item.quantity.toLocaleString()}{" "}
                <span className="text-muted-foreground">{item.unit}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_BADGE[item.status]} className="capitalize">
                  {item.status}
                </Badge>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground 2xl:table-cell">
                {formatDate(item.updatedAt)}
              </td>
              <td className="px-2 py-3">
                <div className="flex justify-end gap-0.5">
                  {item.status !== "archived" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Archive ${item.name}`}
                      onClick={() => onArchive(item)}
                    >
                      <Archive aria-hidden />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => onDelete(item)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
