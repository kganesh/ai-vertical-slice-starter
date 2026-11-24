"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { CreateCertificateInput } from "@/domain/certificate";
import type { SuggestCertificateResult } from "@/server/ai/features/suggest-certificate";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Textarea,
} from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api-client";
import { CertificateForm } from "./certificate-form";

const EXAMPLE =
  "Confirming transfer of 2,500 Wind RECs, ERCOT, vintage 2026, from Lone Star Wind Farm II, tracking ID TX-88213.";

const FALLBACK_COPY: Record<string, string> = {
  not_configured: "AI isn't configured, so this is a rule-based draft.",
  timeout: "The AI took too long, so this is a rule-based draft.",
  invalid_output: "The AI response didn't pass validation, so this is a rule-based draft.",
  failed_check: "The AI answer didn't match your text, so this is a rule-based draft.",
  provider_error: "The AI service had an error, so this is a rule-based draft.",
};

/**
 * Human-in-the-loop AI flow:
 *   paste text -> AI draft (with confidence + rationale) -> human edits -> save
 * Nothing AI-generated is saved without an explicit user action.
 */
export function AiDraftPanel({
  onCreate,
}: {
  onCreate: (i: CreateCertificateInput) => Promise<unknown>;
}) {
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<SuggestCertificateResult | null>(null);

  async function generate() {
    setPending(true);
    setInputError(undefined);
    try {
      setDraft(
        await api<SuggestCertificateResult>("/api/ai/suggest", { method: "POST", json: { text } }),
      );
    } catch (e) {
      const err = e as ApiError;
      if (err.code === "VALIDATION") setInputError(err.fieldErrors.text?.[0] ?? err.message);
      else toast.error(err.message);
    } finally {
      setPending(false);
    }
  }

  const s = draft?.data;
  const pct = s ? Math.round(s.confidence * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden /> Draft with AI
        </CardTitle>
        <CardDescription>
          Paste a broker email or transfer confirmation. You review every field before it&apos;s
          saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!draft ? (
          <>
            <Field
              id="ai-text"
              label="Source text"
              error={inputError}
              hint={
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={() => setText(EXAMPLE)}
                >
                  Use an example
                </button>
              }
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="e.g. Confirming transfer of 2,500 Wind RECs, ERCOT, vintage 2026…"
              />
            </Field>
            <div className="flex justify-end">
              <Button onClick={generate} loading={pending} disabled={!text.trim()}>
                {!pending && <Wand2 aria-hidden />}
                {pending ? "Drafting…" : "Generate draft"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div aria-live="polite" className="flex flex-col gap-2">
              {draft.source === "ai" ? (
                <Alert variant={draft.needsReview ? "warning" : "info"}>
                  {draft.needsReview ? <AlertTriangle aria-hidden /> : <CheckCircle2 aria-hidden />}
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 font-medium">
                      AI draft
                      <Badge variant={pct >= 70 ? "success" : "warning"}>{pct}% confidence</Badge>
                      <span className="text-xs font-normal text-muted-foreground">
                        {(draft.latencyMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <p className="text-muted-foreground">{s?.rationale}</p>
                  </div>
                </Alert>
              ) : (
                <Alert variant="warning">
                  <Info aria-hidden />
                  <div>
                    <p className="font-medium">{FALLBACK_COPY[draft.reason]}</p>
                    <p className="text-muted-foreground">
                      Check the highlighted fields before saving.
                    </p>
                  </div>
                </Alert>
              )}
            </div>
            <CertificateForm
              key={draft.latencyMs}
              source="ai_assisted"
              submitLabel="Confirm & save"
              highlight={s?.missingFields}
              initial={{
                projectName: s?.projectName ?? "",
                energyType: s?.energyType ?? "",
                region: s?.region ?? "",
                vintage: s?.vintage != null ? String(s.vintage) : "",
                mwh: s?.mwh != null ? String(s.mwh) : "",
                trackingId: s?.trackingId ?? "",
              }}
              onCancel={() => setDraft(null)}
              onSubmit={async (input) => {
                await onCreate(input);
                setDraft(null);
                setText("");
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
