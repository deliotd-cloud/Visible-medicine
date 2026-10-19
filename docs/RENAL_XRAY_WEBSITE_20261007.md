# Renal X-ray teaching — local website integration, 7 October 2026

Atlas source `72087cc2ece8f2715e2c7a552e9aed3e856c8c9a` refines exactly
the two existing right/left root-kidney X-ray drafts, without adding images,
geometry, controls, dependencies or clinical approvals. The original reading
links and rights/clinical boundaries are documented in that source's
`docs/RENAL_XRAY_20261007.md`.

The shoulder and head-neck learner builds include this shared editorial source
and are rebuilt normally. Female-pelvis and lower-limb are re-exported with the
current source revision; their learner payloads remain unchanged. Clinical
Review is imported from the immutable source, bound and viewer-built. Only the
editorial map, renderer revision and two kidney display pins change inside its
unchanged 1,083-file source closure. Models, companions and notices retain their
existing rights and delivery restrictions. No source approval is migrated.

The focused renal website test checks both source-pinned drafts, six displayed
bullets, reading links, learner/Review source agreement, worksheet/context
fingerprints and stale/foreign refusal. All 65 selected delivery/Review checks
and fresh types pass. A local full working-tree build must pass before saving the
integration. Phase receipts and exact commit/recovery evidence are at
`E:/VisibleMedicine-LocalStaging/20261007-renal-xray/integration`.

The broader Atlas abdominal historical snapshot failure is independently
reproduced at the immutable source parent and remains an open test issue;
original assertions are not weakened. Source checks, website tests and reading
references do not replace radiologist sign-off. No patient images or CT/MRI
registration, private reviewer authentication, durable target, assistive-device
acceptance or public deployment is claimed here. Didanix Education/light stays
the integration target; the clinical desktop PACS and CT-head masks are untouched.

The local build includes preserved specialist pending work. Three disjoint
fracture-import scripts advanced during this work in the active Fracture Exams
task; both the original baseline and observed new bytes are retained separately
in `concurrent-pending-advance.json` and `concurrent-pending`. No specialist script
is overwritten or included in this Atlas commit. The fracture task subsequently
added three source/documentation paths and its shared-plan checkpoint; these are
also retained separately, bringing the excluded pending set to 53. These paths are
excluded from this checkpoint; this is not an isolated sanitized-tip build or
a publication approval. Superseded generated JavaScript/CSS chunks are retained
under the E stage's `obsolete` directory and the prior Git commit. E recovery is
same-machine, not off-device backup. Raw Atlas upload remains held; the full goal
stays active.
