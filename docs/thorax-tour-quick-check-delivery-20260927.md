# Thoracic guided learning and quick-check feedback — local delivery

Atlas source: `a0b0d1b4a3d57c07c5d1f6593d7151bf3fc24f74` (thorax tour in parent
`dbbf3613f0d20ac26999ae604facfa60bb06128e`). Website baseline `3f639ae`.

- Six-stop thoracic tour in Guided learning: trachea, both main bronchi, arch
  and both pulmonary arteries. Two lung context surfaces; exact-source identity.
- Smooth 1.8-second orbital transitions, reduced-motion preference, manual
  start/readiness gating, playback controls and restoration of the prior view.
- Schema3 review packet contains the whole tour, camera settings, references,
  eight visible source structures and bundle hashes. Eight teaching contexts
  include guided-tour checks; altered/missing sequences and old-schema packets
  are rejected. No imaging or lecture entitlement is implied by tour access.
- Structure-check reset was always labelled “Try again”, including after correct
  marking. The shared component now says “Practise again” after success and
  “Try again” after an incorrect response. Grading and answer keys are unchanged.
- Regenerated shoulder and regional learners and protected review. Independent
  lower-limb/female-pelvis modules do not contain this component and are preserved.
  All 136 model files / 143 registered delivery paths remain byte-identical.

## Verification

Source component event/SSR checks cover correct, incorrect, retry, changed
choice/content, invalid keys and keyboard semantics. Source review validation
235 checks; tour review 1,104 selections, eight tour-bound, nine invalid packets
and eight missing-source cases. Website existing 105 integration checks plus
two new tour/feedback checks pass; TypeScript, review/module/site builds and
model inventory verification pass. Existing large-chunk warnings remain.

Actual local browser at 375px: shoulder scapula and regional trachea correct
and incorrect feedback; regional retry clears selection/feedback and restores
radio focus. Thorax tour starts, advances and exits with one canvas and no
horizontal overflow. Clinical Review displays six stops and source evidence
at 320px without horizontal overflow. No decisions were saved or approved.

Logs and import/backup receipts reside in the main coordination workspace under
`work/quick-check-*20260927*`. Obsolete generated hashed assets were replaced
only after verified D-drive copies; no models or user-authored assets deleted.

Local-only under Sites workflow. Not a public deployment or clinical sign-off;
real CT/MRI spatial pairing still requires cleared data and validated mapping.
