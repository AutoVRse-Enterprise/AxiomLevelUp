# Phase 14: Multi-experience foundation

**Status:** Planned

Programme context: `docs/MEDICAL_CHALLENGE_PLAN.md`.

## Goal

Refactor the application so one codebase builds and runs multiple demo experiences. The existing
Learning Runtime becomes the `default` experience with **no learner-visible change**. A new
`sanofi` experience boots with its own homepage (a minimal game-hub stub in this phase), its own
content root, navigation, theme tokens, storage namespace and build metadata. All application
code — engines, players, primitives, stores, selectors, components and content APIs — remains
shared. `VITE_EXPERIENCE` selects the experience, and `npm run dev:default` / `npm run dev:sanofi`
launch each configuration.

## Definition of "default unchanged"

The default experience is unchanged when all of the following hold after every task:

1. Route paths, route handles (titles), layouts and lazy boundaries are identical. Home remains
   eagerly bundled (ADR-093/P12-T10 Lighthouse fix).
2. `primaryNavigation` items, order, icons and the header learner-status area are identical.
3. `public/content/**` is byte-identical.
4. Persisted keys are identical: IndexedDB `learner`, `activity-session`, `event-log`,
   `offline-library`; the `localStorage` preference and simulated-offline keys; the service-worker
   settings database `axiom-runtime-service-worker`; cache names `offline-courses-v1`,
   `dicom-studies-v1`, `versioned-case-models-v1`. Existing local progress survives the upgrade.
5. The built PWA manifest (name, short name, description, colours, start URL, scope, icons) and
   `index.html` title, description and theme colour are identical.
6. `npm run check` passes; the default serial Playwright suite passes; the eight
   `e2e/phase-13-case-lab.spec.ts-snapshots` baselines pass without `--update-snapshots`.
7. Default bundle budgets in `scripts/budget/bundle-budget.json` pass with no relaxed limit.

## Scope

### In scope

- Experience contract, registry and build-time resolution.
- `VITE_EXPERIENCE`, `dev:default`, `dev:sanofi`, `build:sanofi`, `preview:sanofi`,
  `test:e2e:sanofi` scripts.
- Experience-aware composition root, router factory and shell (navigation, header status, brand).
- Experience-scoped content root and loader base URL; manifest/app-config schema relaxations that
  let a non-LMS experience validate without changing default types or content.
- Storage, cache and service-worker namespacing for non-default experiences.
- Per-experience HTML/PWA metadata, dev port, output directory, precache scope and install-prompt
  policy.
- Theme token overrides scoped by `html[data-experience]`.
- Import-boundary lint rules.
- A minimal, valid sanofi content root and a stub homepage.
- Tooling: content validation, tests, budgets and Playwright configuration for both experiences.

### Out of scope

- Game schemas, engine, player, rounds or the real hub (Phases 15–19).
- Any change to default learner-visible behaviour or default content.
- Registering game routes in the default experience.
- Hosting, deployment or physical-device evidence.

## Design

### Experience contract

```ts
// src/experiences/types.ts (sketch)
export type ExperienceId = 'default' | 'sanofi'

export interface ExperienceBuildMetadata {
  id: ExperienceId
  html: { title: string; description: string; themeColor: string }
  pwa: { name: string; shortName: string; description: string; themeColor: string;
         backgroundColor: string; icons: PwaIcon[] }
  devPort: number            // default 5173, sanofi 5174
  previewPort: number        // default 4173, sanofi 4174
  outDir: string             // default 'dist', sanofi 'dist-sanofi'
  devPwaTempDir: string      // default 'dev-dist', sanofi 'dev-dist-sanofi'
  contentDir: string         // repository path, e.g. 'public/content'
  precacheIgnore: string[]   // other experiences' content roots
}

export interface ExperienceDefinition {
  id: ExperienceId
  contentBaseUrl: string                // '/content' | '/experiences/sanofi/content'
  storageNamespace: string | null       // null = legacy unprefixed keys (default only)
  routes: { shell: RouteObject[]; immersive: RouteObject[] }
  navigation: readonly NavigationItem[] // { to, label, icon, end }
  shell: {
    headerStatus: 'learner' | 'none' | ComponentType   // default 'learner' (XP + streak)
    installPrompt: boolean                               // sanofi false
    devTools: boolean                                    // default honours existing rule
  }
}
```

