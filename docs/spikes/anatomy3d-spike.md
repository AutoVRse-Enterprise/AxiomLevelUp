# Anatomy 3D feasibility spike

## Decision

**Conditional go.** A lazy Three.js viewer can render and manipulate a compact respiratory model
well within the proposed mobile and bundle limits. BodyParts3D supplies a reproducible,
openly-licensed airway and lobe grouping suitable for structure selection and an overview
fly-through.

The source geometry is not a hollow airway lumen and does not produce a credible true
bronchoscopy view from inside the mesh. The production design will therefore use:

1. the BodyParts3D-derived model for the overview, lobe selection and waypoint fly-through; and
2. a configured procedural lumen tube, generated from the same waypoint graph, for the advanced
   endoscopic entry view.

This keeps the interaction real 3D and organ-agnostic while avoiding an unsupported claim that the
source mesh contains an endoscopic surface.

## Source model

- Dataset: BodyParts3D 4.0, PART-OF 99%-reduced polygon archive.
- Source: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Current publisher licence: Creative Commons Attribution 4.0 International, updated 2025-02-27.
- Licence terms: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Required attribution: “BodyParts3D, © The Database Center for Life Science licensed under CC
  Attribution 4.0 International.”
- Note: source OBJ comments retain the legacy CC BY-SA 2.1 Japan notice; the current publisher
  licence above supersedes that text for distribution and adaptation.
- Source archive: `partof_BP3D_4.0_obj_99.zip`, 64,888,505 bytes.
- Selected structures:
  - right upper lobe (`FMA7333`);
  - right middle lobe (`FMA7383`);
  - right lower lobe (`FMA7337`);
  - left upper lobe (`FMA7370`);
  - left lower lobe (`FMA7371`);
  - trachea (`FMA7394`);
  - right main bronchus (`FMA7395`);
  - left main bronchus (`FMA7396`).

The reproducible extraction helper is
`src/spikes/anatomy3d/prepare-bodyparts.py`. It resolves the selected concepts through
`partof_element_parts.txt`, groups 283 source meshes into eight named OBJ groups and preserves the
source licence header.

## Prepared fixture

- Path: `src/spikes/anatomy3d/assets/bodyparts-respiratory.glb`
- Named meshes: 8
- Triangles: 128,350
- Uploaded vertices: 76,372
- Uncompressed GLB: 2,611,600 bytes
- Meshopt-compressed GLB: 649,292 bytes
- Compression: `EXT_meshopt_compression` plus `KHR_mesh_quantization`
- SHA-256: `79a9e6839292929b5ae15fc0b08369c10b0007ba2b84a5793de7c1462678242f`
- Materials: five translucent lobe groups and opaque trachea/main bronchi.

The fixture is below the proposed limits of 150,000 triangles and 8 MiB. The source anatomy is
intentionally grouped for the demo and is not clinically validated.

## Runtime and bundle measurements

The standalone spike in `src/spikes/anatomy3d/` imports Three.js, `GLTFLoader`, `OrbitControls` and
the meshopt decoder. Measurements were taken in Chromium against Vite 8.3.2 on 2026-10-03.

| Metric                         |   Desktop 1195×914 DPR 1 | Mobile emulation 390×844 DPR 2 |
| ------------------------------ | -----------------------: | -----------------------------: |
| First rendered model frame     | 25 ms (warm local cache) |       980 ms (cold navigation) |
| Sustained sampled rate         |                 82.6 fps |                       81.5 fps |
| Renderer geometries            |                        8 |                              8 |
| Renderer textures              |                        1 |                              1 |
| Horizontal document overflow   |                     0 px |                           0 px |
| JS heap after sustained render |              Not sampled |               12,001,780 bytes |

The production build of the standalone spike produced a 659,590-byte raw / 166,240-byte gzip
JavaScript chunk. The model is a separate 649,292-byte response. These values justify a proposed
production anatomy chunk budget of 850,000 raw / 220,000 gzip bytes, while leaving the existing
entry budget unchanged.

Chromium emulation is not physical-device evidence. Phase 9's Android/iOS gate must include the
production 3D viewer before Phase 10 is treated as device-approved.

## Interaction findings

- Orbit, zoom and pan are straightforward with `OrbitControls`.
- Mesh names survive optimisation when glTF Transform uses `--flatten false --join false
--palette false`; the default optimiser merges named structures and is unsuitable.
- Double-sided materials expose back faces but do not turn a solid bronchial mesh into a credible
  lumen.
- The five named lobe groups are selectable, but the downloaded geometry mainly represents the
  bronchial and vascular structures contained by each lobe rather than smooth outer lobe shells.
  The production viewer will add soft procedural lobe envelopes for orientation while retaining
  the source-derived meshes for landmarks.
- Authored waypoints are preferable to extracting a centreline from the mesh. The same graph can
  drive branch choices, camera movement and a procedural endoscopic tube.

## Clue-asset candidates

These sources were checked during the spike. Final selected files and hashes will be recorded in
the asset manifest during P10-T15.

- Wheeze audio: https://commons.wikimedia.org/wiki/File:Wheeze2O.ogg — James Heilman, MD,
  CC BY-SA 3.0.
- Public-domain chest-sound collection:
  https://wellcomecollection.org/works/b23g7m8a — Wellcome Collection, Public Domain Mark.
- Asthma histology:
  https://commons.wikimedia.org/wiki/File:Asthma_.jpg — Yale Rosen, CC BY-SA 2.0.
- Emphysema histology:
  https://commons.wikimedia.org/wiki/File:Histopathology_of_emphysema.jpg — Mikael Häggström,
  CC0.
- Normal-versus-asthma bronchial illustration:
  https://commons.wikimedia.org/wiki/File:2311_Lung_Tissue.jpg — OpenStax College, CC BY 3.0.

Biomarker and spirometry clues will be synthetic structured data rendered with existing table and
chart primitives.

## Production requirements carried forward

- Keep all `three` imports inside `src/anatomy3d/three`.
- Use the distinct chunk name `createAnatomyController` so the existing Cornerstone budget matcher
  does not capture it.
- Validate map mesh names against preparation metadata before playback.
- Cap device pixel ratio through `product.anatomy3d`.
- Provide a keyboard/list structure selector and reduced-motion camera cuts.
- Dispose renderer, geometries, materials and controls after the final viewer unmounts.
- Do not include the model in the offline course package for Phase 10.
