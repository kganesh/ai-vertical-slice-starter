"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { ItemStatus } from "@/domain/item";
import type { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { AiDraftPanel } from "./ai-draft-panel";
import { ItemForm } from "./item-form";
import { ItemsTable, ItemsToolbar } from "./items-table";
import { useItems } from "./use-items";
import type { z } from "zod";

type Status = z.infer<typeof ItemStatus>;

export function ItemsWorkspace() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [showManual, setShowManual] = useState(false);
  const { items, error, loading, reload, create, update, remove } = useItems({
    q: q || undefined,
    status: status || undefined,
  });

  const total = items?.reduce((n, i) => n + (i.status === "active" ? 1 : 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Records</h1>
        <p className="text-muted-foreground">
          {items ? `${items.length} shown · ${total} active` : "Loading…"}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="list-heading" className="flex min-w-0 flex-col gap-3">
          <h2 id="list-heading" className="sr-only">
            All records
          </h2>
          <ItemsToolbar q={q} status={status} onQ={setQ} onStatus={setStatus} />
          <ItemsTable
            items={items}
            loading={loading}
            error={error}
            filtered={Boolean(q || status)}
            onRetry={reload}
            onArchive={async (item) => {
              try {
                await update(item.id, { status: "archived" });
                toast.success(`Archived "${item.name}"`);
              } catch (e) {
                toast.error((e as ApiError).message);
              }
            }}
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
                <ItemForm
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
