# Compact information sheets

18 September 2026. Information sheets now reduce repeated spacing before the
selected structure's notes. The full selection name, live status, review details,
actions, tabs, lesson copy and citations remain. No truncation, fixed text height
or hidden warning is used. Normal desktop rails and the systems/tools sheet are
outside the compact CSS scope; desktop Focus view can use the information sheet.

The selected-structure heading uses 1.25rem with natural wrapping. Action buttons,
More and note tabs retain at least44 CSS-pixel minimum heights. Nested note panels
use8px top padding instead of20px; body text sizes are unchanged. The sheet's
accessible description is shorter, and Return to model remains available.

## Observed candidate behaviour

Same right second common palmar digital artery (FMA85119), same default Anatomy
notes, same measured355×767 CSS viewport:

| Measurement | Before | After |
| --- | ---: | ---: |
| Selected name height | 103.47px | 50px |
| Primary note tabs top | 508.64px | 407.16px |
| Inner lesson panel top | 641.62px | 536.12px |
| Inner panel padding-top | 20px | 8px |

The lesson content starts about117.5px higher in this sample. This is not a
claim that every structure fits without scrolling. Full notes still scroll.
At measured291×582, document and dialog widths did not overflow; keyboard
ArrowRight moved tab focus and Enter selected Clinical. Expanded review details
still reported geometry/teaching unreviewed and imaging not loaded. Screenshots
were inspected inline, not saved as image files. See the coordination checkpoint
for exact build, test, recovery and publication state.

## Hand-nerve gap remains explicit

The concurrent read-only source audit found no named median, ulnar, radial or
digital nerve in the admitted BodyParts3D v4 hand catalogue. Generic source-index
nerve-trunk records do not establish a hand path. Existing SPARC source research
still has unresolved component provenance and a documented zero-length median
nerve element; it is not admitted or modified. See [source review](SPARC_NERVE_SOURCE_REVIEW.md)
and [lineage](SPARC_NERVE_LINEAGE.md). No invented nerve, source mirroring,
interpolated branch or unsupported registration was added to close the visual gap.
