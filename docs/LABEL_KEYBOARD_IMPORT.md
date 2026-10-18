# Anatomy label keyboard navigation

Local integration target: Atlas `8bd3b04fa3041dfe400120881a2875e9f0527f03`.
Rebuild/import all four runtime directories (regional, shoulder, independent lower
limb and female pelvis), plus matching protected Clinical Review, through the
existing generated-module pipeline. No manual edits to generated viewer code.

Arrow keys follow visible labels' actual screen positions. Home/End stay within
a side; Enter/Space select. Focus movement alone does not select structures or
scroll the document. Native Tab, modified keys and composition are preserved.
There are no additional visible controls. Screen-reader instructions and keyboard
shortcut metadata accompany the buttons.

`tests/atlas-label-keyboard.test.ts` fixes the exact implementation hashes across
all four learner modules and Review, verifies delivered bundle bytes/instructions,
and pins the changed shoulder display fingerprint without changing teaching.
Native browser/screen-reader acceptance is recorded separately from source tests.
Use the dated master-plan checkpoint for completed integration/verification state.

Model bytes, anatomical identities, imaging links, CT/MRI masks, private scans,
access policies, licensing and clinical decisions remain unchanged. No public
deployment or clinical approval follows from this import.
