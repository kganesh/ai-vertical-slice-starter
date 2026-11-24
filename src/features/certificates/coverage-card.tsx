"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Factory, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { FacilityCoverage } from "@/domain/allocation";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type CoverageResponse = { facilities: FacilityCoverage[]; hasRun: boolean };

/** Reload whenever `version` changes (e.g. after a certificate is added). */
export function CoverageCard({ version }: { version: number }) {
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [running, setRunning] = useState(false);
  /** Inventory version the current allocations were computed from. */
  const [runVersion, setRunVersion] = useState(version);
  const stale = version !== runVersion;

  const load = useCallback(() => {
    api<CoverageResponse>("/api/coverage").then(
      (d) => {
        setData(d);
        setError(null);
      },
      (e: ApiError) => setError(e),
    );
  }, []);

  useEffect(load, [load]);

  async function run() {
    setRunning(true);
    try {
      setData(await api<CoverageResponse>("/api/matching/run", { method: "POST" }));
      setRunVersion(version);
      toast.success("Matching complete");
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setRunning(false);
    }
  }

  const rows = data?.facilities ?? [];
  const usage = rows.reduce((n, r) => n + r.usageMwh, 0);
  const matched = rows.reduce((n, r) => n + r.matchedMwh, 0);
  const overall = usage ? Math.round((matched / usage) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Facility coverage</CardTitle>
          <CardDescription>
            {data?.hasRun
              ? `${matched.toLocaleString()} of ${usage.toLocaleString()} MWh covered (${overall}%)`
              : "Match certificates by region and vintage to see what's covered."}
          </CardDescription>
        </div>
        <Button
          onClick={run}
          loading={running}
          variant={data?.hasRun && !stale ? "outline" : "default"}
        >
          {!running && <Play aria-hidden />}
          {data?.hasRun ? "Re-run matching" : "Run matching"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {stale && data?.hasRun && (
          <Alert variant="warning">
            <AlertTriangle aria-hidden />
            <span>Inventory changed since the last run. Re-run matching to update coverage.</span>
          </Alert>
        )}

        {error && !data ? (
          <Alert variant="destructive">
            <div className="flex flex-1 items-center justify-between gap-4">
              <span>Couldn&apos;t load coverage: {error.message}</span>
              <Button size="sm" variant="outline" onClick={load}>
                <RotateCcw aria-hidden /> Retry
              </Button>
            </div>
          </Alert>
        ) : !data ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading coverage">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Factory />}
            title="No facilities"
            description="Add facilities to start a claim."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <caption className="sr-only">Coverage per facility</caption>
              <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Facility
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Region
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Usage
                  </th>
                  <th scope="col" className="w-48 px-4 py-2.5 font-medium">
                    Covered
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.facilityId} className="border-b align-top last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.city}</div>
                    </td>
                    <td className="px-4 py-3">{r.region}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                      {r.usageMwh.toLocaleString()} MWh
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={r.pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${r.name} coverage`}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full",
                              r.pct >= 100
                                ? "bg-success"
                                : r.pct > 0
                                  ? "bg-warning"
                                  : "bg-destructive/60",
                            )}
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums">{r.pct}%</span>
                      </div>
                      {r.allocations.length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {r.allocations.map((a) => (
                            <li key={a.certificateId}>
                              {a.mwh.toLocaleString()} MWh · {a.projectName}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="max-w-[16rem] px-4 py-3 text-xs">
                      {!data.hasRun ? (
                        <span className="text-muted-foreground">Not matched yet</span>
                      ) : r.gapReason ? (
                        <span>{r.gapReason}</span>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle2 className="size-3" aria-hidden /> Fully covered
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
