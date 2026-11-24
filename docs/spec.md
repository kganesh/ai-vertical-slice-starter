# Spec: Clean Claim

> **Single source of truth.** Every build prompt says "Read docs/spec.md" and implements
> one backlog item. When the interviewer clarifies something or you cut scope, change it
> HERE first, then the code.

**One-liner:** A sustainability manager needs to match Renewable Energy Certificates (RECs)
to facility electricity use so she can make a renewable claim her auditor will accept.
**Primary user:** Priya, sustainability manager, ~5 US facilities, not technical; her auditor reviews the claim.
**Main question the UI answers first:** "Is each facility covered for 2026, and if not, why?"

## 1. Functional requirements

| ID | Requirement | Source (briefing words) |
|---|---|---|
| R1 | See facilities and their annual electricity use | "See her facilities and their annual electricity use" |
| R2 | Add certificates, including from messy text, with AI help | "including from messy text, with AI help" |
| R3 | Match certificates to facilities and see coverage per facility | "Match certificates to facilities and see coverage" |
| R4 | Understand what's not covered and why | "Understand what's not covered and why" |

**Business rules / invariants:**

| ID | Rule | Enforced in |
|---|---|---|
| I1 | A certificate covers usage only in the **same market region** | `isEligible()` in `src/server/matching.ts` + test |
| I2 | Certificate **vintage = reporting year** | `isEligible()` + test |
| I3 | A certificate may be split, but allocations **never exceed its MWh** (no double-counting) | `assertNoOverAllocation()`, runs after every allocation + test |
| I4 | Matching is deterministic: same inputs → same allocations | stable sort order + re-run test |
| I5 | Nothing AI-extracted is saved without a person confirming it | UI "Confirm & save"; `source: ai_assisted` recorded |

## 2. Sizing & non-functional requirements

| Concern | Target / assumption | Decision it drives |
|---|---|---|
| Data size | 1 customer: ~5–50 facilities, ~10–1,000 certificates per year | JSON-file store; matching in memory, O(facilities × certificates) |
| Latency | CRUD < 200 ms; matching < 100 ms; AI extraction 2–10 s, 15 s timeout | Matching runs synchronously (no queue); AI has spinner + fallback |
| Availability | App fully usable when the AI provider is down | Regex/keyword fallback, labelled "rule-based draft" |
| Consistency | Zero tolerance for double-counting (I3) | Invariant in pure code + tests; in prod: DB transaction + constraint around allocation |
| Auditability | Every covered MWh traceable to a certificate; every gap explained | Allocation records; rule-based gap reasons; deterministic matching |
| Security / privacy | Broker emails may contain business data | Key server-side only; pasted text and prompts not logged; input wrapped as untrusted |

## 3. Domain model

| Entity | Key fields (* = used by rules) | Notes |
|---|---|---|
| Facility | id, name, city, region*, year*, usageMwh* | Seeded, read-only (interviewer: "assume entered or seeded") |
| Certificate | id, projectName, energyType, region*, vintage*, mwh*, trackingId, status* (available/retired), source | 1 REC = 1 MWh |
| Allocation | id, certificateId, facilityId, mwh*, status (draft/final) | The split lives here, not on the certificate |

## 4. Where AI is used (and where it isn't)

| Capability | AI or deterministic | Why | Guardrails |
|---|---|---|---|
| Extract certificates from broker emails | AI | Input is unstructured and varied | zod schema, MWh/vintage grounding check, fallback, confidence + rationale, human confirms |
| Match certificates to facilities | Deterministic | Auditor needs exact, repeatable results | Pure functions, invariant check, tests |
| Explain coverage gaps | Deterministic | Must be exactly true; rules already know the reason | Rule-based strings from the same data |

## 5. API

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | /api/facilities | List facilities (R1) | |
| GET / POST | /api/certificates | List (search, region filter) / create (R2) | zod-validated |
| GET / PATCH / DELETE | /api/certificates/:id | Read / update / delete | 404 via error envelope |
| POST | /api/ai/suggest | Draft a certificate from text (R2) | Always 200 with `source: ai \| fallback` |
| POST | /api/matching/run | Recompute draft allocations (R3) | **Idempotent**; keeps final allocations |
| GET | /api/coverage | Per-facility coverage + gap reason (R3, R4) | |
| GET | /api/health | AI mode (provider/model, never the key) | |

All errors: `{ error: { code, message, details?, requestId } }`, plus `x-request-id` on every response.

## 6. Security checklist

- [x] All input validated with zod at the API boundary (body + query)
- [x] No secrets in client code or logs; `.env*` gitignored
- [x] Errors never leak stack traces / provider messages to the client
- [x] Untrusted text wrapped for the LLM; output schema-validated and grounded before use
- [x] LLM output never executed or rendered as HTML; React escapes everything
- [ ] Server owns `status`/`source`: today the client can POST `status: retired` or `source: ai_assisted` (A08); next: strip on create
- [ ] Auth: out of scope by design; next: SSO/OIDC + per-tenant isolation

## 7. Backlog (priority order)

| ID | Item | Serves | Status |
|---|---|---|---|
| P0-1 | Adapt starter: Certificate + Facility, seed data showing every coverage case, app name | all | done |
| P0-2 | AI draft: extract one certificate from pasted text, grounding check, fallback, human confirm | R2 | done |
| P0-3 | Matching: Allocation entity, pure greedy allocate(), invariant I3, idempotent run route, tests | R3 | done |
| P0-4 | Coverage view: per-facility %, allocations, rule-based gap reasons, stale-inventory warning | R3, R4 | done |
| P1-1 | Extract **several** certificates from one email (the briefing's example holds two) | R2 | todo |
| P1-2 | Finalize claim: allocations → final, certificates → retired | R3 | todo |
| P1-3 | Server-owned `status`/`source` on create (security checklist) | security | todo |
| P2-1 | PDF / image input via OCR or a vision model | R2 | cut |
| P2-2 | Manual per-facility allocation overrides | R3 | cut |

**Cut (and why):**
- PDF / handwritten input: needs OCR or vision plus new failure modes; text paste proves the pattern in the time.
- Manual allocation: greedy auto-match covers the core need; manual overrides add UI and validation complexity.
- Multiple reporting years, editing facilities, export, auth: not needed to answer "am I covered for 2026?".

## 8. Change log

- 0:05: interviewer: facilities can be seeded → Facility read-only (P0-1)
- 0:09: interviewer: split rule clarified ("never exceed the certificate's own MWh") → I3
- 0:11: decided text-only AI input; PDFs/handwriting cut (P2-1)
- Post-run review: briefing example email has two certificates, extraction returns one → added P1-1
