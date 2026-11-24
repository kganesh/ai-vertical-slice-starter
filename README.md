# AI Vertical Slice Starter

A production-minded Next.js starter for building a **thin vertical slice** fast:
typed API → service → storage, a polished accessible UI, and an AI feature
with structured output, guardrails and a deterministic fallback.

![stack](https://img.shields.io/badge/Next.js-16-black) ![ts](https://img.shields.io/badge/TypeScript-strict-blue) ![ai](https://img.shields.io/badge/Vercel_AI_SDK-Anthropic%20Claude-green)

## Quick start

```bash
npm install
cp .env.example .env.local   # add a key, or leave blank for fallback mode
npm run dev                  # http://localhost:3000
npm run check                # typecheck + lint + tests
```

## What's in the box

| Layer | Where | What it gives you |
|---|---|---|
| Domain | `src/domain/item.ts` | zod schemas shared by API, storage and UI. **Rename this first.** |
| API | `src/app/api/**/route.ts` | Thin route handlers: validate → call service → respond |
| Errors | `src/lib/errors.ts`, `api-handler.ts` | One error shape `{error:{code,message,details,requestId}}`, field-level validation errors, no leaked internals |
| Storage | `src/server/repository/` | `ItemRepository` interface + atomic, write-serialized JSON-file adapter |
| Wiring | `src/server/container.ts` | Composition root: swap storage/AI provider in one place |
| AI core | `src/server/ai/structured.ts` | `generateStructured()`: schema-validated output, timeout, retry, business-rule `check`, fallback with a reason |
| AI feature | `src/server/ai/features/suggest-item.ts` | Free text → structured draft with confidence, rationale, missing fields; grounding check; rule-based fallback |
| UI | `src/features/items/` | List + search/filter, skeletons, empty/error/retry states, optimistic delete, human-in-the-loop AI draft review |
| UI kit | `src/components/ui/` | shadcn/ui-style Button, Card, Field, Badge, Alert, Skeleton, EmptyState |
| Observability | `src/lib/logger.ts` | Structured JSON logs: request id, latency, AI success/fallback + reason |
| Tests | `**/*.test.ts` | Vitest: AI fallback paths (mock model), repository, error handling |

## AI behaviour

```
user text ─► validate (len) ─► wrap as untrusted data ─► Claude (JSON-schema output, 15s timeout, 1 retry)
                                                         │
                         schema fails / timeout / error / check fails
                                                         ▼
                                           deterministic fallback (low confidence)
                                                         │
                                       UI: "AI draft / rule-based draft" + confidence
                                       + rationale + highlighted missing fields
                                                         ▼
                                           human edits ─► Confirm & save (source: ai_assisted)
```

Nothing AI-generated is persisted without an explicit user action, and every
saved record keeps provenance (`source`).

`GET /api/health` reports whether AI is enabled and which model (never the key).

## Deploy (Vercel)

```bash
npx vercel            # first time: link project
npx vercel env add ANTHROPIC_API_KEY
npx vercel --prod
```

Storage on Vercel uses `/tmp` (ephemeral, per instance), fine for a demo.
For real use, implement `ItemRepository` against Postgres (Neon/Supabase) and
change one line in `container.ts`.

## Docs

- [`docs/interview-day-playbook.md`](docs/interview-day-playbook.md): the 2.5h plan and rename checklist
- [`docs/spec.md`](docs/spec.md): spec template, the single source of truth during the build
- [`docs/prompt-playbook.md`](docs/prompt-playbook.md): step-by-step prompts for the build
- [`docs/prompt-playbook-python.md`](docs/prompt-playbook-python.md): variant if the backend must be Python (FastAPI)
- [`docs/decisions.md`](docs/decisions.md): trade-off log (pre-filled; add to it live)
- [`AGENTS.md`](AGENTS.md): conventions for Claude Code / Cursor working in this repo
