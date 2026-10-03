#!/usr/bin/env python3
"""Build a small respiratory OBJ from the BodyParts3D 99% PART-OF archive.

This is a Phase 10 feasibility-spike helper, not a production content pipeline.
It preserves the source geometry and groups it into five lobes, the trachea and
the two main bronchi so the browser viewer can bind stable structure names.
"""

from __future__ import annotations

import argparse
import csv
import io
import zipfile
from collections import defaultdict
from pathlib import Path


GROUPS = {
    "right_upper_lobe": "FMA7333",
    "right_middle_lobe": "FMA7383",
    "right_lower_lobe": "FMA7337",
    "left_upper_lobe": "FMA7370",
    "left_lower_lobe": "FMA7371",
    "trachea": "FMA7394",
    "right_main_bronchus": "FMA7395",
    "left_main_bronchus": "FMA7396",
}

MATERIALS = {
    "right_upper_lobe": (0.86, 0.31, 0.43),
    "right_middle_lobe": (0.94, 0.48, 0.52),
    "right_lower_lobe": (0.76, 0.23, 0.38),
    "left_upper_lobe": (0.55, 0.34, 0.83),
    "left_lower_lobe": (0.38, 0.25, 0.68),
    "trachea": (0.91, 0.70, 0.23),
    "right_main_bronchus": (0.95, 0.58, 0.20),
    "left_main_bronchus": (0.95, 0.58, 0.20),
}


def parse_mapping(path: Path) -> dict[str, list[str]]:
    by_concept: dict[str, list[str]] = defaultdict(list)
    with path.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source, delimiter="\t"):
            by_concept[row["concept id"]].append(row["element file id"])
    return by_concept


def offset_index(token: str, offsets: tuple[int, int, int]) -> str:
    parts = token.split("/")
    result: list[str] = []
    for index, part in enumerate(parts):
        if not part:
            result.append("")
            continue
        value = int(part)
        if value < 0:
            raise ValueError("Negative OBJ indices are not supported by the spike helper.")
        result.append(str(value + offsets[index]))
    return "/".join(result)


def write_materials(path: Path) -> None:
    lines: list[str] = []
    for name, color in MATERIALS.items():
        lines.extend(
            [
                f"newmtl {name}",
                f"Kd {color[0]} {color[1]} {color[2]}",
                "Ka 0.08 0.08 0.08",
                "Ks 0.1 0.1 0.1",
                "Ns 24",
                "d 0.82" if "lobe" in name else "d 1.0",
                "",
            ],
        )
    path.write_text("\n".join(lines), encoding="utf-8")


def build_obj(archive: Path, mapping: Path, output: Path) -> dict[str, int]:
    by_concept = parse_mapping(mapping)
    output.parent.mkdir(parents=True, exist_ok=True)
    material_path = output.with_suffix(".mtl")
    write_materials(material_path)

    vertex_offset = 0
    texture_offset = 0
    normal_offset = 0
    counts: dict[str, int] = {}

    with zipfile.ZipFile(archive) as source_zip, output.open("w", encoding="utf-8") as target:
        target.write("# BodyParts3D respiratory subset, grouped for the Case Lab spike.\n")
        target.write("# Source: BodyParts3D 4.0, CC BY 4.0 International.\n")
        target.write("# Attribution: BodyParts3D, © The Database Center for Life Science.\n")
        target.write(f"mtllib {material_path.name}\n")

        archive_names = {Path(name).name: name for name in source_zip.namelist()}
        for group_name, concept_id in GROUPS.items():
            element_ids = sorted(set(by_concept[concept_id]))
            counts[group_name] = len(element_ids)
            target.write(f"\no {group_name}\ng {group_name}\nusemtl {group_name}\n")

            for element_id in element_ids:
                member = archive_names.get(f"{element_id}.obj")
                if member is None:
                    raise FileNotFoundError(f"{element_id}.obj is absent from {archive}")

                text = source_zip.read(member).decode("utf-8")
                records = [line.strip() for line in io.StringIO(text) if line.strip()]
                local_vertices = sum(line.startswith("v ") for line in records)
                local_textures = sum(line.startswith("vt ") for line in records)
                local_normals = sum(line.startswith("vn ") for line in records)

                for line in records:
                    if line.startswith(("v ", "vt ", "vn ")):
                        target.write(f"{line}\n")
                for line in records:
                    if not line.startswith("f "):
                        continue
                    face = " ".join(
                        offset_index(token, (vertex_offset, texture_offset, normal_offset))
                        for token in line.split()[1:]
                    )
                    target.write(f"f {face}\n")

                vertex_offset += local_vertices
                texture_offset += local_textures
                normal_offset += local_normals

    return counts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("mapping", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    counts = build_obj(args.archive, args.mapping, args.output)
    print(f"Wrote {args.output}")
    for group, count in counts.items():
        print(f"{group}: {count} source meshes")


if __name__ == "__main__":
    main()
