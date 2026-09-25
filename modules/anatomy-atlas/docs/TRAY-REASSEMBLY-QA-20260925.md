# Tray reassembly and compact viewer QA — 25 September

Supersedes the pending post-fix visual check in CAMERA-RESIZE-20260925.md.
Source base c6cde80 plus the caption change recorded here.

## Fix and automated evidence

Tray at 0% now states "Assembled anatomy" and explains how to arrange again.
Intermediate values explicitly warn of non-anatomical positions and possible
overlap. The 100% overview/selected-entry captions are unchanged. No geometry,
recipe, stage, selection, camera schema or teaching data changes.

Actual viewer-expression tests pass 72 cases (42 close-up + 30 tray endpoint,
intermediate, focus and visible/hidden selection cases). Camera checks pass
27 + 414 cases. Explode styles, renderer recovery, selection visibility and
body-review pass: `.local/test-logs/2026-09-25T15-01-23.737Z-39596-8837035f.log`.
TypeScript, test-script lint and shared production build pass. Existing unrelated
body-explorer lint findings are not claimed resolved. Build retains its existing
large-chunk advisory.

## Actual Chrome UI samples

After confirming the old server handle was missing and port 3191 had no listener,
restarted the local dev server (session 59053). Used a separate Chrome test tab;
unrelated user tabs were untouched. Screenshots and AX state inspected through
browser tools, not GPU mocks.

- Hand, 390 x 844: Dissect stage 2; Tray selected by keyboard; 100% catalogue
  visible; Home returns to 0% with a full visible assembled hand, not a tiny point.
  Correct new caption shown. Stage labels remained available.
- Hand, 844 x 390: resize retains visible anatomy. This low-height landscape
  layout still requires vertical scrolling; not claimed to be a no-scroll layout.
- Foot, 390 x 844: Dissect stage 4 (remove plantar layer 3); select right first
  plantar interosseous via its label; Extract selected at 100%; Home to 0%.
  Both feet remain visible; selected muscle returns; paired labels remain on
  corresponding screen sides. Controls fit the portrait viewport.
- Reset temporary viewport overrides for Chrome and the earlier in-app browser.

These are bounded interaction/visual samples, not clinical acceptance, physical
touch testing, all-region validation or an assertion that missing tissues exist.
Whole-body acceptance and generated website integration remain next. Website is
unchanged by this source checkpoint.

## Next substantive teaching batch identified (not authored here)

Read-only Terra Medium triage, no nested workers or edits: the named nested
`femoral-lateral-source` concept in `content/femoral-component-teaching.ts` has
pending Clinical/Pathology for FMA20801/FJ2158 and FMA20802/FJ2078. Recheck primary
references in `content/regional-vascular-clinical.ts` before original drafting.
Keep unnamed source-remainder topics pending; do not infer a complete branch
network, verified lumen, operative corridor or perfusion territory. Historical
pins remain immutable; the pin script's check mode does not create a content
transition. Use existing nested teaching verification and exact identity-negative
cases; require radiologist sign-off. Worker token measurements unavailable.
