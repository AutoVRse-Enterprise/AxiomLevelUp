# Content schema v0.1

This document is generated and expanded by `npm run schema:export`. The authoritative runtime contracts live under `src/content/schema/`; generated JSON Schemas are committed under `schemas/`.

## Documents

- `manifest.json`: references the application configuration, course files and default learner seed.
- `app-config.json`: concepts, pathways, gamification settings, badges, challenges and leaderboard data.
- `courses/*.json`: course and lesson metadata with ordered primitives.
- `seeds/*.json`: initial persisted learner state.

## Primitive base

Every primitive has:

```json
{
  "id": "step_12",
  "type": "multiple_choice",
  "conceptIds": ["thoracic-imaging"],
  "content": {},
  "assets": [],
  "completion": {},
  "scoring": {},
  "feedback": {}
}
```

`reward` and `source` are optional. Assessments may add an optional timer. Phase 1 strictly validates `rich_text`, `image` and `multiple_choice`; registered future types accept structured unknown content until their implementation phase. Truly unknown types produce warnings and remain loadable.

## Versioning

The document schema starts at `0.1`. Every course includes `schemaVersion` and `courseVersion`. Persisted learner state has a separate integer `stateVersion`.
