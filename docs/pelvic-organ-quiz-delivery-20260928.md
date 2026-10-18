# Pelvic organ quick checks — local website delivery

Atlas `8da967df7f4f419014ea03b323d239732a787be1` is imported through generated
learner and protected Clinical Review pipelines. Eight draft placements cover
bladder, prostate, paired ureters, epididymides and seminal vesicles. Five original
questions include keyed alternatives, explanations and NIH factual references.
Existing Practice / Quiz notes is reused, without new navigation or toolbars.

All 240 website tests, TypeScript, review verification/build and production build
pass. The new test checks all eight actual review packets, exact identities,
draft answer keys and rendered explanation/reference evidence. Initial full tests
found two stale integration/Git-blob fingerprints; both were checked against the
new import and immutable source, then corrected. Historical content/model pins
remain unchanged. Verification covers 878 imported files and 31 review-viewer
files; integration SHA256 is
`81fc030beacc94ec349e6f4c9d725b1e636bb6cd54e8d84a5658dce3084578dd`.

Actual 375x812 embedded website QA: search/select prostate, Practice / Quiz notes,
correct marking and feedback focus pass; screenshot checked for readable options.
No inner/outer horizontal overflow. The authorized Clinical Review page displays
the same question, alternatives, draft answer, explanation and factual reference.
No approval or other review decision was submitted. Source QA additionally covers
incorrect/retry and reset when switching between paired organs with identical
questions. This is sampled browser acceptance, not full-device certification.

All 136 model objects / 143 delivery paths, independent-specimen pins and access
rules are preserved. No source images, scans, masks, dependencies or mandatory
fees are added. Reference geometry does not establish scan registration.
Clinical approval remains pending and revision-bound. No publication performed.

Superseded generated assets were hash-verified and backed up before replacement
under the coordination folder `work/pelvic-organ-quiz-prior-generated-20260928`.
They also remain recoverable from Git history. Generated modules were not edited
by hand. Separate fracture-workspace changes are excluded; see the coordination
checkpoint for exact GitHub and independent D-drive restore evidence.
