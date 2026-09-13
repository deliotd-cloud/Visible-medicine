# Hand muscle imaging drafts

13 September 2026. Original CT, MRI, ultrasound and X-ray orientation fills
80 previously pending topic placements for 20 existing bilateral BodyParts3D
selections: ten muscle/head/group concepts. This is introductory imaging
teaching, not comprehensive clinical completion or new segmentation.

## Content and source boundaries

Open `/regions/hand`, select a muscle and open the existing Imaging tab.
The notes also resolve in the root-body explorer. Thenar/hypothenar layers,
metacarpal versus phalangeal targets, separate adductor heads, and the limits
of grouped lumbrical/interosseous surfaces are distinguished. No permanent
control, media, model, font, dependency or paid service is added.

All placements are draft and retain **No imaging study loaded**. Atlas colour
does not represent attenuation, MR signal or acquired ultrasound appearance.
The notes do not supply acquisition protocols, interventions or diagnoses.
Return separation to zero before comparing relationships. The recurrent
median branch, individual distal slips and all tendon boundaries are not
segmented merely because the notes describe their anatomical relationships.

The held flexor pollicis brevis sources remain held for laterality/source
review. Grouped lumbricals and interossei are not relabelled as independently
segmented numbered muscles. No missing nerve or muscle is invented. Existing
Anatomy, Function, Pathology, Clinical and Quiz notes and all four source GLBs
are unchanged. This content is not automatically copied into the website's
separate shoulder, female-pelvis or UM lower-limb specimen modules.

## Source binding and checks

Baseline: `4b3f7ace0da5e8c9d589795e446fdad62d224216`.
Pins were recorded before runtime wiring while all target sections were
pending. The resolver requires the complete saved source identity, including
names, FMA, laterality, hashes, bundle, node, bounds and anchor. A matching
name alone cannot transfer a lesson to another specimen or a patient.

- `node scripts/pin-hand-muscle-imaging.mjs --check`
- `node scripts/record-hand-muscle-imaging.mjs --check`
- `node scripts/validate-hand-muscle-imaging.mjs`

The focused validator checks 80 actual React note-callback renders, 1,200
altered-source/topic rejections, 1,101 current schema records and all 9,829
other topic placements. It also preserves shoulder teaching/recipes, verifies
the source-bundle bytes, checks fresh returned arrays and unique references,
and counts short original reference synthesis. Results are recorded in
`hand-muscle-imaging-validation.json`. Offline authoring history reverses
only the recorded additions and rejects unrecorded changes. Original golden
values and clinical approvals are not rewritten or migrated.

TypeScript, production build, prior forearm/foot/leg/thigh imaging, historical
content and review safeguards passed during implementation. The direct-Node
legacy command `node scripts/validate-dissection.mjs` could not load an
extensionless `body-source-additions` import; it is not reported as passing.
This is distinct from the actual-browser checks below. Exact final checks,
GitHub/D recovery and publication boundaries belong in the dated checkpoint.

## Browser observations and presentation

The existing hand viewer was sampled on desktop and at 390 x 844. Right APB
and the left lumbrical group displayed the new imaging sections and source
limitations. Escape from the phone-sized information sheet returned focus
to its opener. A further desktop run exercised the outer-intrinsic layer:
124 retained selections became 118 and Undo restored 124. No recipe changed.

The primary Anatomy/Clinical/Imaging tab row inherited horizontal overflow
that also created an unnecessary vertical scrollbar around its underline.
Its call-site CSS now allows visible overflow and wrapping with a small
underline allowance. Desktop and phone-sized visual checks show the extra
scrollbar removed; native tab semantics and focus rings are preserved.

The default bilateral hand framing remains too distant: the bilateral donor
spacing and long proximal vessel extents consume the fit. This is recorded
as the next presentation issue, not claimed fixed. Improve regional framing
without moving source anatomy, silently hiding tissue, breaking saved views,
or clipping separated structures. These browser samples are not physical
touch-device, screen-reader, full accessibility or clinical acceptance.

## References and rights

Factual reading checked 13 September 2026:

- [TTUHSC upper-limb anatomy](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html)
- [Picasso et al. (2023), palmar hand ultrasound](https://pmc.ncbi.nlm.nih.gov/articles/PMC10508329/)
- [RSNA/ACR CT](https://www.radiologyinfo.org/en/info/bodyct)
- [RSNA/ACR musculoskeletal MRI](https://www.radiologyinfo.org/en/info/muscmr)
- [RSNA/ACR musculoskeletal ultrasound](https://www.radiologyinfo.org/en/info/musculous)
- [RSNA/ACR bone radiography](https://www.radiologyinfo.org/en/info/bonerad)

These are reading citations, not redistribution grants. In particular,
Picasso et al. is CC BY-NC-ND 4.0: no figures, publisher prose, tables, scans
or datasets are admitted as commercial assets. Short original factual
synthesis and code retain project MIT terms; BodyParts3D CC BY 4.0 credits
remain separate. Future acquired images require their own rights and release
audit. No private data was accessed or uploaded for this milestone.

Radiologist sign-off must review the identities, attachment descriptions,
imaging visibility claims and source limitations against the actual revision.
Didanix Education/light remains the learner imaging viewer, with independent
Atlas, case and lecture entitlements. Concept links do not establish spatial
registration. Original scans/masks and specialist CT-head boundaries remain
untouched; broader anatomy, teaching and clinical/release work remains open.
