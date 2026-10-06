# Learning Runtime agent guide

## Read order

1. `AGENTS.md`
2. `README.md`
3. `docs/HANDOFF.md`
4. The current phase file under `docs/phases/`
5. The latest entries in `docs/ACTIVITY_LOG.md`
6. `docs/DECISIONS.md`
7. `PRD.md` when product intent or acceptance criteria are unclear
8. `docs/qa/`

## Architectural rules

1. Build a runtime that renders structured course specifications. Never hard-code a course in React.
2. Treat scientific artifacts, including DICOM, as first-class learning primitives rather than attachments.
3. Keep gamification above individual courses and drive it through centralized learner events.

## Commands

```text
npm run dev
npm run dev:default
npm run dev:sanofi
npm run build
npm run build:sanofi
npm run preview
npm run preview:sanofi
npm run typecheck
npm run lint
npm run test
npm run test:e2e:sanofi
npm run validate:content
npm run schema:export
npm run verify:default-build
npm run dicom:prepare -- <source-directory>
npm run dicom:audit -- <dicom-directory>
npm run check
```

## Coding conventions

- Use strict TypeScript and the `@/` alias for `src/`.
- Prefer small, focused components and pure domain functions.
- Load all learner/course content from validated configuration.
- Keep XP, thresholds, labels, presets and reward values in configuration.
- Emit typed learner events from UI. Engines and stores subscribe; primitives do not directly mutate gamification state.
- Lazy-load large scientific runtimes such as Cornerstone3D.
- Use semantic HTML, visible focus states, AA contrast and reduced-motion support.
- Add or update tests with behavior changes.

## Documentation protocol

- **`docs/ACTIVITY_LOG.md` is append-only.** Add an entry after every task, file change batch, install or significant command. Use:
  - `### [YYYY-MM-DD HH:MM] P1-Txx - short title`
  - Agent/session, Action, Files changed (paths), Commands run, Result/verification, Follow-ups.
- **`docs/HANDOFF.md` is overwritten as a snapshot** at the end of every session or when blocked. Sections: current phase/task, done, in progress, next 3 steps, blockers/questions for the user, environment notes, gotchas.
- Tick the current phase checklist as tasks complete and note deviations inline.
- Add an ADR to `docs/DECISIONS.md` for every non-trivial choice or deviation, including context, decision and consequences.
- Use Conventional Commits with the task ID, for example `feat(P1-T04): add primitive base schema`. Keep one logical change per commit.
- Never hard-code course-specific UI. Never put XP or other product constants in components. Never call analytics or mutate gamification state directly from primitives; use the event bus.
