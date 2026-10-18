# Cardiac venous Guided learning — local integration

8 October 2026. Learner module and protected Clinical Review both import Atlas
`994da77df921985ec83d45dff8da55c7a1332346` through their existing generators.

## What changed

- Thorax and Whole-body Guided learning include **Cardiac veins: around the heart**.
- Four stops: anterior cardiac vein source group, great cardiac vein, middle
  cardiac vein, and an overview. The first three use close local framing.
- Existing 1,800ms quintic camera transitions and reduced-motion behavior apply.
- Four affected structure worksheets include the exact draft tour and sources.
  Earlier review decisions do not approve this new source/renderer revision.
- All 136 regional model files and 12 scopes remain byte-identical. No new
  dependency, asset, scan, licence, access entitlement or patient registration.

Learner manifest SHA-256:
`b7758da6b48db13a5e8ba12b2bc3cc144a32eb310e7edd4529b88f9d5e003f91`.
Website Review integration SHA-256:
`2fad39ae2c94cf9336edd5c13e27abcb0b1cd47901fb5a97f5771fd88dc05ada`.
Review imports 1,109 source files; independent plexus handoff is unchanged.

## Verification and recovery

Evidence directory:
`E:/VisibleMedicine-LocalStaging/20261008-cardiac-venous-integration`.
Regional build/export, combined Review verification, canonical TypeScript and
local website build pass. Fourteen affected integration cases pass across initial
and focused rechecks. Initial failures are retained: one new test assumed source
array order rather than identity, and the pilot retained the old input count.
The corrected count adds exactly the tour source and its source-pin file; no
input was removed. All negative assertions remain intact.

The 46 HTTP checks verify routes, exact Review companions and denied anonymous
worksheet/model delivery. Eighteen learner companion readbacks match exactly.
Actual scan-free 1280×720 browser checks confirm readable labels and complete
selected-vein framing in the anterior, model-left and posterior stops.
This isolated reference-model fixture is not signed-in website acceptance.

Obsolete generated chunks and 144 redundant build-only model copies are removed
only with verified E recovery copies. Canonical models and specialist changes
are preserved. Source checkpoint and incremental bundle are same-machine recovery,
not GitHub or off-device backup. Nothing is publicly deployed.

## Clinical limits and next work

Draft for revision-bound radiologist review, not a complete venous drainage tree.
Surface pieces do not prove lumen continuity, drainage junctions, flow or a
patient-space match. CT/MRI anatomical comparison remains semantic, not registered.
The separate source `docs/CARDIAC_VENOUS_TOUR.md` records the institutional reference
and original-caption limits. Existing BodyParts3D attribution remains distributed.

Continue substantive regional/linked learning coverage without waiting for sign-off;
keep full clinical, licensing, privacy and authenticated-release gates intact.
