"""Create a conservative educational copy of a DICOM directory.

This script is a safeguard, not a substitute for a formal organizational
de-identification review. It strips private tags and clears common direct
identifiers before the JavaScript PHI audit and public-asset preparation steps.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pydicom


TEXT_REPLACEMENTS = {
    "PatientName": "ANONYMIZED",
    "PatientID": "ANONYMIZED",
    "InstitutionName": "",
    "InstitutionAddress": "",
    "ReferringPhysicianName": "",
    "PerformingPhysicianName": "",
    "OperatorsName": "",
    "AccessionNumber": "",
}

DATE_FIELDS = (
    "PatientBirthDate",
    "StudyDate",
    "SeriesDate",
    "AcquisitionDate",
    "ContentDate",
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    source_files = [path for path in args.source.rglob("*") if path.is_file()]
    args.destination.mkdir(parents=True, exist_ok=True)
    written = 0

    for source in source_files:
        try:
            dataset = pydicom.dcmread(source)
        except Exception:
            continue

        dataset.remove_private_tags()
        for keyword, value in TEXT_REPLACEMENTS.items():
            if keyword in dataset:
                setattr(dataset, keyword, value)
        for keyword in DATE_FIELDS:
            if keyword in dataset:
                setattr(dataset, keyword, "")

        dataset.PatientIdentityRemoved = "YES"
        dataset.DeidentificationMethod = "Axiom educational static asset preparation"
        destination = args.destination / f"{written + 1:04d}.dcm"
        dataset.save_as(destination, enforce_file_format=True)
        written += 1

    if not written:
        raise SystemExit("No DICOM files could be read.")
    print(f"Wrote {written} de-identified DICOM files to {args.destination}")


if __name__ == "__main__":
    main()
