# Embedded anatomy readability — local website delivery

Atlas source `7d584505c79d94a5b19c44fed0b75f2f7d57d424` is imported into both
learner modules and protected Clinical Review. This is a presentation correction,
not new geometry, clinical content, approval or entitlement changes.

At narrow widths, mode labels retain radio semantics and 44px targets without
decorative circles forcing a second row. Short panels preserve a useful model
area and allow one outer scroll surface when enlarged text consumes the header.
No font shrinking or control removal. Some scrolling remains intentional.

## Verification

- Both module exports checked byte-for-byte against their manifests and committed
  source. All 136 registered models / 143 paths and independent specimen pins
  remain unchanged. Superseded generated JS/CSS were backed up before replacement.
- Clinical Review verifier: 879 source files, 31 viewer files, 22 packages;
  integration hash `dfdec0feb120ef6f22e37e47a96c194b955ad37484423ce98017f9ee1795d6a8`.
  Presentation revisions refreshed; existing saved decisions are not migrated.
- Current local workspace: 248 tests pass, TypeScript passes, production build
  passes. This includes the fracture task's separate unstaged files; the Atlas
  delivery commit intentionally does not capture that task's implementation.
- Actual website at 375x812: Thorax canvas 206px (previously 134px), 212px at
  200% root font, fully scroll-reachable with no horizontal overflow. Entering
  Dissect opens its sheet; Escape restores focus to the selected mode radio.
- Shoulder learner: 200px model at normal/enlarged root font, fully reachable.
- Protected Thorax review: normal canvas 262px, enlarged 212px, fully reachable;
  mode/sheet/Escape focus behavior remains functional. No review was submitted.
- Source production-module acceptance additionally covers five scopes at three
  viewport/font settings (15 cases), plus historical handler/callback regression
  and exact-source checks. See Atlas `docs/EMBEDDED_MODEL_READABILITY.md`.

Enlarged shoulder overlay labels still wrap heavily and need separate refinement.
These checks are not native browser zoom, physical touch, screen-reader testing,
full clinical acceptance, cross-browser acceptance or public-release clearance.

Coordination evidence: `work/embedded-readability-website-tests-20260928.log`,
`work/embedded-readability-website-types-20260928.log`,
`work/embedded-readability-website-build-20260928.log`,
`work/embedded-readability-review-build-20260928.log` and the delivery checkpoint.
No Atlas publication, patient upload or clinical sign-off in this delivery.
