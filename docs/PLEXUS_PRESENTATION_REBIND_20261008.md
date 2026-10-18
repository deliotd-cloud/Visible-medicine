# Plexus host-presentation binding repair

8 October 2026. The combined Review verifier correctly refused one stale
presentation input: `app/workspace/atlas-review/website-review.css`. Commits
f18ee8bb and 9d422859 added scoped head-MRI/navigation styles after its last
binding. All other website topology and presentation inputs still matched. The
prior checkpoint189a3f69 records that this mismatch predates its regional import.

The guarded maintenance script `scripts/rebind-plexus-review-presentation.mjs`
accepts only the exact old packet and the two audited stylesheet SHA-256s. It
validates all existing asset bytes, recomputes old fingerprints and verifies
every other website input before changing anything. It then changes only the
host stylesheet input, presentation/material revisions and the two versioned
HTML links. It refuses unknown CSS, other source drift, corrupted assets or a
repeat transition. The source importer remains authoritative for asset rebuilds.

- Original source: de82626457fb60c3b92b4e4d87a0016b6c3c09ce.
- Topology remains `6d0eb378fad8f9c522f488e7256b04002a0e62e9a2d6f124b3b669badab7f798`.
- Material becomes `5246f7f8238e99cb84225858956733d6ade0dd7e2018a1b86a100ff6eca6ed78`.
- All four non-HTML assets, 35 parts, 38 connections, checklists and geometry
  remain exact. Clinical approval, learner admission and patient registration
  remain false. No stored decision is changed, migrated or represented as current
  presentation approval. The old material query is rejected with409 after auth.

## Verification and limits

All12 focused tests pass: ten delivery/API/UI cases and two exact replay/mutation
regressions. Includes account isolation, conflict handling, stale revision refusal,
unchanged topology and byte checks. Canonical TypeScript, full combined Review
verification (both regional and plexus), and sanitized website build pass.
Twelve loopback checks verify unsigned page/asset/API withholding and a rejected
POST followed by working navigation. The144 static model duplicates are omitted
after existing exact recovery copies and delivery companions verify.

No fresh signed-in UI or clinical acceptance is claimed. Non-HTML viewer bytes
are unchanged; this does not close original schematic accuracy/source-admission
gates. No third-party assets, dependencies, fees, patient information, accepted
CT/MRI masks, desktop PACS, permissions or entitlements changed. This repair is
local only; historical port3001 remains untouched. Preview98902 serves port3000.

Recovery/evidence: `E:/VisibleMedicine-LocalStaging/20261008-plexus-presentation-rebind`.
The previous and current server-only generated asset modules are retained there,
alongside committed source snapshots and an incremental Git bundle. They remain
outside public/ and no upload occurred. Same-machine recovery is not verified
GitHub/off-device backup. Full roadmap continues with substantive source-backed
anatomy/learning and multimodal integration, independently of queued sign-off.
