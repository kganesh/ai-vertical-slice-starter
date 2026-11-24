<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions (for Claude Code / Cursor)

- **Domain first:** add/change fields in `src/domain/*.ts` (zod). API, repository and UI derive types from there; never hand-write duplicate types.
- **Routes stay thin:** `withErrorHandling` + `parseJson`/`parseQuery` → repository/service → `Response.json`. Throw `AppError` (`src/lib/errors.ts`); never return ad-hoc error shapes.
- **Storage only via** the repository interface wired in `src/server/container.ts`.
- **All LLM calls go through** `generateStructured()` in `src/server/ai/structured.ts` with a zod schema, a deterministic `fallback`, and a `check` where accuracy matters. Wrap user text with `asUntrustedInput`. Never call the model from client code.
- **AI output is a draft:** UI must label AI vs fallback, show confidence/rationale, and require a user action to persist.
- **UI:** use `src/components/ui/*` (Field for every input so labels/errors are wired). Every data view needs loading (Skeleton), empty (EmptyState) and error (Alert + retry) states. Icons from `lucide-react` with `aria-hidden` or an `aria-label`.
- **Before committing:** `npm run check`.
- Cache Components is enabled: no `export const dynamic`; use `await connection()` in a GET handler that doesn't read the request.
