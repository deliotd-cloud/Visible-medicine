# Slider accessibility checkpoint — 13 September 2026

The shared Base UI wrapper now places accessible names, descriptions and value
text on each focusable native range input, while retaining the group label.
Scalar/default values produce one thumb; multi-value sliders retain per-thumb
indices and optional label/value formatters. The ten current app consumers
provide percentages, directional cutaway context or one-based slice context.

Actual browser QA also reproduced hidden opacity thumbs after opening the
initially collapsed inspection panel. The wrapper now uses Base UI's standard
centre alignment, avoiding measurement-dependent hidden thumbs. This changes
endpoint alignment by half a thumb; range values, steps and callbacks are
unchanged. No dependency or installed library was edited.

## Verification

- `node scripts/validate-slider-accessibility.mjs`: 82 focused assertions using
  the actual installed Base UI/React SSR inputs, including disabled controls,
  multiple thumbs, value context and no measurement-dependent default hiding.
- TypeScript and the production build pass. All 235 shoulder review safeguards
  pass; display fingerprints advance conservatively without migrating approvals.
- Actual in-app browser at 390 × 844, `/regions/head-neck`: separation responds
  to ArrowRight (1%), End (100%), Home (0%) and PageUp (10%). Fresh-page inspection
  controls expose six named opacity sliders; Bones responds to ArrowLeft (95%),
  becomes disabled when its system is hidden and re-enables when restored.
  Coronal cutaway responds with `51% from posterior to anterior`; Reset inspection
  restores opacity to 100%. Escape returns to the compact tools launcher.
  The real 3D scene renders and document width remains 390 pixels.
- No physical touch device, screen reader, 200% text enlargement, complete exam
  journey or every regional/specimen route is certified by this bounded sample.

## Scope and next delivery

No source anatomy, teaching, private scan/mask, entitlement or clinical approval
is changed. Existing font/model licences and notices remain unchanged. See
[Base UI's Slider reference](https://base-ui.com/react/components/slider) for
individual Thumb labelling and supported alignment modes.

The website's shoulder, female-pelvis and lower-limb pilots are independently
generated artifacts. They must be regenerated from this source through their
existing export pipelines and tested before claiming this fix on those routes;
they are not hand-edited or silently updated by an Atlas source commit. The main
task checkpoint records source, GitHub, D recovery and publication separately.
