# Interview-day playbook (2.5h)

- **Prompts and the timeline:** [`prompt-playbook.md`](prompt-playbook.md) (its Timeline table is the one schedule to follow)
- **Source of truth during the build:** [`spec.md`](spec.md)
- **Python backend required?** [`prompt-playbook-python.md`](prompt-playbook-python.md)

## What they're scoring (from their overview)

| Criterion | What it means for you |
|---|---|
| **Execution** | A working slice, backend to UI. Get P0 end to end before any P1. |
| **Product judgment** | Purposeful, usable UI; balance speed and simplicity; say your cuts. |
| **Technical rigor** | Graceful error handling; composable architecture. |
| **AI responsibility** | Pragmatic AI feature, aware of accuracy, with safe fallbacks. |

Also stated: UI clarity, aesthetics and accessibility are **critical**; they're watching
**how you prioritize under time constraints**; AI in your workflow is **encouraged**.

## Before the call
- [ ] `git pull && npm install && npm run check`
- [ ] `.env.local`: `AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=` ready to paste their key (optional `AI_MODEL`)
- [ ] App runs once with a real key; header badge shows "AI on"
- [ ] Vercel project linked; a trivial push deploys
- [ ] Editor zoomed in, notifications off, only needed tabs open (it's recorded)
- [ ] Tabs ready: Next.js docs, AI SDK docs, this repo's `docs/`
- [ ] New branch: `git checkout -b exercise`

## The three phases

**I. Comprehension & Briefing (10 min):** Step 0. Restate the problem covering **every**
requirement and rule, ask 3–4 questions that would change what you build, state scope
and cuts out loud. Say: "I'll drive the build with Claude Code from a spec and review every diff."

**II. Build (2 hours):** Steps 1–6. Hard rules:
- P0 items end to end before any P1
- The polish slot (1:25–1:40) is protected: if behind, cut a backlog item, not polish
- Deploy cut-off 1:55, then demo locally
- Stuck > 5 min on one thing: cut it, update the spec, say so

**III. Presentation & Discussion (20 min):** ~10–12 minute talk (Step 6), then questions.
Open with the product and a live demo: happy path → AI path → pull the key to show
the fallback.

## While building (they're watching)
- Narrate decisions in one sentence each
- When AI writes code: read the diff, say what you kept or changed and why
- Commit every working step; the history shows prioritization
- Changes and cuts go into `docs/spec.md` first (change log), then code
