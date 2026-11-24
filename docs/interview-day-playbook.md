# Interview-day playbook (2.5h)

Prompts for each step: [`prompt-playbook.md`](prompt-playbook.md).

## Before the call
- [ ] `git pull && npm install && npm run check`
- [ ] `.env.local` ready for whichever provider key they give you (`AI_PROVIDER`, key, optional `AI_MODEL`)
- [ ] Vercel project linked; a trivial push deploys
- [ ] Editor zoomed in, notifications off, only needed tabs open (it's recorded)
- [ ] New branch: `git checkout -b exercise`

## 0:00–0:10 Briefing: ask, then scope out loud
- Who is the primary user and the ONE job they need done?
- What does "done" look like: one deep flow or broader coverage?
- For the AI feature: is a wrong answer or no answer worse? (sets review threshold)
- Can auth / persistence be mocked and discussed?
- Say your cut list out loud: "I'll build X end to end; Y and Z are stretch."

## 0:10–0:25 Reshape the starter (15 min max)
1. `src/domain/item.ts`: rename entity, set fields, enums
2. Find/replace `Item`/`item` → new name (types, routes folder, `features/items`)
3. `src/server/seed.ts`: ask AI for 6–8 realistic seed rows matching the schema
4. `layout.tsx`: `APP_NAME`, tagline; `globals.css`: `--primary` if you want
5. `npm run check`, commit: "Reshape starter for <problem>"

## 0:25–1:15 Core slice (backend → UI)
- Add/adjust routes and repository methods the flow needs
- Build the main screen; reuse Field/Card/Badge/EmptyState/Skeleton
- Commit every working step (the history shows prioritisation)

## 1:15–1:50 AI feature
- Copy `suggest-item.ts` pattern: schema (+confidence, rationale, missingFields) → `generateStructured` → fallback → `check`
- UI: label AI vs fallback, show confidence + rationale, human confirms
- One test with `MockLanguageModelV4` for the fallback path

## 1:50–2:05 Polish + deploy
- Empty / loading / error states on every new view; keyboard + labels
- Mobile width check
- Deploy. **If it isn't working by 1:55, demo locally.**
- Update `docs/decisions.md`

## 2:05–2:10 Buffer

## Presentation (20 min)
1. **Product (2 min):** user, problem, live demo of the happy path, then the AI path, then pull the key to show fallback
2. **Architecture & trade-offs (8 min):** diagram from README; walk `decisions.md`; error envelope; AI guardrails
3. **Next week (2 min):** auth/SSO, Postgres, OTel traces + evals for the AI feature, async processing
4. **Q&A**

## While building (they're watching)
- Narrate decisions in one sentence each
- When using AI to write code: read the diff, say what you kept/changed and why
- If stuck > 5 min on one thing, cut it and say so
