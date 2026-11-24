"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  CreateCertificateInput,
  ENERGY_TYPES,
  REGIONS,
  type CreateCertificateInput as CreateCertificateInputT,
} from "@/domain/certificate";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/primitives";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type CertificateFormValues = {
  projectName: string;
  energyType: (typeof ENERGY_TYPES)[number] | "";
  region: (typeof REGIONS)[number] | "";
  vintage: string;
  mwh: string;
  trackingId: string;
};

const EMPTY: CertificateFormValues = {
  projectName: "",
  energyType: "",
  region: "",
  vintage: "",
  mwh: "",
  trackingId: "",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Create form. Validates client-side with the SAME zod schema the API uses,
 * and maps server VALIDATION errors back onto fields.
 */
export function CertificateForm({
  initial,
  highlight = [],
  source = "manual",
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initial?: Partial<CertificateFormValues>;
  /** Fields to visually flag (e.g. ones the AI couldn't find in the text). */
  highlight?: string[];
  source?: "manual" | "ai_assisted";
  submitLabel?: string;
  onSubmit: (input: CreateCertificateInputT) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<CertificateFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const set =
    <K extends keyof CertificateFormValues>(k: K) =>
    (e: { target: { value: string } }) =>
      setValues((v) => ({ ...v, [k]: e.target.value as CertificateFormValues[K] }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = CreateCertificateInput.safeParse({
      ...values,
      energyType: values.energyType || undefined,
      region: values.region || undefined,
      source,
    });
    if (!parsed.success) {
      const fe = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
      setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(parsed.data);
      setValues({ ...EMPTY });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "VALIDATION") {
        setErrors(
          Object.fromEntries(Object.entries(apiErr.fieldErrors).map(([k, v]) => [k, v?.[0]])),
        );
      }
      toast.error(apiErr.message);
    } finally {
      setSaving(false);
    }
  }

  const flag = (f: string) => highlight.includes(f) && "border-warning ring-1 ring-warning/40";
  const flagHint = (f: string) =>
    highlight.includes(f) ? "Not found in the text. Please fill in." : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field
          id="projectName"
          label="Project"
          error={errors.projectName}
          hint={flagHint("projectName")}
        >
          <Input
            value={values.projectName}
            onChange={set("projectName")}
            className={cn(flag("projectName"))}
          />
        </Field>
      </div>
      <Field id="region" label="Region" error={errors.region} hint={flagHint("region")}>
        <NativeSelect value={values.region} onChange={set("region")} className={cn(flag("region"))}>
          <option value="">Select…</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field
        id="vintage"
        label="Vintage"
        error={errors.vintage}
        hint={flagHint("vintage") ?? "Generation year"}
      >
        <Input
          inputMode="numeric"
          value={values.vintage}
          onChange={set("vintage")}
          className={cn(flag("vintage"))}
        />
      </Field>
      <Field id="mwh" label="MWh" error={errors.mwh} hint={flagHint("mwh") ?? "1 REC = 1 MWh"}>
        <Input
          inputMode="numeric"
          value={values.mwh}
          onChange={set("mwh")}
          className={cn(flag("mwh"))}
        />
      </Field>
      <Field
        id="energyType"
        label="Energy type"
        error={errors.energyType}
        hint={flagHint("energyType")}
      >
        <NativeSelect
          value={values.energyType}
          onChange={set("energyType")}
          className={cn(flag("energyType"))}
        >
          <option value="">Select…</option>
          {ENERGY_TYPES.map((t) => (
            <option key={t} value={t}>
              {cap(t)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="sm:col-span-2">
        <Field id="trackingId" label="Tracking ID (optional)" error={errors.trackingId}>
          <Input value={values.trackingId} onChange={set("trackingId")} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
