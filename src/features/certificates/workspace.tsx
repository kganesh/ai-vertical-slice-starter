"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Region } from "@/domain/certificate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { AiDraftPanel } from "./ai-draft-panel";
import { CertificateForm } from "./certificate-form";
import { CertificatesTable, CertificatesToolbar } from "./certificates-table";
import { useCertificates } from "./use-certificates";

// Matching/coverage lands in the next step; facilities are served by /api/facilities.
const REPORTING_YEAR = 2026;

export function Workspace() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<Region | "">("");
  const [showManual, setShowManual] = useState(false);
  const { certificates, error, loading, reload, create, remove } = useCertificates({
    q: q || undefined,
    region: region || undefined,
  });

  const available =
    certificates?.reduce((n, c) => n + (c.status === "available" ? c.mwh : 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{REPORTING_YEAR} renewable claim</h1>
        <p className="text-muted-foreground">
          {certificates
            ? `${certificates.length} certificates · ${available.toLocaleString()} MWh available`
            : "Loading…"}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="inventory-heading" className="flex min-w-0 flex-col gap-3">
          <h2 id="inventory-heading" className="font-semibold">
            Certificate inventory
          </h2>
          <CertificatesToolbar q={q} region={region} onQ={setQ} onRegion={setRegion} />
          <CertificatesTable
            certificates={certificates}
            loading={loading}
            error={error}
            filtered={Boolean(q || region)}
            reportingYear={REPORTING_YEAR}
            onRetry={reload}
            onDelete={remove}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <AiDraftPanel onCreate={create} />
          {showManual ? (
            <Card>
              <CardHeader>
                <CardTitle>Add manually</CardTitle>
              </CardHeader>
              <CardContent>
                <CertificateForm
                  onSubmit={async (input) => {
                    await create(input);
                    setShowManual(false);
                  }}
                  onCancel={() => setShowManual(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" onClick={() => setShowManual(true)}>
              <Plus aria-hidden /> Add manually
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}
