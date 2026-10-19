# Right lower-limb arterial tour — local website integration

## V2 skeletal context — 8 October 2026

The generated learner and protected Clinical Review now import Atlas
`e3d71fe4f3ce60169029fa29d0561d81335bad53`. Nine exact right-sided bones provide
faint spatial context around the unchanged nine arterial stops. Distal frames
include only nearby foot landmarks, not the whole leg. All 136 regional model
files, 12 scopes and 9,936 teaching topics remain unchanged. No new mesh,
dependency, permission, clinical approval or spatial-registration claim is added.

Fixed learner manifest: `6dd12696128781afef71c41422d47085d8ec938b8783652328c1536117690b9a`.
Source inputs: `84994eb33947c8c6ccbb44bdf643d976fb44db820b3c722ee162c0055eabe1ba`.
All 1,104 imported review sources and the separate private plexus import verify.
The integration test checks all 18 affected arterial/bone worksheets and rejects
altered captions, missing/duplicate/context changes, old V1 revision and invented
patient registration. The other 11 affected cases passed in the initial run;
the corrected arterial test passes in `arterial-retest-v2.log`. Full canonical
TypeScript passes; initial test failures are retained as evidence.

Correction to the preceding source checkpoint: the right hip bone has four
registered tours, not five; the current 18-structure maximum is four. The parser
change removes an arbitrary preliminary cap in favor of the registry size, but
was not demonstrated to fix a current five-tour hip-bone failure. Exact trusted
membership and canonical review validation remain required. This correction
supersedes that causal claim in Atlas `docs/LOWER_ARTERIAL_TOUR.md` at e3d71fe4.

Desktop visual evidence for these exact source inputs is in
`E:/VisibleMedicine-LocalStaging/20261008-arterial-context/browser-acceptance.json`:
selected artery/labels, faint bones and local foot framing at 1280x720; no
observed overflow or captured console errors. This is scan-free module evidence,
not signed-in persistence, clinical acceptance or scan registration. Faint
landmark contrast and projected overlap remain presentation-review items.

The full local build passes. Forty-five read-only HTTP page/asset/access checks
pass, including exact served Review bytes and denied anonymous model access.
The full 46-check sequence does NOT pass: anonymous POST returns 401 correctly,
then the next request gets 500 and the local Wrangler process exits. Debug logs
show `Can't read from request stream after response has been sent`, followed by
network loss. A fresh process and disabling HTTP keep-alive reproduce it.
No authentication bypass, suppressed test, dependency upgrade or production
stream workaround was applied. The read-only run is separately labelled and
does not replace this failing regression. Local preview session 68655/port3000
is restored; the next priority is bounded diagnosis/reproduction of that stream
failure. Historical3001 is unchanged. Signed-in saves remain unverified here.
Related upstream reports describe unconsumed request-body errors, but do not
prove this precise cause: https://github.com/cloudflare/workerd/issues/1730 .

Integration/build/HTTP/recovery results for V2 are recorded separately under
`E:/VisibleMedicine-LocalStaging/20261008-arterial-context-integration/`.
The V1 checkpoint below is historical and does not identify the current runtime.

## V1 integration (historical)

8 October 2026. Atlas source `aff36c610e3aba541dfdcc97b708c9d6d19a24d2` is now imported into the generated regional learner and protected Clinical Review. This supersedes the earlier source-only checkpoint.

## Access and scope

In the authorized local website, open 3D Atlas → Whole body → Guided learning → **Right lower limb: arterial orientation**. Nine stops cover external iliac, femoral, deep femoral, popliteal, anterior tibial, posterior tibial, dorsalis pedis, medial plantar and lateral plantar arteries. The corresponding Clinical Review structure worksheets bind the same tour and source identities.

All 32 prior tours, original model bytes and 12 regional scopes remain unchanged. The tour is a draft orientation sequence using assembled surfaces, adjacent-vessel context, close foot framing and the existing smooth 1,800 ms camera transition. It is not a complete arterial tree, flow simulation, lumen/patency assessment, validated spatial registration or clinical approval. Sparse isolated vessel views could benefit from separately reviewed skeletal context in a later milestone.

## Evidence

- Regional manifest SHA-256: `a378f2d9cc1cb8d141469c05df0455e9abafd820a6f02850b242d3a3e0cfebdc`; 1,071 source inputs, 204 module files and 136 unchanged regional GLBs.
- Generated Clinical Review: 1,104 imported source files verified. New test checks nine exact packets and rejects altered captions, omitted tours and invented patient registration.
- Twelve affected test cases verified across original suite and focused pilot rerun. Initial stale input-count assertion (1,069 rather than 1,071) was corrected with explicit checks for the two new source files; the original failure log is retained.
- Full canonical TypeScript and combined Clinical Review/plexus verification pass. Local website build v2 passes; v1 failed on the previous server's dist lock and remains recorded.
- 46 loopback HTTP/access checks pass, including exact served Review viewer bytes, denied anonymous review APIs and protected model access.
- Actual scan-free desktop module at 1280 × 720: all nine stops navigated; dorsal and plantar foot framing visibly rendered, Back and timed Play/Pause verified, no page overflow or captured console errors. Screenshot evidence is local. This does not establish signed-in persistence, native-image correctness, measured animation performance or clinical acceptance.

## Recovery and boundaries

`E:/VisibleMedicine-LocalStaging/20261008-lower-arterial-integration/saved-state.json` records the scoped website checkpoint and verified incremental source bundle. Thirty-two obsolete generated chunks have recoverable copies there. Build-only static model duplicates were removed only after verification against existing E recovery copies; original source models remain untouched and access restrictions remain enforced.

Local preview session 7733 serves port 3000; historical port 3001 is unchanged. No public deployment, GitHub/off-device backup, new dependency/fee, scan/mask/PACS alteration, entitlement change or approval is claimed. The full roadmap remains active; specialist work and pending shared-plan content are preserved.