`build.ts` files are plain data with no React or browser imports so `vite.config.ts` can import
them (it already imports `scripts/build/build-id.ts`). `index.ts` files are the runtime
definitions.

### Selection and resolution

1. `vite.config.ts` loads env for the current mode and resolves
   `VITE_EXPERIENCE ?? 'default'`.
2. Committed, non-secret mode files carry the variable: `.env.default` contains
   `VITE_EXPERIENCE=default` and `.env.sanofi` contains `VITE_EXPERIENCE=sanofi`. `.gitignore`
   gains `!.env.default` and `!.env.sanofi` exceptions; `.env.example` documents the variable.
3. Scripts use Vite modes so they are cross-platform on PowerShell, cmd and POSIX shells without a
   new dependency:

   ```json
   "dev": "vite",
   "dev:default": "vite --mode default",
   "dev:sanofi": "vite --mode sanofi",
   "build": "tsc -b && vite build",
   "build:sanofi": "tsc -b && vite build --mode sanofi",
   "preview:sanofi": "vite preview --mode sanofi",
   "test:e2e:sanofi": "playwright test --config playwright.sanofi.config.ts"
   ```

4. Fail fast: an unknown ID fails the dev server and build with the list of known IDs. When the
   mode name is itself an experience ID and the resolved variable disagrees (for example a shell
   export of `VITE_EXPERIENCE=sanofi` while running `dev:default`), fail with a message explaining
   Vite's precedence (process env overrides `.env.[mode]`).
5. `vite.config.ts` sets `define['import.meta.env.VITE_EXPERIENCE']`, the dev/preview ports,
   `build.outDir`, the PWA manifest, the PWA dev temp folder, precache `globIgnores` and an
   `index.html` transform for title/description/theme colour — all from the active `build.ts`.
6. **Static selection, not a runtime registry.** An alias `@experience` resolves to
   `src/experiences/<id>/index.ts` in Vite and Vitest. Only the active experience is bundled, Home
   stays eager and there is no runtime cost. `tsconfig` maps `@experience` to the default
   definition for editor types; both definitions are type-checked as ordinary files and declare
   `satisfies ExperienceDefinition`. Tests import `@/experiences/sanofi` directly when needed.
7. Runtime code reads the active ID from `import.meta.env.VITE_EXPERIENCE` (typed in
   `src/vite-env.d.ts`) only through `src/experiences/ids.ts`.

### Composition root

- `App` obtains the definition from `@experience`, sets `document.documentElement.dataset
  .experience`, passes `contentBaseUrl` to `ContentProvider` (the loader and worker already accept
  a base URL) and builds the router from the definition.
- `src/app/router.tsx` keeps `lazyPage`, `RouteErrorPage` wiring and the dev-tools rule, and
  exposes `createExperienceRouter(definition)`. The existing default route table moves verbatim to
  `src/experiences/default/routes.tsx`; `createAppRoutes` stays exported from `@/app/router` as a
  compatibility alias so `router.test.tsx` and other tests keep their imports.
- `HomePage.tsx` and every existing route module stay in place, untouched.

### Shell parametrization

- `AppShell`, `PageHeader` and `ImmersiveLayout` receive navigation items, header-status mode and
  install-prompt policy from the active definition through a small `ExperienceContext`.
- The default definition passes the existing `primaryNavigation` and `headerStatus: 'learner'`, so
  DOM output is identical. The bottom-navigation grid derives its column count from the item count
  (currently hard-coded `grid-cols-5`; the default still renders five).
- `PwaPromptHost` honours `shell.installPrompt`. `BuildStamp` shows the experience ID only in
  development builds.

### Content roots and schema relaxations

- Each experience owns a complete content root: default keeps `public/content/`; sanofi uses
  `public/experiences/sanofi/content/`. Binary assets in `public/assets/` are shared by path.
- Sanofi has its own `assets.json` listing only the assets it uses. Duplicated metadata cannot
  drift because `validate:content` verifies size and SHA-256 against the shared files.
- Relax schemas only where a non-LMS experience needs it, without making default types optional:
  - manifest `courses` becomes `.default([])`;
  - manifest `seeds` requires only the `defaultSeed` entry;
  - app-config `concepts`, `pathways`, `badges` and `challenges` become `.default([])`, and the
    previous `min(1)` rules move into semantic validation that applies when courses or pathways
    are configured;
  - product sub-blocks used only by the LMS (DICOM, offline install-prompt thresholds) receive
    schema defaults.
  Inferred TypeScript types stay non-optional arrays/objects, so default route code needs no new
  null checks. The default content still validates with zero warnings and identical counts.
