"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CreateItemInput,
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  type CreateItemInput as CreateItemInputT,
} from "@/domain/item";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/primitives";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { z } from "zod";

type Values = {
  name: string;
  description: string;
  category: (typeof ITEM_CATEGORIES)[number];
  status: (typeof ITEM_STATUSES)[number];
  quantity: string;
  unit: string;
};

const EMPTY: Values = {
  name: "",
  description: "",
  category: "energy",
  status: "draft",
  quantity: "",
  unit: "",
};

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Create/edit form. Validates client-side with the SAME zod schema the API
 * uses, and maps server VALIDATION errors back onto fields.
 */
export function ItemForm({
  initial,
  highlight = [],
  source = "manual",
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Values>;
  /** Field names to visually flag (e.g. ones the AI couldn't determine). */
  highlight?: string[];
  source?: "manual" | "ai_assisted";
  submitLabel?: string;
  onSubmit: (input: CreateItemInputT) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<Values>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const set =
    <K extends keyof Values>(k: K) =>
    (e: { target: { value: string } }) =>
      setValues((v) => ({ ...v, [k]: e.target.value as Values[K] }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = CreateItemInput.safeParse({ ...values, source });
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
        <Field id="name" label="Name" error={errors.name} hint={flagHint("name")}>
          <Input value={values.name} onChange={set("name")} className={cn(flag("name"))} />
        </Field>
      </div>
      <Field id="category" label="Category" error={errors.category} hint={flagHint("category")}>
        <NativeSelect
          value={values.category}
          onChange={set("category")}
          className={cn(flag("category"))}
        >
          {ITEM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {label(c)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="status" label="Status" error={errors.status}>
        <NativeSelect value={values.status} onChange={set("status")}>
          {ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="quantity" label="Quantity" error={errors.quantity} hint={flagHint("quantity")}>
        <Input
          inputMode="decimal"
          value={values.quantity}
          onChange={set("quantity")}
          className={cn(flag("quantity"))}
        />
      </Field>
      <Field
        id="unit"
        label="Unit"
        error={errors.unit}
        hint={flagHint("unit") ?? "e.g. MWh, RECs, tCO2e"}
      >
        <Input value={values.unit} onChange={set("unit")} className={cn(flag("unit"))} />
      </Field>
      <div className="sm:col-span-2">
        <Field id="description" label="Description" error={errors.description}>
          <Textarea value={values.description} onChange={set("description")} rows={3} />
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
