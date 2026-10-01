# Architecture decision records

## ADR-001: Application stack

**Status:** Accepted

**Context:** The runtime is a static, installable React application with validated local content and persistent learner state.

**Decision:** Use React, strict TypeScript, Vite, React Router, Zustand, Zod 4, idb-keyval, vite-plugin-pwa/Workbox, Vitest and Testing Library. Use npm. The local Node 24 toolchain is newer than the plan's minimum and is supported by the selected packages.

**Consequences:** The deployment is static and backend-free. Package APIs are locked through the npm lockfile.

## ADR-002: Styling and accessible primitives

**Status:** Accepted

**Decision:** Use Tailwind CSS 4 with CSS-variable tokens via `@theme`, Radix Dialog for the sheet primitive, Lucide icons and locally bundled Inter Variable.

**Consequences:** Tokens remain usable in CSS and utilities; interactive foundations are accessible and work offline.

## ADR-003: Runtime content delivery

**Status:** Accepted

**Decision:** Fetch JSON documents under `public/content/`, validate them with Zod and expose an immutable indexed registry.

**Consequences:** New courses require content changes only and mirror the future Axiom contract.

## ADR-004: Learner persistence

**Status:** Accepted

**Decision:** Use Zustand persistence with a custom idb-keyval adapter, a state version and migrations. Store tiny preferences in localStorage. Derive level, rank and completion.

**Consequences:** Reloads retain meaningful state without creating duplicate sources of truth.

## ADR-005: DICOM engine

**Status:** Accepted

**Decision:** Use Cornerstone3D core, tools and DICOM image loader. Do not use OHIF, PACS or DICOMweb. Lazy-load the entire spike.

**Consequences:** The learning UI remains custom and the normal shell avoids the imaging bundle cost.

## ADR-006: DICOM assets in Git

**Status:** Accepted

**Decision:** Ignore DICOM binaries initially. Commit only preparation/audit scripts, manifest metadata and provenance.

**Consequences:** The repository remains safe and small. A verified local dataset is required to exercise the spike; Git LFS will be reconsidered in Phase 6.

## ADR-007: Primitive registry

**Status:** Accepted

**Decision:** Maintain one canonical set of primitive type IDs. Strictly type the Phase 1 primitives and allow record-shaped content for registered future types.

**Consequences:** Future content can be represented without pretending unimplemented behavior is already validated.

## ADR-008: DICOM caching and memory boundary

**Status:** Accepted

**Context:** The 125-slice spike is approximately 66 MB, while Cornerstone's default in-memory cache is too large for the mobile target and DICOM binaries should not inflate the application precache.

**Decision:** Keep DICOM files out of Workbox precache, cache successful `/assets/dicom/` responses in a dedicated CacheFirst cache capped at 180 entries for 30 days, and cap Cornerstone's in-memory cache at 256 MiB. Exclude manifest-declared PWA icons from the precache glob because vite-plugin-pwa adds those entries separately.

**Consequences:** A visited study can reload offline without delaying service-worker installation on the full dataset. Phase 7 must add explicit download, quota and eviction UX before multiple studies are supported.
