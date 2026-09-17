# Vessel-visibility validation gate repair — 17 September 2026

## Scope

This is a validator-only repair. It changes no anatomy, geometry, teaching,
runtime control, dependency, entitlement or publication output. Clinical and
browser/device acceptance remain separate.

## Preserved history and current growth

The gate now reconstructs the original `f271f3f` vessel set from its immutable
full-body and source-addition Git objects: 175 arterial and 98 venous root
selections. It separately verifies that the preceding `e5521766d4035044bd2b057818d6153783a4294e`
to `f271f3f` UI-control pass changed none of its six protected lesson/source
files. Later, valid `app/body-content.ts` and `app/body-scene.tsx` evolution is
not compared with that old snapshot.

Four later source eras are admitted only when their current catalogs and final
display records exactly match the records at their admission commits:

- `489c25f`: two subscapular arteries, audit
  `a598c4e0355de55da4fbdbe73a96f75ad1c0ae8e83641b982a0dbe3613f867e8`.
- `82ffc96`: two descending circumflex-femoral branches, audit
  `2371bfb1d42d70621ad056059c70d734bba090171d104696e2af6acb05c19678`.
- `8385c16`: five cranial arteries, audit
  `6af13b26ae304a52b20915ba2990fe1497d30f089944836dce712c279272cd9a`.
- `bda1330`: fourteen elbow arteries, audit
  `161f22c01b4667002d197e244ebefdb8eb1287405e354f1eb981a2c9345bba49`.

The exact IDs are emitted in `vessel-visibility-validation.json`. Removing these
23 records from the current display must reproduce the full historical vessel
records exactly; additional or substituted vessels are rejected. The current
raw full-body catalog, vessel classifier, lockfile and original abdominal
imaging source remain byte-pinned to the accepted parent era.

## Coverage and evidence

The positive run exercises all current 198 arterial and 98 venous selections
through 36 region/side scopes and 2,127 changing plans. It retains current
reducer Undo/Redo/no-op behavior, real component rendering/callbacks and the
real parent handler/wiring. The component harness uses the installed Vinext
`next/link` shim, matching the app framework without introducing a component
double.

Five negative mutations prove rejection of unknown vessel growth, changed
admitted geometry/source identity, changed admission-catalog identity, missing
admitted records and altered control-era teaching bytes.

`npm run vessel-visibility:test` passes. Full native output is retained at
`.local/vessel-gate-repair-20260917.log`; the initially discovered missing
framework-shim harness failure and stale current-byte assertion are retained in
the two correspondingly named `.local` failure logs. No build or wider suite was
run. The generated JSON is technical regression evidence, not anatomical
completeness, browser/GPU evidence or clinical approval.
