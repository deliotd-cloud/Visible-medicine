# Diaphragm: thorax and abdomen

Draft guided learning, 10 October 2026. Source baseline
`214cec892da967a8057ab1647003200e4f934d92`; tour revision
`diaphragm-tour-20261010-r1`.

## Learner journey

Whole body → Guided learning → **Diaphragm: thorax and abdomen**. Five stops
select the diaphragm (FMA13295), oesophagus (FMA7131), descending thoracic
aorta (FMA87217), abdominal aorta (FMA3789) and inferior vena cava (FMA10951),
in that order. The stomach (FMA7148) is context. Each explicit camera frame
retains the diaphragm and the selected surface. The existing player supplies
14-second steps, smooth transitions, fading, pause, keyboard and reduced-motion
behaviour. All surfaces stay in their source coordinates; no geometry changes.
The full aortic/caval records also extend into the pelvis, so the explicit
catalogue scope includes pelvis rather than truncating or relabelling them.

## Sources and rights

Six exact catalogue records and five existing model bundles are pinned to the
baseline catalogue and GLB bytes by `node scripts/pin-diaphragm-tour.mjs --check`.
The selected body model is a source reference, not patient anatomy. BodyParts3D
v4 CC BY 4.0 attribution and project notices remain applicable.

Factual references inspected 10 October 2026:

- [Texas Tech University Health Sciences Center anatomy case](https://anatomy.ttuhscep.edu/schemes/peritoneum_case.html), answer 4, lines 55–60: caval opening in the central tendon, oesophageal passage associated with the right crus, and aortic hiatus. The tour does not assert vertebral levels from the meshes.
- [Koo et al., British Journal of Radiology (2018)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6209484/), abstract: the diaphragm separates thoracic and abdominal cavities and has a respiratory role.

The captions are short original teaching prompts, not copied text. No figures,
tables, scans or publisher expression are included; the links are references,
not imported content. Captions total under 180 words.

## Review limits

This tour does not model diaphragmatic openings, breathing movement, lumen
continuity, patient registration or anatomical level measurements. The recovered
vessel surfaces still require visual source inspection. Source pinning and a
passing check establish file identity, not the accuracy of the spatial lesson.
Revision-bound radiologist review of the actual surfaces, framing and captions
is pending. Browser/GPU and hosted availability require separate evidence after
shared integration.
