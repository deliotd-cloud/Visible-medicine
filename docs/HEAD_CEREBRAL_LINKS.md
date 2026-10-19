# Cerebral CT/MRI ↔ generic 3D comparisons

8 October 2026. Local pilot only; clinical review remains pending.

The linked-anatomy picker now has 25 concepts (previously 15). New exact-label
comparisons cover left/right frontal, parietal, temporal and occipital lobes,
and left/right hippocampus. Existing image-index links and source-bound 3D
return navigation use the same canonical concepts. No new geometry is imported.

## Binding contract

- Image manifest SHA-256 stays
  `0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.
- Each modality must match its exact saved ID, raw label, laterality and `mask`
  representation. CT IDs use `cth.ctx.{lobe}_lobe.{side}` and
  `cth.dgm.hippocampus.{side}`; MRI uses `mrb` instead of `cth`.
- Canonical concepts: `cortex-{side}-{lobe}-lobe` and
  `limbic-{side}-hippocampus`.
- Existing nested generic Atlas targets use study `2`, detail `cerebral`,
  parent `vm:anatomy:body:head-neck:midline:organ:brain`, and parent hash
  `f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335`.
- Lobe part source:
  `7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410`.
  Hippocampus part source:
  `11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e`.
  Full parent/part/side/source tuple is required for named return links;
  duplicates, stale fields or swapped part sources are rejected.

These are semantic comparisons between separate, unregistered subjects.
Saved mask and generic regional surface extents may differ. Labels and hashes
do not establish patient-space registration, complete boundaries, diagnostic
normality, functional localization, clinical approval or source-release rights.
Whole cerebellum is deliberately not linked to hemisphere-only image entries.

## Teaching and review

The original 15 notes and bindings are preserved, but the teaching packet now
adds ten sourced cerebral/hippocampal notes under a new full SHA-256
`2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a`.
See [the current teaching/review contract](HEAD_TEACHING_DRAFT.md). Older
15-concept review histories remain readable but stale, never inherited approval.
The three existing guided sequences remain unchanged. The neutral coverage
summary keeps sources and limitations available without adding toolbar clutter.

Radiologist review still needs to check each generic target against the saved
CT and MRI regional extent, side and source identity. Any new teaching/tour
packet must have its own sourced facts and exact-revision review binding. No
accepted image masks or specialist boundaries were changed in this task.

## Verification and recovery

Evidence is local under
`E:/VisibleMedicine-LocalStaging/20261008-cerebral-head-links`:
focused checks/types, metadata-only manifest audit, sanitized build, HTTP/browser
observations and scoped source-only recovery. The private image manifest was
read for exact anatomical metadata only, not copied into source evidence.
Native images/masks/surfaces must never be included in screenshots or Git.
No new asset, dependency, font or licence obligation was introduced.

During this milestone C reached zero free bytes, truncating the attempted source
edit. The file was restored from Git and checked byte-equivalent before the
patch was reapplied. Six obsolete local Miniflare trace-store files (about
6.7 GB) were copied to a separate private-local-diagnostics folder on E;
before/after/copy hashes matched before removing the C originals. D1/R2,
source, scans, masks and course data were untouched. These diagnostic files
are excluded from the source-only snapshot/bundle and must not be uploaded.
They remain recoverable on the same computer, not an off-device backup.