- `scripts/validate-content.ts` iterates every experience's `contentDir` and prints one summary
  line per experience.

### Storage and cache namespacing

- Add `scopedKey(name)` in `src/state/persistence/` that returns `name` when
  `storageNamespace === null` and `${namespace}:${name}` otherwise. Apply it to the four Zustand
  persist names, the preference and simulated-offline `localStorage` keys and the Pathway
  `sessionStorage` key.
- Prefix the service-worker settings database and the three cache names for non-default
  experiences (`sanofi-offline-courses-v1`, …) through `src/pwa/cachePolicy.ts`; default names stay
  literal.
- Separate dev ports already isolate origins locally. Namespacing protects shared-origin hosting
  and is documented as defence in depth; separate origins remain the deployment recommendation.

### Theme

- Tokens in `src/styles/tokens.css` are CSS variables. `src/experiences/sanofi/theme.css`
  overrides colour tokens under `html[data-experience='sanofi']` (for example a darker scientific
  palette). No component is forked or restyled per experience. The default has no override file.

### Import boundaries

Extend `eslint.config.js` `no-restricted-imports`, mirroring the existing Cornerstone/Three rules:

- `src/**` outside `src/experiences/**` and `src/app/**` must not import `@/experiences/*` or
  `@experience`.
- `src/experiences/<a>/**` must not import `src/experiences/<b>/**`.
- `src/experiences/**` must not import engine internals that bypass public module entry points
  (keeps experiences as composition).

### Sanofi stub

- `public/experiences/sanofi/content/`: `manifest.json`, `app-config.json` (app name, minimal
  product/presentation/anatomy configuration, empty LMS arrays), `seeds/fresh.json` (anonymous
  player "You", zero history) and `assets.json`.
- `src/experiences/sanofi/HomePage.tsx`: a placeholder hub with the configured app name and a
  disabled **Start a quick challenge** action labelled "Coming in Phase 16" for internal builds
  only. It composes shared `ui` components and reads copy from configuration.
- Navigation: Play (`/`) only in this phase. Unknown paths use the shared `NotFoundPage`.

## Checklist

- [ ] **P14-T00 — Baseline and decisions**
  - Record the default baseline: `npm run check` counts, serial Playwright result, eight golden
    images, gzip sizes per budget role, PWA manifest JSON and persisted key names.
  - Confirm ADR-105 (experience selection) from Proposed to Accepted, or revise it.
  - Confirm open question 7 (default does not register game routes).
  - Record the user's resolved product decisions: app name "Autovrse LevelUp", game title
    "Respiratory Challenge", "Demo leaderboard", all three difficulties, recommended formats,
    anonymous "You", external hosting gate, and no default game routes.

- [ ] **P14-T01 — Experience contract and resolver**
  - Add `src/experiences/types.ts`, `ids.ts`, `default/build.ts`, `sanofi/build.ts`.
  - Type `VITE_EXPERIENCE` in `src/vite-env.d.ts`.
  - Unit-test resolution: unset → default; valid IDs; unknown ID error; mode/variable mismatch.

- [ ] **P14-T02 — Build and script wiring**
  - Implement resolution, alias, `define`, ports, `outDir`, PWA manifest, PWA dev temp dir,
    precache ignores and HTML transform in `vite.config.ts`; add the `@experience` alias to
    `vitest.config.ts` and `tsconfig` paths.
  - Add `.env.default`, `.env.sanofi`, `.gitignore` exceptions, `dist-sanofi/` and
    `dev-dist-sanofi/` ignores, and the scripts listed above.
  - Verify `npm run dev`, `dev:default` and `dev:sanofi` start on the expected ports, and that both
    can run concurrently.

- [ ] **P14-T03 — Composition root and router factory**
  - Move the default route table verbatim into `src/experiences/default/routes.tsx`; keep the
    `createAppRoutes` compatibility export.
  - Add `createExperienceRouter`, `ExperienceContext` and the `data-experience` attribute.
  - Route tests: default table deep-equals the pre-refactor table (paths, handles, dev gating).

