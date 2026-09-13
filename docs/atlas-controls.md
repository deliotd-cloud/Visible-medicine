# Shared Atlas controls — 13 September 2026

The shoulder, female-pelvis and lower-limb runtime pilots are regenerated from
Atlas `cc34a98783d8f01d44951b5566f0adaf7f9db75e`. Their actual range inputs now
receive accessible names and meaningful percentage/directional values. Standard
centre-aligned thumbs avoid remaining hidden after collapsed tools open.
No new visible control or dependency is introduced.

The old exports are preserved in the main task's
`work/website-sliders-20260913/previous`. Ingestion verified every file against
the old/new manifests, identical model/catalogue bytes, unchanged bundled
dependency declarations and full licence texts. Only four superseded generated
JavaScript assets were removed from the public directories, after byte-matched
recovery copies were verified. All replacement chunks come from the existing
export pipeline, not manual editing. Current project notices are retained.

## Evidence and limits

- Website tests: 65 pass, including exact module inventory, asset hashes,
  source notices and unchanged splash rules. TypeScript and production build pass.
- Existing Atlas shoulder workspace checks: 1,296 pass (with scene doubles);
  UM knee study checks: 238 pass. These are not clinical/device certification.
- Actual browser: all three website frames render their models. The embedded
  shoulder accepts 35% separation. Its generated full-screen module supports
  keyboard End/Home (100%/0%). Female-pelvis and knee modules support their 5%
  arrow step, reset to 0%, and the pelvis reaches 100% with End. Changing the
  lower-limb region exposes the correctly renamed Hip & thigh separation slider.
- Lower-limb host at 390 × 844 has no horizontal document overflow. No physical
  touch device, screen reader, 200% text or full anatomical acceptance is claimed.
  The browser log contains an unattributed MutationObserver error; it is not
  silently reported as an error-free session. Further initial-framing and
  real-device review remains worthwhile.

The selected Glide splash is preserved, its video responds successfully locally,
and its code/asset are identical to the last hosted website source. Its intended
rule is the homepage only, once per persistent browser-storage key; direct Atlas
links and returning browsers skip it. Reduced-motion/data-saving users receive
a short static introduction. The `/splash-preview` comparison page is retained.
No splash behavior, visitor storage, account or production configuration was changed.

All anatomy remains draft pending revision-bound radiologist review. No private
scans/masks, Education case, registration, review database or paid lecture is
connected by this export. GitHub, D recovery and actual publication are recorded
separately in the main task's website-slider checkpoint.
