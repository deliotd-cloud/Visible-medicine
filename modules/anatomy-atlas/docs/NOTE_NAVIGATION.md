# Teaching-tab continuity

13 September 2026. The regional/whole-body and shoulder teaching panel now keeps
its selected group and each group's subsection in its enclosing Atlas workspace.
The desktop aside and mobile/focus sheet use different React parents; previously
their remount reset the outer tab to Anatomy and the imaging subsection to CT.

No new control or persistent preference is introduced. Each mounted workspace
starts at Anatomy / Overview, Clinical / Clinical notes and Imaging / CT. Within
that workspace, changing structures, switching groups or moving the panel does
not discard its navigation. A fresh page/workspace starts from the defaults.
This is not a saved study, imaging session, answer or cross-view registration.

During an active exam, navigation updates are rejected and the notes component
returns before invoking teaching callbacks. Existing exam selection clearing and
practice exit semantics remain unchanged. After leaving practice, selecting a
structure again can restore the prior note subsection.

## Evidence

- `node scripts/validate-note-navigation.mjs`: 422 transition/assertion checks,
  all eight actual provider/Base UI tab renders, and eight exam renders invoking
  no teaching callback. Separate workspace defaults, invalid IDs and immutable
  transitions are covered. Server rendering does not prove browser remounts.
- `node scripts/validate-shoulder-workspace.mjs`: existing 1,350 checks pass,
  including 108 markup and 288 handler cases; the 3D scene is a test double.
- Actual local head/neck browser: right-thalamus MRI stayed selected across
  desktop → 390×844 information drawer, closing/reopening the drawer, switching
  through Clinical / Pathology, returning to desktop, selecting left thalamus,
  and entering the focus-view information drawer. Active practice suppressed
  notes and disabled study controls. After exit and reselecting left thalamus,
  Clinical still restored Pathology. No answers or review records were submitted.
- TypeScript and production build pass. All 133 model-delivery checks preserve
  source bytes and decoded scene geometry; 1,504 meshes are unchanged. The
  existing large-chunk warning remains, not a new performance claim.
- Shoulder review/history safeguards pass (235 workflow checks; 47 current / 44
  historical display inputs, 16 altered-history rejections). The new navigation
  module is explicitly included in display evidence. Only the nine shoulder
  draft-export material revision fields are regenerated; no approval is migrated.

Root-body display revision is
`e49ceb220999054fb9d024002d73e14cc1b6304399c44db3cbc29bd8a6b7d4f6`
(477 source inputs). Geometry, clinical teaching, source holds, licences,
dependencies, private scans/masks, splash behaviour and independent entitlements
are unchanged. Physical touch, screen-reader and broad device acceptance remain
open. See the main coordination checkpoint for exact GitHub, recovery and hosting
state; a verified local change is not proof of deployment.
