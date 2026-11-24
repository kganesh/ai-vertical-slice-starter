# Decisions & trade-offs

Keep this open during the build. One line per decision, written when you make
it. It becomes the "trade-offs" part of the presentation.

| # | Decision | Why | Trade-off / what I'd do with more time |
|---|---|---|---|
| 1 | Next.js route handlers as the backend | One deployable, typed end to end, fastest path to a vertical slice | Separate service if the API had other consumers or heavy compute |
| 2 | zod schemas in `src/domain` shared by API + UI | One source of truth; client and server validate identically | Generate OpenAPI from the schemas for external consumers |
| 3 | Repository interface + JSON file store | Zero setup, demo-safe, swap in one place | Not multi-instance safe; Postgres + migrations for production |
| 4 | Standard error envelope with `code` + `requestId` | UI can branch on code; logs and user reports correlate | Add error tracking (Sentry) + OTel traces |
| 5 | AI via Vercel AI SDK, provider from env | Provider-agnostic; key never reaches the browser | Gateway with per-tenant quotas, caching, cost tracking |
| 6 | Structured output + zod validation, temperature 0 | No free-text parsing; invalid output is rejected, not shown | Evals on a golden set to measure accuracy over time |
| 7 | Grounding `check` (numbers must appear in source) | Catches the most damaging hallucination (wrong quantities) | Broader citation checks, span highlighting |
| 8 | Deterministic fallback, always low confidence | App stays useful when AI is down/slow; honest labelling | Queue + retry async for non-interactive flows |
| 9 | Human-in-the-loop: AI drafts, person confirms | Accuracy-sensitive domain; provenance stored as `source` | Auto-accept above a calibrated threshold once evals justify it |
| 10 | Untrusted input wrapped in tags + "data not instructions" | Basic prompt-injection hygiene | Input classifiers, output allow-lists for tool use |
| 11 | No auth | Out of scope for 2h; would be first production item | OAuth2/OIDC (SSO), per-org data isolation |

## Added during the exercise

| # | Decision | Why | Trade-off |
|---|---|---|---|
| 12 | | | |
