# DICOM spike dataset

The local development stack is a 125-slice subset of a CT series from the public
**ACRIN-NSCLC-FDG-PET** collection distributed by The Cancer Imaging Archive
through NCI Imaging Data Commons.

- Study Instance UID: `1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463`
- Source Series Instance UID: `1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561`
- Collection license: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- Collection page: <https://www.cancerimagingarchive.net/collection/acrin-nsclc-fdg-pet/>
- Data DOI: <https://doi.org/10.7937/tcia.2019.30ilqfcl>

Required attribution:

> Kinahan, P., Muzi, M., Bialecki, B., Herman, B., & Coombs, L. (2019). Data
> from the ACRIN 6668 Trial NSCLC-FDG-PET (Version 2) [Data set]. The Cancer
> Imaging Archive. https://doi.org/10.7937/tcia.2019.30ilqfcl

## Preparation

The source was downloaded by Series Instance UID with `idc-index`. A local
`pydicom` pass removed private tags, replaced direct identity fields and cleared
date fields. `npm run dicom:audit` then confirmed that the configured direct
identifier fields were empty or anonymized. `npm run dicom:prepare` sorted the
instances and copied the central 125 slices.

The DICOM binaries under `files/` are intentionally ignored by Git. To reproduce:

```text
python -m venv .tmp/idc-venv
.tmp/idc-venv/Scripts/python -m pip install idc-index -r scripts/dicom/requirements.txt
.tmp/idc-venv/Scripts/idc download <series-uid> --download-dir .tmp/idc-source
.tmp/idc-venv/Scripts/python scripts/dicom/deidentify-series.py <source> .tmp/dicom-deidentified
npm run dicom:audit -- .tmp/dicom-deidentified
npm run dicom:prepare -- .tmp/dicom-deidentified public/assets/dicom/spike/files 125
```

This remains a technical demo asset and must not be used for diagnosis.
