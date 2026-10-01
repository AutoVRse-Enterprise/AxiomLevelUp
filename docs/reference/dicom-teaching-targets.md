# DICOM teaching targets

## Status and limitation

These targets exercise the learning runtime against unambiguous normal anatomy. They were authored
from the de-identified `thoracic-ct` fixture and are **educational-only, not clinically validated
and not for diagnosis**. A medical-imaging subject-matter expert must review the anatomy labels,
slice range and tolerance before prospect-facing use.

## Series geometry

- Series: `thoracic-ct`
- Matrix: 512 × 512
- Pixel spacing: 0.976562 × 0.976562 mm
- Slice thickness: 3.75 mm
- Slice numbering: one-based
- Display coordinates: normalized from the top-left of the image

## Identify target

- Structure: tracheal air column
- Valid slice range: 78–86
- Reference slice: 81
- Reference region: circle centered at `(0.5009, 0.4668)` with normalized radius `0.035`
- Suggested window: Mediastinal (`center: 40`, `width: 400`)

The tracheal air column is centrally located, visually distinct from surrounding mediastinal soft
tissue and continuous across the selected range.

## Measurement target

- Prompt: measure the transverse inner diameter of the tracheal air column.
- Valid slice range: 78–86
- Reference slice: 81
- Reference line: `(0.484375, 0.466797)` to `(0.519531, 0.466797)`
- Geometry-derived length: 17.578 mm
- Authored expected value: 17.6 mm
- Allowed tolerance: ±10%

The reference line spans 18 image columns. At 0.976562 mm per column, its length is 17.578 mm.
The tolerance is intentionally wider than the one-pixel endpoint ambiguity and is a runtime fixture
policy, not a clinical measurement standard.

## Reproduction

Generate a windowed preview and verify normalized geometry:

```text
python scripts/dicom/preview-series.py public/assets/dicom/thoracic-ct/files .tmp/dicom-target \
  --slices 81 --window 40,400 \
  --line 81,0.484375,0.466797,0.519531,0.466797 \
  --region 81,0.5009,0.4668,0.035
```

The helper writes only to the requested output directory. `.tmp/` is recommended so generated
patient-derived pixels remain untracked.
