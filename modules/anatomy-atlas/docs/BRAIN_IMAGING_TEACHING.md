# Internal-brain CT and MRI teaching

Open **Brain → Dissect brain → Ventricular spaces / Brainstem and cerebellum**, select a structure, then expand **Learn more → CT / MRI**. Fourteen introductory drafts serve seven concepts and eight exact source selections. The left/right lateral ventricular representations share one concept; the paired brainstem and cerebellar compounds remain single selections.

## Coverage and evidence

| Existing selections | CT teaching | MRI teaching |
| --- | --- | --- |
| Lateral ventricles | Compare the image series and broader ventricular pattern, not one isolated cavity | CSF pulsation artefact on axial FLAIR |
| Third ventricle | Shape is not a flow measurement or cause of enlargement | Conventional morphology versus phase-contrast flow assessment |
| Fourth ventricle | Compare planes and the rest of the ventricular system | FLAIR artefact can mimic or obscure intraventricular findings |
| Midbrain, pons and medulla | Posterior-fossa infarction may be missed or underestimated on initial noncontrast CT | Orthogonal localisation, sequence-dependent internal detail and direct versus indirect identification |
| Cerebellum | An apparently preserved contour does not exclude infarction | Diffusion findings may extend beyond what initial CT detects |

These are introductory concepts, not complete anatomy protocols, patient interpretations, scan data, treatment recommendations or diagnostic decision rules. The static source surfaces contain no attenuation, MR signal, flow, infarct territories, individual nuclei or clinical measurements. Conventional imaging and research-sequence detail must not be conflated. No quantitative sensitivity, normal-size threshold or acquisition recipe is supplied as a universal rule.

## Primary references read on 10 September 2026

1. [ACR/RSNA, Head CT](https://www.radiologyinfo.org/en/info/headct), page reviewed 15 June 2026. The official text describes multiplanar CT, ventricular enlargement and the limitations of brain soft-tissue detail. Used for three ventricular CT notes; the atlas-specific comparison prompts are editorial guidance, not claims that this reference validates the source meshes.
2. [Hwang et al., 2012](https://pubmed.ncbi.nlm.nih.gov/22305149/), DOI 10.1016/j.jemermed.2011.05.101. Read the public abstract (and indexed figure caption, without copying it). The study compared initial noncontrast CT with subsequent MRI in 67 MRI-positive posterior-fossa infarcts and describes timing/beam-hardening limitations. Used for four CT notes and the cerebellar MRI note. Its selected cohort is not a general sensitivity benchmark; neither a normal CT nor any single MRI sequence is asserted to exclude all disease.
3. [Shepherd et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32354712/), DOI 10.3174/ajnr.A6542. Public abstract plus indexed primary-paper Results text describe a small healthy-subject 3-T FGATIR study, three-plane assessment and direct/indirect identification. Used for midbrain/pons/medulla MRI notes. A direct PMC opening encountered a browser check, so no claim of unrestricted full-text retrieval is made. The research sequence does not establish routine visibility of all nuclei or tracts.
4. [Bakshi et al., 2000](https://pubmed.ncbi.nlm.nih.gov/10730642/). Public abstract describes CSF pulsation artefact in 100 otherwise normal adult examinations using axial fast FLAIR, especially in the third/fourth ventricles. Used for lateral/fourth ventricular MRI notes. This sequence- and population-specific finding is not an instruction to dismiss real intraventricular signal as artefact.
5. [Stoquart-El Sankari et al., 2009](https://pubmed.ncbi.nlm.nih.gov/18832663/), DOI 10.3174/ajnr.A1308. Public abstract describes 17 selected patients evaluated with phase-contrast MRI for suspected aqueductal stenosis. Used for the third ventricular MRI note to distinguish morphology from flow-sensitive evidence, not to give a treatment-selection or prognostic rule.

The teaching uses brief original factual paraphrases. No figure, chapter, article, patient case, scan, dataset, lecture or question bank is reproduced or relicensed. Reference accessibility does not confer asset rights or institutional endorsement. Existing BodyParts3D credit/licence and dependency obligations remain; no new dependency, font, model, texture or paid service is added.

## Implementation and preservation

`content/brain-imaging-teaching.ts` provides explicit `ct` and `mri` draft sections on seven existing `NestedConcept` entries. The unchanged nested teaching resolver checks exact parent/child source records and bundle digests before displaying them in the existing collapsed panel. No UI or schema expansion, clinical review state, image correspondence, access-policy change or new anatomy is included.

The validator reconstructs all v115 concepts by removing only the seven newly authored imaging fields and compares the result to the pre-edit SHA-256 `7909676e839dfbc412cd742e5885df92da1539b55a41d63661de723a99a0d322`. The source-binding file remains SHA-256 `4ae3bf423a67da6eee5541579dea469297b22f04d8f2c7889ed40456a3084fb3`; no repinning is performed. The earlier preservation assertions remain in place.

Current nested copy coverage: 63 representations / 39 concepts / 63 unique reference URLs. CT has 27 draft and 36 pending representations; MRI 26/37; ultrasound 15/48. New notes are displayed 16 times because the lateral ventricular concept is bilateral, but there are only 14 authored paragraphs. Counts do not mean complete imaging anatomy or clinical approval. The new visual-pathway study's CT/MRI/US teaching remains pending.

## Verification and remaining gates

Run `node scripts/validate-nested-teaching.mjs`, `node scripts/pin-nested-teaching.mjs --check`, `npx --no-install tsc --noEmit`, `npm run requirements:audit -- --check` and `npm run build`. The teaching suite checks rendered modality sections, references, draft warnings, missing-modality fallbacks, source-binding rejection, detached results, and the complete historical content projection. Its conservative 200-word budget counts all authored material attributed to each unique source. Geometry/access suites need not be rerun for this content-only change; their inputs are preserved, not newly approved.

Independent neuroradiology, anatomy and educator review must validate relevance to each exact partial source representation, wording, artefact cautions, sequence/protocol generalisability and the differences between anatomical localisation and diagnosis. Browser/mobile and clinical acceptance are not established by these automated checks; this background continuation does not open or inspect the browser. Ultrasound requires its own appropriate age/probe/window-specific content rather than copying CT/MRI notes. Actual scan links need licensed approved studies, secure subject/frame/annotation manifests, reviewed correspondence and independent Atlas/resource eligibility. Atlas subscription never implies paid-lecture access.
