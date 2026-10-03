# Phase 9 hosted-device prerequisites

Complete this page before starting either physical-device script.

## Required environment

- [ ] Record the Git commit and production build timestamp.
- [ ] Deploy the application to an HTTPS URL reachable by both devices.
- [ ] Build with `VITE_DICOM_BASE_URL` set to the HTTPS parent URL that contains
      `thoracic-ct/manifest.json`.
- [ ] Serve the DICOM origin over HTTPS without mixed-content redirects.
- [ ] Allow unauthenticated `GET`, `HEAD` and `OPTIONS` requests for the test series.
- [ ] Return `Access-Control-Allow-Origin` for the application origin, or `*` for the de-identified
      test fixture.
- [ ] Expose `Content-Length` and `Content-Type`; serve `.dcm` as `application/dicom`.
- [ ] Keep all 125 instances stable for the duration of the run.
- [ ] Do not include PHI, credentials or production learner data.

## Verification

Run these checks against the exact deployment used by the devices:

```text
npm run check
npm run dicom:verify -- https://<dicom-host>/<path>/thoracic-ct/
```

In a private browser session:

1. Open `https://<app-host>/dev/primitives`.
2. Confirm 26 showcase cards appear.
3. Confirm all four DICOM cards report a 125-slice series.
4. Open `https://<app-host>/learn/courses/runtime-showcase/lessons/primitive-showcase`.
5. Confirm the lesson reports 28 activities covering 27 primitive types and can start.
6. In browser storage tools, confirm `dicom-studies-v1` is populated only after visiting imaging.
7. Confirm the service worker controls a reload and no mixed-content or CORS error is logged.

## Tester packet

Provide each tester:

- app and DICOM URLs;
- build commit;
- `docs/qa/phase-09-device-checklist.md`;
- the Android or iOS script;
- a copy of `docs/qa/phase-09-device-results-template.md`;
- a private upload location for screenshots, recordings and logs.

The environment is ready only when every item above passes from a network other than the developer
machine's local network.
