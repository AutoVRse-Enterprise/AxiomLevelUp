# Thoracic CT educational series

This directory describes the curated 125-slice CT series used by the production DICOM learning
primitives. The DICOM binaries under `files/` are intentionally ignored by Git and must be
published to the external asset host with `manifest.json`.

The source is the public **ACRIN 6668 Trial NSCLC-FDG-PET** collection from The Cancer Imaging
Archive:

- Study Instance UID: `1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463`
- Source Series Instance UID:
  `1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561`
- License: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- DOI: <https://doi.org/10.7937/tcia.2019.30ilqfcl>

Required attribution:

> Kinahan, P., Muzi, M., Bialecki, B., Herman, B., & Coombs, L. (2019). Data
> from the ACRIN 6668 Trial NSCLC-FDG-PET (Version 2) [Data set]. The Cancer
> Imaging Archive. https://doi.org/10.7937/tcia.2019.30ilqfcl

The source was de-identified before entering this workspace. Private tags, direct identity fields
and dates were removed. `npm run dicom:audit` must pass before preparation.

## Prepare and publish

```text
npm run dicom:prepare -- <deidentified-source> public/assets/dicom/thoracic-ct/files 125 thoracic-ct
npm run dicom:verify -- public/assets/dicom/thoracic-ct
```

Upload the complete `thoracic-ct` directory to a static HTTPS host. It must:

- preserve paths and `Content-Length`;
- serve `.dcm` files as `application/dicom` or `application/octet-stream`;
- return `Access-Control-Allow-Origin` for the application origin (or `*`);
- permit `GET`, `HEAD` and `OPTIONS`;
- support opaque-safe caching of successful responses.

Set `VITE_DICOM_BASE_URL` to the parent URL that contains `thoracic-ct/`. Local development falls
back to `/assets/dicom/`. Verify a host before deployment:

```text
npm run dicom:verify -- https://assets.example.test/dicom/thoracic-ct/
```

This dataset and its authored targets are for education only and must not be used for diagnosis.
