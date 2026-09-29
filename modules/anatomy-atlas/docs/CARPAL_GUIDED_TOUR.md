# Right carpal-row guided learning

An eight-stop draft under **Hand → Guided learning** and **Whole body → Guided
learning**, distinct from the existing thenar/hypothenar muscle tour. The latter
remains the Hand default. One compact selector exposes both.

All eight existing right-sided carpal source bones are reused in their original
frame: scaphoid, lunate, source-labelled triquetral (triquetrum), pisiform,
trapezium, trapezoid, capitate and hamate. These are not new anatomy or newly
validated meshes. The whole wrist group stays framed at every stop, with palmar
camera turns for the pisiform, trapezium and hamate. Other bones fade rather than
moving. Existing 1.8-second quintic-orbit transitions and reduced-motion handling
apply; reading/step selection pauses autoplay. Exit returns to the workspace.

## Source and teaching limits

Original short captions use the relevant carpal rows of
[TTUHSC El Paso upper-limb bones](https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html),
checked 29 September 2026. No table, illustration, mnemonic or prose passage is
copied. Caption/title factual text remains under 200 words for this reference.
No new model, dependency or fee is introduced; existing credits are retained.

All targets must match exact right-sided IDs and `hand-skeleton` display bundle.
The source bundle SHA256 is
`5f61ad363b757aa0cfcf0d7be4bcedcf63cbfec9ff5728cace9d62aa0447eac1`.
Radius, ulna, metacarpals and soft tissues are omitted, not fabricated. Camera
views are not radiographic projections. Source gaps cannot diagnose instability,
fracture, healing or joint-space loss. The hamate hook is not separately segmented.
Existing structure-specific imaging notes are reused; no acquired scan or patient
registration is supplied.

The complete sequence becomes revision-bound teaching evidence for all eight
targets. No approval is made or carried forward. Radiologist review must assess
anatomical relationships, source surface quality, captions and framing separately
from actual-image clearance. Clinical PACS, masks and desktop software untouched.

## Checks

`npm run carpal-tour:test` covers exact targets, preserved source bytes and prior
tours, invalid/missing source rejection, camera frames, player controls, whole-body
selection, review evidence and step selection. Current inventory is regenerated
with `npm run requirements:audit`. Actual browser evidence and saved revision are
recorded in the main coordination checkpoint; this document alone is not a pass
or a deployment claim.
