# Dissection checks restored — 13 September 2026

The legacy direct-Node validation command stopped before any anatomy checks:
Node could not resolve the application's extensionless `body-source-additions`
import. This was reproduced against the saved hand-framing source.

`scripts/validate-dissection.mjs` now uses the existing confined workspace ESM
test builder to load the real TypeScript study, catalogue and dissection
helpers. It installs nothing, changes no application import or model, uses no
stub and retains the complete original assertion/report body unchanged.

Running `node scripts/validate-dissection.mjs` now passes against the actual
1,101-selection display catalogue: 11 regions plus whole-body, 159 stages,
171 focused views, 4,806 state/membership checks and 11,448 camera fits. These
exercise stage/laterality membership, peel ordering, landmarks, remove/restore/
undo, focus availability, bounded history, six camera directions, two aspect
ratios and zero/full legacy spread. They do not test every separation mechanism,
physical device, browser rendering, medical accuracy or real scan registration.

The command regenerates `content/dissection-manifest.json` and
`docs/dissection-validation.json` only after the assertions pass. These are
derived inventory/reports, not acceptance goldens or clinical sign-offs. Their
previous 1,060-selection/165-focus snapshot was stale: the newly generated
records include already-existing source additions and six existing focus
recipes. No previous stage/focus is removed and the base catalogue checksum
is unchanged. The runtime imports its existing profiles, not this report.

The hand-framing renderer fingerprint remains
`083d229c9b7bdcb11bd7a06396cfc81a4ed18f53031f46ac138b901d56f31a9c`
(472 inputs). No renderer, teaching, source hold, saved-view format, private
approval, patient data, dependency or licence changed in this test repair.
The broader Atlas development and radiologist/device/imaging acceptance gates
remain open. Other legacy test entry points are not claimed fixed by this one.
