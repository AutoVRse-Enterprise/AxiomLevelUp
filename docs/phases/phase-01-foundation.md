# Phase 1: Foundation and DICOM/PWA spike

## Goal

Deliver a mobile-first React PWA foundation that loads validated configuration, persists a seeded learner, centralizes events and proves that an isolated Cornerstone3D stack can support the future educational viewer.

## Checklist

- [x] P1-T00 — Repository, agent-handoff and documentation scaffolding
- [x] P1-T01 — React/Vite scaffold, strict TypeScript and quality commands
- [x] P1-T02 — Tailwind tokens, accessible base UI and token preview
- [x] P1-T03 — Route tree, application shell and immersive layout
- [ ] P1-T04 — Zod content schema v0.1 and JSON Schema export
- [ ] P1-T05 — Runtime/CLI loaders, cross-reference validation and validation UX
- [ ] P1-T06 — Advanced/fresh seed data and invalid fixtures
- [ ] P1-T07 — Zustand state, IndexedDB persistence and selectors
- [ ] P1-T08 — Typed event bus and bounded event history
- [ ] P1-T09 — Hidden demo menu and working reset/seed/event controls
- [ ] P1-T10 — PWA manifest, generated icons, precache and online status
- [ ] P1-T11 — Lazy Cornerstone DICOM/PWA spike, data tools and findings
- [ ] P1-T12 — Automated tests and green `npm run check`
- [ ] P1-T13 — Close-out docs and Phase 2 outline

## Exit criteria

- The complete quality command passes and the preview is installable with an offline app shell.
- Routes work; learner navigation is hidden on immersive routes.
- JSON content is validated before use, including references, with actionable failures.
- Seed state is shown and survives reload; demo reset and seed switching work.
- The DICOM route is lazy, loads a de-identified series when present, supports the scoped tools and can reuse an online-loaded stack from runtime cache.
- Roadmap, decisions, activity history, handoff and spike findings are current.

## Deviations

- The local Node runtime is 24.19.0, newer than the plan's stated minimum. It is retained because the selected current tooling supports it.
