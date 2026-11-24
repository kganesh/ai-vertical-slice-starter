"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Region } from "@/domain/certificate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { AiDraftPanel } from "./ai-draft-panel";
import { CertificateForm } from "./certificate-form";
import { CoverageCard } from "./coverage-card";
import { CertificatesTable, CertificatesToolbar } from "./certificates-table";
import { useCertificates } from "./use-certificates";

const REPORTING_YEAR = 2026;

export function Workspace() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<Region | "">("");
  const [showManual, setShowManual] = useState(false);
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const {
    certificates,
    error,
    loading,
    reload,
    create: createCert,
    remove: removeCert,
  } = useCertificates({
    q: q || undefined,
    region: region || undefined,
  });

  const bump = () => setInventoryVersion((v) => v + 1);
  const create: typeof createCert = async (input) => {
    const c = await createCert(input);
    bump();
    return c;
  };
  const remove: typeof removeCert = async (c) => {
    await removeCert(c);
    bump();
  };

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

      <CoverageCard version={inventoryVersion} />

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