- [ ] **P14-T04 — Shell parametrization**
  - Parameterize `AppShell`, `PageHeader`, `ImmersiveLayout`, `PwaPromptHost` and `BuildStamp`.
  - Default renders identical DOM (snapshot of shell markup before/after) and the same five-item
    grid.

- [ ] **P14-T05 — Experience content root and schema relaxations**
  - Pass `contentBaseUrl` through `ContentProvider`, `loadRuntimeContent` and the content worker.
  - Apply the schema relaxations with semantic replacements; export schemas.
  - Default content validates with identical counts and zero warnings; add fixtures proving a
    minimal non-LMS app-config validates and an LMS config missing pathways still fails.

- [ ] **P14-T06 — Storage, cache and service-worker namespacing**
  - Add `scopedKey`; apply to every persisted key and cache name listed above.
  - Tests prove default keys are literal and sanofi keys are prefixed; migrations unaffected.

- [ ] **P14-T07 — Theme overrides and import boundaries**
  - Add the scoped sanofi theme file loaded by the sanofi definition.
  - Add ESLint boundary rules with failing-fixture verification.

- [ ] **P14-T08 — Sanofi stub experience**
  - Author the minimal sanofi content root and stub homepage using app name "Autovrse LevelUp"
    and game title "Respiratory Challenge".
  - `npm run dev:sanofi` loads, validates and renders the stub on desktop and 375 × 812 with no
    console errors.

- [ ] **P14-T09 — Tooling for both experiences**
  - `validate:content` covers both roots; `content.test.ts` validates the sanofi root.
  - `check` builds both experiences and runs budgets per build; add sanofi budget roles
    (entry only for now) to `bundle-budget.json` keyed by experience.
  - Add `playwright.sanofi.config.ts` (port 4182, `testDir: e2e/sanofi`) with a smoke spec; the
    default config ignores `e2e/sanofi/**` and builds with `--mode default` so a developer's
    `.env.local` cannot change the default suite.

- [ ] **P14-T10 — Default regression proof**
  - Run `npm run check`, the serial default Playwright suite and the sanofi smoke suite.
  - Compare against the P14-T00 baseline (counts, images, manifest, keys, budgets).

- [ ] **P14-T11 — Documentation closeout**
  - Update `README.md` (experiences and commands), `AGENTS.md` command list,
    `docs/ARCHITECTURE.md` (new "Experiences" section), `docs/CONTENT_SCHEMA.md` (relaxations),
    roadmap, handoff and activity log.

- [ ] **P14-T12 — Process and workspace cleanup**
  - Stop every dev, preview and Playwright process started by this phase; prove ports 5173, 5174,
    4173, 4174, 4181 and 4182 are free.
  - Reset browser emulation/locks, restore unintended evidence churn and leave only intended
    changes in `git status`.

## Sequencing

1. P14-T00 → P14-T01 → P14-T02 establish selection and builds.
2. P14-T03 and P14-T04 (composition and shell) can proceed together, then P14-T05.
3. P14-T06 and P14-T07 are independent of each other.
4. P14-T08 needs T03–T05; P14-T09 needs T08; P14-T10 proves regression, P14-T11 closes the
   documentation and P14-T12 cleans the environment.

The original programme breakdown combined regression proof and documentation in P14-T10.
The formal implementation plan approved on 2026-10-07 split closeout into P14-T10 through P14-T12
so regression evidence, documentation and process cleanup are independently verifiable.

## Exit criteria

- `npm run dev`, `npm run dev:default` and `npm run dev:sanofi` boot the expected experience; both
  dev servers run concurrently.
- Every "default unchanged" condition above holds, evidenced against the P14-T00 baseline.
- `npm run build:sanofi` produces `dist-sanofi/` with sanofi-only precache content, its own PWA
  manifest and no install prompt.
- No shared module imports an experience; lint enforces it.
- No application code is duplicated between `src/experiences/default` and `src/experiences/sanofi`.

## Risks

- **Home eagerness and entry size.** A runtime registry with dynamic imports would add a lazy hop
  before Home and regress Lighthouse. Mitigated by build-time alias selection.
- **Schema relaxation ripple.** Making LMS blocks optional types would force null checks across
  default code. Mitigated by `.default([])` and semantic rules.
- **Vite env precedence surprises.** Mitigated by the mode/variable mismatch error and logging the
  active experience on dev-server start.
- **Shared `public/` copy.** Each build still copies the other experience's JSON into its output.
  It is not precached or linked; an optional post-build prune can remove it later.
