# Independent ankle imaging delivery — 27 September 2026

Regional/whole-body learner, separate lower-limb learner and protected Clinical
Review now import Atlas `80ff7f2ce56ce3cc27d4d9e6962797292585c3df`.
Six independent UM selections gain ultrasound; tibialis anterior also gains MRI.
All 136 unique models/143 delivery paths and previous teaching are retained.
No patient images, clinical decisions, dependencies or entitlements changed.
The separate lower-limb viewer also catches up previously verified source camera,
label and dissection changes. Female-pelvis and shoulder releases are unchanged.

## Verification

- 107 integration checks pass, including three lower-limb delivery/licensing
  checks and a new actual review-packet test for all21new topic placements across
  the three overlapping scopes. Exact content hashes match both learner modules
  and review. Unsupported/no-patient-imaging boundaries remain explicit.
- The first integration run exposed17stale shared nonregional-release expectations
  and one overly broad mechanical source/hash replacement affecting the unchanged
  female-pelvis test. Corrected those exact fixtures, retained original failures,
  reran the suite107/107. Runtime/source content was not changed to satisfy tests.
- Model inventory, review binding, TypeScript and website/review/standalone builds
  pass. Existing large-chunk and route-classification warnings remain.
- Actual375px standalone route: Calf → Tibialis anterior → Learn → Imaging → MRI
  and Ultrasound shows correct drafts/references. Page and iframe scrollWidth375.
- Actual regional source-bound learner link displays matching ultrasound draft.
- Actual320px protected specimen review shows both notes in Teaching to review;
  scrollWidth320. No decisions submitted.

## Binding/recovery

- Review integration `7f6948c5d90bad6534da8c3a49ba8aaf95e418f8fd1c4ae4cea527637c135bd2`.
- Review renderer `1df702086411e82f0b08198d83d056c42f9c334c9b445631e62a53040d96684f`.
- Regional manifest `63b4047a4ebbfccdd2fb114865c184b58260b8fffd9ab716f8e627365cb8254e`.
- Lower-limb manifest `447e9f0065efcd8b8d4f2f2bfe25b2bf63185655c49ae830b8217b590ffdb419`.
- Final inventory `31f75f575f81ace41fba0e5afc26d370a36de940f927840900e17d0050fa8cf3`.

Replaced learner bundles hash-copied to D in um-ankle-imaging learner/standalone
prior-generated directories; review outputs recoverable in Git. Source notices
remain bundled. Sites workflow preserves local checkout/preview; no publication
or clinical approval. Exact GitHub/D restore receipts are in the coordination
workspace. Next substantive feature is agent-authored guided tours; this import
is complete and should not be repeated.
