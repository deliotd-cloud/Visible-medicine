# Label-safe atlas framing

## Embedded workspace height

The shared regional website module now places its region heading, source count
and expandable review disclosure inside the existing mode/action bar when it is
inside a website frame. This removes the repeated logo/title band above the
anatomy without hiding review information. Direct/full-screen module entry points
retain their own brand and heading. Frame detection is presentation only, never
authorization; no asset or case access changes.

Inspection showed the complete skeleton already occupies the camera's reserved
height. The short desktop view was constrained by stacked interface rows, not
bad geometry bounds. This layout change gives the existing camera more actual
canvas height; its fit, saved-camera scale, source meshes and label anchors are
unchanged. Browser size/interaction evidence is recorded in the dated checkpoint.

## Camera profile

13 September 2026. Regional and independent specimen scenes now reserve 70% of
the canvas width and 90% of its height for the complete geometry bounds. The
shoulder uses the same presentation profile. Previously most scenes used 70% on
both axes, with head/neck, thorax and shoulder using 86% vertically. Controls and
the orientation caption already occupy separate layout rows; additional vertical
camera whitespace unnecessarily reduced short embedded anatomy views.

This changes the initial/reset framing only through the established camera path.
No mesh, source bounds, plane, label anchor, tissue identity, study or source frame
changes. Explicit per-scene occupancy overrides remain available. The low-level
legacy 70% fit still defines stored camera scale; old bookmarks restore exactly.
Orbit, gesture zoom, button zoom, pan, dissection/explode bounds and explicit
reset/recenter keep their existing semantics. Narrow width-limited views do not
enlarge past the side-label margin merely to satisfy a vertical target.

## Evidence and limits

- `node scripts/validate-atlas-framing.mjs`: 79 whole-body/regional/specimen/study
  groups, 3,792 perspective/orthographic fits across six directions and four
  viewport ratios; all 1,531,776 tested source-box corners stay within the reserved
  axes and depth range. Source records unchanged. At the short embedded ratio,
  default anterior fit distance is about 19–20% closer than the old 70/70 fit for
  head/neck, thorax and abdomen. This is geometric evidence, not a pixel metric.
- `node scripts/validate-camera-zoom.mjs`: 398 actual FittedCamera-effect checks
  with real Three cameras, including free-orbit gestures, button composition,
  resize, pan, new presentation defaults, restore and legacy bookmark compatibility.
- `node scripts/validate-head-framing.mjs`: 290 selections, seven source groups,
  336 fits and 12 actual BodyScene forwarding cases, including explicit overrides.
- Source-bound review fingerprints are regenerated. No private review decision
  is edited or migrated; a changed renderer must not inherit approval.

Browser and hosted evidence is recorded separately in the dated main-task
framing checkpoint. Arithmetic/source tests do not establish complete GPU,
mobile-device, clinical or patient-registration acceptance. No new dependency,
model, font, texture, licence obligation, paid service or learner entitlement.
