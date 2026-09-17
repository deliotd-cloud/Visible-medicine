# Loading validation repair — 17 September 2026

The loading gate expected an obsolete direct `retryCount` assignment. The actual
viewer now memoizes concept-aware question counting and explicitly returns zero
when no missed IDs remain. Its correct code failed the old exact-text assertion.

The gate now locates the real TypeScript initializer and executes it in isolation
for both practice modes with empty/nonempty retry IDs. It verifies memo inputs,
the empty guard, all three counting arguments and the returned question count.
The helper stub deliberately reports two concepts for three representation IDs.
Four negative fixtures prove detection of raw-ID counting, unguarded all-pool
counting, a missing retry argument and a missing memo dependency.

Existing load failure/recovery, practice pause, retained answer, recipe/render
and immutable raw-catalog checks remain. The matrix uses that historical raw
catalog; it does not establish full current display-source coverage. Other
static wiring checks remain static, and the isolated memo harness does not
simulate React scheduling, browser fetching or GPU/context loss.

No viewer, model, package, clinical content or accepted source hash changed.
`npm run loads:test` passes; its regenerated report is
docs/anatomy-loading-validation.json. Full main-task checkpoint retains log paths
and GitHub/D-drive recovery evidence. No build or deployment is needed solely
for this test/documentation repair.
