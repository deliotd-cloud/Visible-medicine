# Female pelvic urinary context — 17 September 2026

The existing female-pelvis workbench now offers three additional studies in its
existing selector: **Ureters & pelvic organs** (10 selections), **Left ureter &
pelvic context**, and **Right ureter & pelvic context** (7 selections each).
The original eight recipes, initial 18-surface reproductive view and all 41
native pelvic selections are unchanged. There are 43 selectable source IDs in
this context, not 43 new structures or a complete female pelvis.

## Geometry, teaching and licensing

Only the existing `VH_F_right_ureter` and `VH_F_left_ureter` selections from the
renal study are reused. Original source SHA, version, frame and display matrix
must match. No geometry, source-local ID, orientation, donor fit or inferred
connection is created. Both canonical GLBs remain byte-identical. The existing
renal bundle is loaded intact; its other 80 selections are not exposed by this
study. Its catalogue and CC BY 4.0 notice accompany standalone exports.

All 41 pelvic lessons are preserved. The two ureter selections delegate only
after exact pelvic-context and renal-source validation to their existing renal
lessons, references and quizzes. No new medical claim, publisher image, model,
font, dependency or fee-bearing resource is added. Incomplete topics remain
pending and every lesson remains a draft for revision-bound radiologist review.

Review bindings distinguish renal and pelvic **contexts** for the same two IDs.
There are 356 scoped review records but still 267 distinct independent source
IDs. Geometry/material fingerprints differ between these contexts; accepting a
renal review cannot approve its pelvic context, or vice versa.

## Interaction correction

The regional camera now encloses the exact union of all 41 native pelvic bounds,
with a 5% margin per axis. This improves the pelvic context scale despite the
long reused ureters. All meshes remain complete, at source coordinates; upper
ureter portions can extend beyond the viewport. This is not a cut surface or
an anatomical boundary. The existing **Display options → Regional close-up**
switch restores the full visible-model view when turned off. Close-up pauses
during separation, fading and selected-structure Frame; identification practice
retains its own framing and restores the prior dissection on exit. Original
study memberships and teaching remain unchanged. Initial camera framing changes,
not the initial 18-surface selection.

Labels in a close-up use an actual source vertex within the regional bounds
when the usual anchor lies outside; they are not clamped to a point in empty
space. `npm run pelvic-closeup:test` verifies both ureter anchors against the
original display-buffer vertices, native bounds/margins, exact saved recipe and
source preservation, and rejection of changed camera contracts. It does not
approve anatomy or identify a new landmark.

Browser testing found that Undo could restore a preset and then unexpectedly
return to the initial overview. The shared study selector conditionally removed
its disabled Custom dissection option; the installed selector reconciled the
changing option registry by emitting its initial value. Keeping this option
registered stabilises the control. No history semantics or keyboard scope is
changed. Reset and the empty-state Show all action reveal the whole runtime
catalogue (43), rather than relying on the deliberately preserved 41-selection
legacy recipe. The actual browser check exercises hide → Undo → Redo → Undo in all
three new studies and hide → Undo in the original overview, at desktop/mobile
widths, alongside fade, separation reset, practice restoration and teaching tabs.

## Verification and release

`npm run pelvic-urinary-context:test` compares the eight original recipes and
first 41 surface records with saved source `0de624cafde784fdb98c66f2a1a56c69051b3b7d`.
It verifies both unchanged GLB hashes, exact reused records/lessons, references,
study links and source-bound review, and rejects tampered bundles/frames/studies.
Existing pelvic, renal teaching, selection, renderer, navigation and review
checks cover the affected contracts. Build/browser evidence and backup receipts
are recorded in the main coordination checkpoint, not inferred from this note.

The standalone exporter requires a clean committed source and byte-valid build
inputs. Its manifest enumerates the 43 exposed IDs and two reused renal IDs.
It neither activates the website module nor bypasses protected model delivery.
The website's authenticated staging/publication gate remains independent.

## Radiologist acceptance still required

- Confirm side, orientation and source-labelled ureter, bladder, cervical and
  uterine vascular relationships, including occlusion and selected framing.
- These partial surface models do not establish lumen continuity, ureteric
  insertion, patency, operative planes or a validated surgical crossing.
- The two separately audited ureteric-orifice candidates and all six earlier
  pelvic source holds remain excluded; no technical test approves them.
- Approve teaching and contextual interpretation at their exact revisions.
  No patient scan registration, cleared imaging content or clinical approval
  follows from successful software tests. Physical-device review remains open.
