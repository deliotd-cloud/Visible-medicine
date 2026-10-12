# Cardiac venous Ultrasound teaching draft

Two existing Thorax and Whole body selections gain original Ultrasound orientation
notes. This is source-bound teaching for radiologist review, not an acquired
ultrasound atlas, validated physiology or procedural guide. No geometry changes.

| Selection | Exact source identity | Evidence scope |
| --- | --- | --- |
| Great cardiac vein | FMA4707, unspecified side | Targeted human transthoracic Doppler feasibility; experimental validation is separate and animal-based. |
| Middle cardiac vein | FMA4713, unspecified side | Possible adult intraoperative TEE landmark in a cardiac surgical series; no vein-specific visibility percentage. |

Both complete identities are reused from `content/cardiac-venous-tour-pins.json`.
Any changed label, side, source revision, component list, transform, geometry hash,
coverage note or validation state fails the exact binding. The middle cardiac vein
retains its 14 source components; they are not 14 named veins or a certified lumen.
All other tabs, sources, masks, models and tours remain unchanged.

## Evidence and limits

[Watanabe et al. 2002](https://pubmed.ncbi.nlm.nih.gov/11875389/), DOI
10.1067/mje.2002.119788: complete indexed abstract read through the NCBI record.
Clear great cardiac vein Doppler envelopes were reported in 21 of 23 volunteers.
Pulsed Doppler versus guide-wire validation involved open-chest dogs, not those
volunteers. The abstract supplies no human acquisition plane; the lesson therefore
does not invent a window, angle, normal velocity range or diagnostic threshold.

[Labriola et al. 2015](https://doi.org/10.1053/j.jvca.2015.01.035), PMID26009286:
full author-upload article read. Methods and Figure2A on journal page599 identify
possible middle cardiac vein visualization as a coronary sinus landmark in the
modified bicaval TEE view. Table1 on page602 describes 70 cardiac surgical patients.
Coronary sinus/catheter success rates do not measure middle cardiac vein visibility.
This supports selective adult TEE orientation, not routine TTE, healthy-population
screening, full-course depiction or catheter-placement advice.

The existing [Texas Tech thoracic veins table](https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html)
supports basic artery/vein relationships. Only original factual prose and citation
links are used. All publication images, captions, tables and waveforms remain
outside the product; a reading link is not a commercial asset licence.

## Radiologist review

Review each exact revised teaching packet in Clinical Review. Check the named
vein, adjacent artery, cohort and modality distinction, reported versus inferred
visibility, component limitations and absence of physiological or procedural
claims. Approval must bind the actual source and teaching revision; an older
packet or saved correction is not approval of these additions.

Use the normal four-module export and protected Review pipeline for integration.
No hand-edited generated copies, patient coordinates, imaging resource grants,
Education/lecture entitlement changes or desktop PACS changes are required.
