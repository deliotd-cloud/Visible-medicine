# Source-bound PICA teaching — local website integration

2 October 2026. Atlas source `24d023f471d39d7d1e4660fb4f20264528bdd6fe`;
website baseline `2df4395d6df36a53da361e1ab3b6c07ddbb67e2a`. Local only.

Twenty-six existing right/left PICA source parts now have original Anatomy,
CT and MRI explanations with distinct, unscored self-checks. They use the existing
folded teaching panel, not a new persistent panel or control. These are source-file
lessons, not validated branch names, vascular territories or registered scans.
Function, Clinical, Pathology, X-ray and Ultrasound remain pending for these parts.

Bindings include the exact parent/child, side, source-file identity/hash, frame and
order. No FMA-only fallback, generated mirroring or finer clinical identity is
admitted. Twenty-six teaching packets advance; all other 82 packets and all 108
source records remain exact. Concept-scoped citation titles avoid unrelated
lesson/review revision changes. Display/geometry review expires with the renderer
revision; the existing website binder conservatively expires website-bound
shoulder teaching too, without changing its source lessons. No stored decision
or approval is read or migrated. Core teaching and imaging sign-off remain held.

The head-neck module delivers the lessons to its whole-body/regional viewer;
protected Clinical Review imports the same source. Its graph grows from 962 to
964 files, adding PICA content/bindings. Head-neck inputs grow from 935 to 937;
the other three learner input graphs remain unchanged. All four runtime manifests
are aligned to the new source revision and rebuilt through the export pipeline,
never hand-edited. All 137 model inventory records, geometry/frames, dependencies
and software/model notices remain unchanged. Original prose and citation links
only: no third-party diagram, new mesh, scan or patient image is imported.

The approved compact notice, Whole-body-first region picker and both side panels
are retained. Held optic/disc comparison revisions remain separately pinned.
Atlas/case/paid-lecture access and Didanix Education/light boundaries are unchanged.
Desktop clinical Didanix, CT-head masks and accepted segmentation boundaries are
outside this change.

## Verification and recovery

Dedicated checks cover manifest-hashed, entry-reachable learner chunks, rendered
draft bodies/citations, exact 26/82 transitions, altered identity rejection,
108 source/display revisions and 186 stale synthetic requests rejected before
storage. Historical MCA/eye milestone checks retain their immutable epochs;
the dedicated PICA checks separately verify current live source semantics.

Evidence is in the main coordination workspace's `work/pica-website-20261002-*`.
The final `-coverage.json` records full-suite coverage through the original run
and focused corrections, exact failing/passing names and log hashes. Initial
failures remain recorded, rather than being represented as a green full run.
The final `-recovery.json` is created only after type checking, protected review
binding, production build and exact import/preservation audits pass.

Prior generated artifacts are retained locally. Any incremental Git bundle needs
the baseline repository; it is not standalone, off-device, D-drive or GitHub
backup. No publication, audience change, clinical approval or signed-in desktop
visual/GPU acceptance is implied. The full Atlas goal remains active.
