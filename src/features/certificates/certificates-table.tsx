"use client";

import { Inbox, RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import { REGIONS, type Certificate, type Region } from "@/domain/certificate";
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

export function CertificatesToolbar({
  q,
  region,
  onQ,
  onRegion,
}: {
  q: string;
  region: Region | "";
  onQ: (v: string) => void;
  onRegion: (v: Region | "") => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Search certificates"
          placeholder="Search by project or tracking ID"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          className="pl-8"
        />
      </div>
      <NativeSelect
        aria-label="Filter by region"
        value={region}
        onChange={(e) => onRegion(e.target.value as Region | "")}
        className="sm:w-40"
      >
        <option value="">All regions</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

export function CertificatesTable({
  certificates,
  loading,
  error,
  filtered,
  reportingYear,
  onRetry,
  onDelete,
}: {
  certificates: Certificate[] | null;
  loading: boolean;
  error: ApiError | null;
  filtered: boolean;
  reportingYear: number;
  onRetry: () => void;
  onDelete: (c: Certificate) => void;
}) {
  if (error && !certificates) {
    return (
      <Alert variant="destructive">
        <div className="flex flex-1 items-center justify-between gap-4">
          <span>Couldn&apos;t load certificates: {error.message}</span>
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden /> Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (!certificates) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading certificates">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <EmptyState
        icon={<Inbox />}
        title={filtered ? "No matches" : "No certificates yet"}
        description={
          filtered
            ? "Try a different search or clear the region filter."
            : "Paste a broker email to draft one with AI, or add one manually."
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card" aria-busy={loading || undefined}>
      <table className="w-full text-sm">
        <caption className="sr-only">Certificate inventory</caption>
        <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Project
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Region
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Vintage
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              MWh
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Status
            </th>
            <th scope="col" className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={loading ? "opacity-60 transition-opacity" : undefined}>
          {certificates.map((c) => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="max-w-[16rem] px-4 py-3">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="truncate">{c.projectName}</span>
                  {c.source === "ai_assisted" && (
                    <Sparkles
                      className="size-3.5 shrink-0 text-primary"
                      aria-label="Drafted with AI, confirmed by a person"
                    />
                  )}
                </div>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {c.energyType}
                  {c.trackingId && <span className="normal-case"> · {c.trackingId}</span>}
                </p>
              </td>
              <td className="px-4 py-3">{c.region}</td>
              <td className="px-4 py-3">
                {c.vintage === reportingYear ? (
                  c.vintage
                ) : (
                  <Badge variant="warning" title={`Doesn't count toward ${reportingYear}`}>
                    {c.vintage}
                  </Badge>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {c.mwh.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={c.status === "available" ? "success" : "outline"}
                  className="capitalize"
                >
                  {c.status}
                </Badge>
              </td>
              <td className="px-2 py-3 text-right">
                {c.status === "available" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${c.projectName}`}
                    onClick={() => onDelete(c)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
