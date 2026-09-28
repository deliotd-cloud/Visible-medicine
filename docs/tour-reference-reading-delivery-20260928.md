# Reference-reading pause — local website delivery

Atlas `9d32da3550739fc3a7e14f3fb1cbc28c45e9d428` is imported into both learner
modules and protected Clinical Review. Opening shoulder References or regional
References & limits pauses playback/camera movement. Closing never resumes;
Play resumes explicitly. No added controls, teaching, anatomy or permissions.

241 website tests, TypeScript and production build pass. The delivery regression
pins both actual player files across learner/review, while the Atlas component
suite exercises the handlers, timers and motion state. Clinical-review verifier:
879 source files,31 viewer files,22 packages; integration fingerprint
`3bdce61094a9651964a8205820dc7e9bcad3f206e27f93067434f2eef0d61210`.
All136 registered models/143 paths and independent specimen pins unchanged.

Actual embedded 375x812 browser journeys on shoulder and thorax: Start, Play,
open references, pause, close references, retain same stop for14.5seconds,
explicit Play resume, Exit to one-canvas Explore; no horizontal overflow.
Regional references were opened after outer explanation was already open and
Play restarted. No clinical reviews submitted. Browser sample is not a physical
device/screen-reader audit. Existing build chunk-size warnings remain.

Logs: main coordination `work/tour-reference-reading-website-tests-20260928.log`,
`work/tour-reference-reading-website-build-20260928.log` and review build log.
See its checkpoint for exact website commit, GitHub readback and independent D
restore evidence. No deployment, scans or clinical approval. Separate fracture
changes remain untouched and excluded from this delivery commit.
