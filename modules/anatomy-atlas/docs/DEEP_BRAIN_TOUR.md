# Deep brain: commissures and limbic landmarks

Six stops in the existing Head & neck and Whole body Guided learning library:
corpus callosum, anterior commissure, right fornix, left fornix, right amygdala
with left-side context, and the grouped mammillary bodies. Seven unchanged
BodyParts3D source selections; no additional geometry or permanent controls.

The tour uses existing smooth 1,800 ms quintic camera transitions, local frame
bounds, reduced-motion preference, explicit Start, pause-on-reading and
pause-on-load-failure. Exit restores the prior explorer state. Existing
structure-specific imaging notes and quick checks are reused, not duplicated.
Full captions, source identities, camera frames and sequence enter each member's
revision-bound Clinical Review worksheet. Only seven teaching fingerprints
change; a new renderer revision is recorded separately. No approval migration.

## Scope and limitations

This is orientation, not a fibre-flow animation or complete memory circuit.
The hippocampus is not supplied in this scene. FMA61970 remains excluded from
the tour because of its unresolved source identity. Both mammillary bodies
remain a grouped source selection. Fading does not remove tissue or establish
a dissection plane. No CT/MRI pixels, registration or clinical interpretation
are inferred from the reference model. Radiologist sign-off remains required.

## References and commercial use

Short original factual captions, checked 29 September 2026 against primary
university teaching references:

- [UTHealth: fornix, corpus callosum and anterior commissure](https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html)
- [UTHealth: amygdala and hippocampal landmarks](https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p21_index.html)
- [UTHealth: hippocampal connections](https://nba.uth.tmc.edu/neuroscience/s4/chapter05.html)

No third-party illustration, question-bank content, table or copied passage.
These links are factual references, not rights to redistribute their media.
Existing BodyParts3D CC BY 4.0 source and required credits remain unchanged.
No new software, fonts, assets, paid service or mandatory fee is introduced.

## Checks

`npm run deep-brain-tour:test` verifies exact source identities/bundle bytes,
frame bounds, missing/duplicate sources, preserved prior tour definitions,
seven changed versus 1,097 unchanged teaching fingerprints, and tampered review
packet rejection. Shared player/camera tests cover smooth movement, pause,
reduced motion and source-load recovery. Browser acceptance and website import
are separate deliverables; source tests alone do not prove them.
