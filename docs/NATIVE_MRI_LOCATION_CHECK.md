# Native MRI location practice

Private Regional MRI Review → select a sequence → select an accepted-scoped saved
annotation → **Try structure check** → **Find on image**. Naming remains available
when the sequence has sufficient distinct eligible choices. Location practice
does not need naming distractors, but only saved, nonempty accepted-scoped masks
are eligible. Points, curves, provisional or ambiguous targets are not substituted.

The selected mask stays bound to the native renderer, with answer tint hidden.
Click the image, or focus it and move the yellow pointer with arrow keys (Shift
moves ten pixels), then press Enter or Space. A correct pick or explicit reveal
shows the answer overlay. Outside picks can be retried; revealed is not correct.
This is formative practice against the **recorded partial mask extent**, not a
test of whole-structure anatomy, a clinical assertion or a scored examination.

## Source and display contract

- Location revision: `regional-mri-location-check-20261014-v1`.
- Exact package, loaded sequence and loaded annotation ownership are required.
  The private question key includes the current image, review and mapping pins.
- `regionalMriMaskAtFramePixel` uses the renderer's actual occupied display raster,
  including native-axis permutations, flipped/oblique grids, cropped/derived
  masks and downsampling. There is no second independent spatial transform.
- Only the exact returned frame, current plane/slice and integer display pixels
  are accepted. Copied, mixed-source, stale, altered, empty, out-of-bounds and
  unsupported frames/questions return unavailable rather than a wrong answer.
- CSS image coordinates are mapped to that display raster. Keyboard input is
  clamped and does not also trigger slice navigation. Off-annotation or undrawn
  views pause grading; native navigation and return-to-focus remain available.
- Source/mode changes retire pending clicks and feedback. Correct/revealed
  questions stay completed after navigation; stale point feedback is not shown
  on another view. Practice replaces the inventory rather than adding a panel.

The frame proof is an in-memory ownership and display-consistency guard, not a
tamper-proof examination system. No scores, histories or question keys are stored
or transmitted. No source mask, patient data, approval status, access rule,
desktop PACS, dependency or public release is changed. Existing 3D comparisons
remain independent semantic references, not patient-space registration.

## Verification and remaining acceptance

Synthetic loader/renderer tests cover raster membership, crop/derived/oblique/
permuted/downsampled views, zero-opacity masks, pointer mapping, keyboard input,
reveal, unsupported sources, stale callbacks and retirement. The bounded local
real-package probe reads the existing bound derivative without writes; it records
aggregate outcomes only, not private labels, coordinates, IDs or image bytes.

Durable verification and scoped source recovery:
`F:/VisibleMedicine/staging/20261014-native-mri-locate/` and
`F:/VisibleMedicine/recovery/checkpoints/20261014-native-mri-locate/`.
Only an actual passing terminal checkpoint proves this milestone's completed
checks; source text alone does not. Signed-in browser/keyboard/visual acceptance,
radiologist review of saved extent and teaching suitability, and learner/privacy/
release clearance remain separate. The full website/Atlas goal remains active.
