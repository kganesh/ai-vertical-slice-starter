# Spec: [App name]

> **Single source of truth.** Every build prompt says "Read docs/spec.md" and implements
> one backlog item. When the interviewer clarifies something or you cut scope, change it
> HERE first, then the code. Keep each section short; a line earns its place only if it
> changes a decision.

**One-liner:** [Who] needs to [do what] so that [outcome].
**Primary user:** [name/role, technical level, who reviews their work]
**Main question the UI answers first:** [e.g. "Am I fully covered, and if not, why?"]

## 1. Functional requirements

Quote the briefing's key words. Restate these out loud in the first 10 minutes.

| ID | Requirement | Source (briefing words) |
|---|---|---|
| R1 | | "" |
| R2 | | "" |
| R3 | | "" |
| R4 | | "" |

**Business rules / invariants** (must never break; each has a test):

| ID | Rule | Enforced in |
|---|---|---|
| I1 | | `src/server/...` + test |

## 2. Sizing & non-functional requirements

| Concern | Target / assumption | Decision it drives |
|---|---|---|
| Data size | [e.g. 1 customer, ~50 X, ~1,000 Y per year] | [JSON store + in-memory logic are fine] |
| Latency | CRUD < 200 ms; AI 2–10 s, 15 s timeout | [spinner + fallback; sync, no queue] |
| Availability | Usable when the AI provider is down | Deterministic fallback, labelled |
| Consistency | [e.g. zero double-counting] | [invariant in pure code + tests; DB txn in prod] |
| Auditability | Same input → same output, every number explained | Deterministic logic, provenance (`source`) |
| Security / privacy | Key server-side only; user text not logged; untrusted input wrapped | See §6 |

## 3. Domain model

| Entity | Key fields (rule-relevant fields marked *) | Notes |
|---|---|---|
| | | |

## 4. Where AI is used (and where it isn't)

| Capability | AI or deterministic | Why | Guardrails |
|---|---|---|---|
| | AI | | schema, grounding check, fallback, human confirms |
| | Deterministic | auditable / must be exact | pure functions + tests |

## 5. API

| Method | Path | Purpose | Notes (idempotent? errors?) |
|---|---|---|---|
| GET | /api/health | AI mode | |

All errors: `{ error: { code, message, details?, requestId } }`, plus `x-request-id` on every response.

## 6. Security checklist (scoped to this app)

- [ ] All input validated with zod at the API boundary (body + query)
- [ ] No secrets in client code or logs; `.env*` gitignored
- [ ] Errors never leak stack traces / provider messages to the client
- [ ] Untrusted text wrapped for the LLM; LLM output schema-validated and grounded before use
- [ ] LLM output never executed, never used to build queries/HTML unescaped
- [ ] Auth: out of scope (say so); next step is SSO/OIDC + per-tenant isolation

## 7. Backlog (priority order)

Status: `todo` · `doing` · `done` · `cut`. Build strictly top to bottom.

| ID | Item | Serves | Status |
|---|---|---|---|
| P0-1 | Adapt starter: entities, seed data, app name | all | todo |
| P0-2 | | R | todo |
| P0-3 | | R | todo |
| P1-1 | | R | todo |
| P2-1 | | R | todo |

**Cut (and why):**
- [item]: [reason, one line; this becomes a trade-off in the presentation]

## 8. Change log

Clarifications from the interviewer and scope changes, with time.

- 0:05: [interviewer said ...]: changed [R2 / P1-1]
