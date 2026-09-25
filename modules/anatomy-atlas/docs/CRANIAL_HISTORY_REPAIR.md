# Cranial editorial-history repair — 25 September 2026

The failure recorded in `lamina-parent-history-diagnostic.json` predates the
lamina Pathology draft. Comparing the exact original costal-cartilage Git tree
(`841b3fdf77412943d23b8f5a38ab1e251d4657a5`) against the reconstructed snapshot
showed newer teaching retained in an older historical context. Recipes and
shoulder teaching matched; this was not missing anatomy or lost source work.

The older PICA/cranial context builder loaded only a small runtime export set
and did not compose the separately maintained later editorial branches. It now
uses the shared content-test API and composes the existing strict adapters for
organ X-ray (including its newer branches), spine ultrasound, lacrimal drainage,
forearm venous imaging and liver coverage before its previous source replay.

No production code, teaching, mesh, accepted boundary, licence, entitlement or
clinical approval changes. No original baseline or transition hash is replaced.
The earlier failure report remains intact as historical diagnostic evidence.

Verification commands:

- `node scripts/validate-cranial-boundary-clinical.mjs`
- `node scripts/test-cranial-history-context.mjs`

The first retains full original before/after snapshots, unrelated-topic checks,
identity mutations and mixed/unrecorded-state rejection. The second rejects a
live-content mutation in each newly composed branch, checks idempotence and
proves the historical operation does not mutate current teaching.
