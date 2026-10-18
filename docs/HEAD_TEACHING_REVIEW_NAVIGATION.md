# Head teaching review navigation

Local-only UI checkpoint, 8 October 2026. The existing authorized route remains
`/workspace/atlas-review/head-learning`; its authorization, packet verification,
private correction API and account/institution scope are unchanged.

## Review flow

- Choose any available head structure and explicitly select
  **Open summary**. Selection alone does nothing.
- The matching disclosure opens, receives keyboard focus and moves into view.
  It does not change the URL, reload the page, save anything or remount notes.
- Summary disclosures retain concept heading semantics and ordered subsections.
  They can be opened or closed independently with the keyboard.
- Section links reach private notes, MRI-only evidence (when supplied), guided
  sequences and references. Revisions/checklists, guided sequences, references
  and all 25 teaching summaries start collapsed.

The picker now includes 31 choices: the original 25 teaching summaries, four
MRI-only evidence entries and two insula evidence entries. Extension entries
are supplied only after their comparison packets pass the existing authorized
server checks. A changed comparison withholds only its choices. Missing teaching
does not remove valid comparison evidence; its existing unavailable message remains.
Opening a nested entry opens its containing disclosures, without closing siblings.
MRI-only and insula entries retain independent evidence/revisions and coverage
limits. Neither navigation nor an older notes checklist approves new content.
No packet identities, teaching facts, scan/mask boundaries or 3D geometry changed.

## Safety and verification

The navigator accepts only a listed target that resolves to a `DETAILS` element
inside its current `main`. Missing, unknown, outside-main and non-disclosure
targets are inert. No URL construction, storage, fetching, postMessage or new
dependency is involved. There is no new clinical decision or publication action.

Focused regression tests cover source gating, source identity independence,
safe navigation, preserved private notes, anchors and collapsed rendering.
Canonical fresh TypeScript and a sanitized build are required before saving.
Unauthenticated HTTP checks must continue withholding private review content.
Browser QA uses an explicitly labelled scan-free synthetic fixture of the actual
components, with a separate inert textarea instead of the account-bound notes
component. This verifies layout/focus/navigation, not signed-in persistence,
native image packages, clinical approval or patient-space registration.

No new models, images, fonts, textures, reference assets, dependencies or fees.
Latest recovery/evidence: `E:/VisibleMedicine-LocalStaging/20261008-head-review-all-targets`.
Same-machine source-only recovery is not GitHub or off-device backup.
