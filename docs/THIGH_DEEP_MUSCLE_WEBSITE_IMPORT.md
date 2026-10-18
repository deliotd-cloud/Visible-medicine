# Hip and thigh question delivery

Local integration, 9 October 2026. Atlas source:
`65f1a9e3e67de052a6a2faa96b606b5be251e7b7`.

The generated regional learner and protected Clinical Review are imported
together. Fifteen original normal-anatomy question groups cover 30 bilateral
hip/thigh selections. The earlier 22 thigh-muscle placements are preserved:
all 52 current root thigh-muscle representations now have draft Quiz content.
Placements are not unique questions, comprehensive anatomical coverage or
clinical approvals.

Included groups: adductor brevis, longus, magnus and minimus; superior and
inferior gemellus; gracilis; iliacus; obturator externus and internus;
pectineus; piriformis; quadratus femoris; sartorius; tensor fasciae latae.
The title is **Hip and thigh quick check · draft**. Questions remain bound to
their exact model identity, source revision and teaching packet. Changed
answers, identities or stale topics cannot silently inherit approval.

No geometry, accepted masks, dedicated shoulder module, CT/MRI viewer controls,
desktop PACS, authentication, entitlements, dependencies or licences are changed.
Facts support original wording; reference images and datasets are not imported.
Source references and scope limitations remain in the imported content.

## Verification and recovery

Evidence is retained under
`E:/VisibleMedicine-LocalStaging/20261009-thigh-deep-muscle-integration`.
The integration test checks every new selection against learner assets and
protected Review, including rejection of stale topics and tampered answers or
source identities. Existing regional teaching, head-link and guided-learning
regressions accompany source verification, type checking and an isolated build.
HTTP readbacks verify exact generated assets and signed-out access controls.
The final `saved-state.json` records results, commit and local preview handle.
The initial HTTP fixture used a nonexistent `/atlas/thigh-3d` route; it was
corrected to the existing `/atlas/3d?region=thigh` navigation target. The original
404 receipt is retained, and all 47 checks subsequently passed without a route
or application workaround. All 41 integration and 36 linking tests passed;
the combined Review verifier checked 1,178 inputs and 19 learner assets matched
the local response bytes. Type checking and the isolated website build passed.

Obsolete generated chunks are archived with verified hashes before removal.
Redundant build-only model copies are removed only after exact E recovery
verification; canonical source models are preserved. Recovery is scoped,
same-machine and source-only, not an off-device or GitHub backup.

## Remaining acceptance

Radiologist review must approve the exact question/source revisions.
Signed-in model interaction and actual GPU acceptance remain separate from
automated checks. This checkpoint does not publish the website, upload scans,
grant clinical approval or establish patient-space registration.
