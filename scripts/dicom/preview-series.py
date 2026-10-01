"""Create windowed PNG previews and verify normalized teaching-target geometry."""

from __future__ import annotations

import argparse
import json
import math
import struct
import zlib
from pathlib import Path

import numpy as np
import pydicom


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, pixels: np.ndarray) -> None:
    height, width = pixels.shape
    rows = b"".join(b"\x00" + row.tobytes() for row in pixels.astype(np.uint8))
    payload = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(rows, 9))
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(payload)


def parse_numbers(value: str, expected: int) -> list[float]:
    values = [float(item.strip()) for item in value.split(",")]
    if len(values) != expected:
        raise argparse.ArgumentTypeError(f"Expected {expected} comma-separated values.")
    return values


parser = argparse.ArgumentParser()
parser.add_argument("series", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--slices", default="1,21,41,61,81,101,125")
parser.add_argument("--window", default="40,400", help="center,width")
parser.add_argument("--line", help="slice,x1,y1,x2,y2 in normalized coordinates")
parser.add_argument("--region", help="slice,x,y,radius in normalized coordinates")
args = parser.parse_args()

files = sorted(args.series.glob("*.dcm"))
if not files:
    raise SystemExit(f"No .dcm files found in {args.series}")

args.output.mkdir(parents=True, exist_ok=True)
center, width = parse_numbers(args.window, 2)
requested = [int(value) for value in args.slices.split(",")]
summary: dict[str, object] = {"sliceCount": len(files), "previews": []}

for slice_number in requested:
    if slice_number < 1 or slice_number > len(files):
        raise SystemExit(f"Slice {slice_number} is outside 1..{len(files)}.")
    dataset = pydicom.dcmread(files[slice_number - 1])
    pixels = dataset.pixel_array.astype(np.float32)
    pixels = pixels * float(dataset.get("RescaleSlope", 1)) + float(
        dataset.get("RescaleIntercept", 0)
    )
    lower, upper = center - width / 2, center + width / 2
    display = np.clip((pixels - lower) / (upper - lower), 0, 1) * 255
    destination = args.output / f"slice-{slice_number:04d}.png"
    write_png(destination, display)
    summary["previews"].append(
        {
            "slice": slice_number,
            "path": str(destination),
            "huRange": [float(pixels.min()), float(pixels.max())],
        }
    )

first = pydicom.dcmread(files[0], stop_before_pixels=True)
spacing = [float(value) for value in first.PixelSpacing]
rows, columns = int(first.Rows), int(first.Columns)
summary["geometry"] = {
    "rows": rows,
    "columns": columns,
    "pixelSpacingMm": spacing,
    "sliceThicknessMm": float(first.SliceThickness),
}

if args.line:
    slice_number, x1, y1, x2, y2 = parse_numbers(args.line, 5)
    if any(value < 0 or value > 1 for value in (x1, y1, x2, y2)):
        raise SystemExit("Line coordinates must be normalized to 0..1.")
    horizontal = (x2 - x1) * columns * spacing[1]
    vertical = (y2 - y1) * rows * spacing[0]
    summary["line"] = {
        "slice": int(slice_number),
        "start": {"x": x1, "y": y1},
        "end": {"x": x2, "y": y2},
        "lengthMm": math.hypot(horizontal, vertical),
    }

if args.region:
    slice_number, x, y, radius = parse_numbers(args.region, 4)
    if min(x, y, radius) < 0 or max(x, y, radius) > 1:
        raise SystemExit("Region coordinates must be normalized to 0..1.")
    summary["region"] = {
        "slice": int(slice_number),
        "center": {"x": x, "y": y},
        "radius": radius,
        "radiusMm": radius * min(rows * spacing[0], columns * spacing[1]),
    }

print(json.dumps(summary, indent=2))
