# Inferior-collicular teaching: local website integration

Atlas `c97c2b0b200ab1813a510ef65355fa2b45d05499` supplies six MRI/Clinical/Pathology
draft placements for the two existing inferior-collicular brachia. Original short
notes cite primary MRI research and case reports; no publisher media or patient
data is included. CT/X-ray/US remain pending. No new toolbar or other UI controls.

Learner and Clinical Review use the same exact imported source. All137 model
hashes/144 paths, original identities and independent Atlas/case/lecture access
are preserved. Clinical decisions remain private and revision-bound; no automatic
sign-off, acquired-image approval or patient registration is inferred.

`tests/clinical-review-collicular-teaching.test.ts` covers six new placements,
their references and limitations, pending modalities and rejected stale identity.
The existing review/access/geometry tests remain active. Final test, browser and
recovery outcomes are recorded in the main coordination checkpoint.

Separate fracture work is preserved and excluded from this integration commit.
Local-only; no publication or clinical approval.

Acceptance: all268 website tests, TypeScript and production build passed.
Actual375x812 learner showed the left MRI draft/reference and no-registration
warning; the matching worksheet showed all three new topics/references and
unavailable acquired-imaging approval. Opening the model selected FMA73464;
Back to worksheet restored the exact original source-bound URL. No horizontal
overflow in host/iframe/worksheet. No clinical decision submitted.
Browser evidence: main coordination `work/collicular-website-browser-20260929.json`.
