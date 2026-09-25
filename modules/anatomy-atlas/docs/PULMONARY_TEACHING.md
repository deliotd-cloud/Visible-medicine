# Pulmonary clinical and imaging teaching

## 25 September — X-ray orientation extension

Three original X-ray drafts now serve five existing source-pinned branch groups:
right/left upper (FMA7333/FMA7370), right middle (FMA7383), and right/left lower
(FMA7337/FMA7371). They use the existing collapsed Learn more → Imaging panel;
no new controls, geometry or scan connection are introduced. The notes explain
frontal/lateral comparison, fissural relationships and the left lingula, while
distinguishing a partial branch group from a lobe outline or radiographic finding.
All other teaching, source bindings and clinical approval states are preserved.

Primary references read 25 September 2026:
[King’s College London, lungs/lobes](https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html)
and [ACR/RSNA RadiologyInfo, chest X-ray](https://www.radiologyinfo.org/en/info/chestrad).
These are factual reading links, not licensed image sources: no illustrations,
scans, tables, page text or other publisher assets were copied. The concise
original wording adds no dependency or mandatory fee. See THIRD_PARTY_NOTICES.

Revision-bound radiologist review is still required. These introductory notes do
not complete thoracic anatomy, provide a diagnostic protocol, validate source
lobe membership, or enable patient-specific synchronization. Historical sections
below describe their dated milestones, not current coverage totals.

Verification of this extension: `npm run pulmonary-xray:test` compares against
Git parent `77eaf754b12e039abc710f2fab21db28b2385f2f`: five changed placements,
688 unchanged nested topics, five real component renders, 35 source-mismatch
rejections and five mixed/tampered history rejections. The nested teaching
validator passes 9,234 checks; its historical corpus has X-ray 5 draft/66 pending.
Content contract, body-review bindings, TypeScript, targeted lint and production
build pass. This is code/render evidence, not browser/device or clinical approval.

During the X-ray milestone, the older `pulmonary-imaging:test` failed its
full-corpus historical hash check. The mismatch also reproduced at its Git parent:
actual `a68ae58c46b88d51e1b85efb8725d57fb24d95427cda6a29d1d63c590c776d33`,
expected `1daf5d8c8cefd0b8e6d910c7e1c72c91f869e018e0ac1d88f1eb6679a134e5ff`.
No old expected hash was updated. The subsequent repair replays exact Git parent
`d8967e7e033ecabc174c372738e687d05affaeef` and original child
`430c9abbf66b14d9e485acdf2502ab33e42379a7`. Original full-corpus concepts,
references, source pins and 10 changed/665 unchanged lesson assertions still run;
today's pulmonary content/source identities are checked separately. Six negative
cases reject changed lessons, references or historical corpus. The old imaging,
new X-ray and nested-teaching suites now pass; their original baseline/transition
records remain byte-identical. This is historical-test repair, not approval or a
runtime change. Publication/recovery evidence is in the main checkpoint.

## 17 September — MRI and ultrasound extension

The five existing upper/middle/lower branch groups now have MRI and Ultrasound
drafts through the same collapsed Learn more → Imaging controls. Six original
topic texts make ten source-bound placements. Existing Anatomy, Function,
Clinical, Pathology, CT, quizzes, source bindings and geometry remain unchanged.

- MRI: low conventional lung signal, tissue–air susceptibility, acquisition
  differences and respiratory motion. Branch colours are not signal or perfusion.
- Ultrasound: pleural-interface artefacts, the need for an accessible window and
  pleural contact for direct consolidation views, and basal diaphragm context.
  Branch surfaces are not sonographically visible structures through aerated lung.

References read 17 September: [Wild et al. (2012), MRI methods](https://pmc.ncbi.nlm.nih.gov/articles/PMC3481083/)
and [Demi et al. (2023), international lung ultrasound consensus](https://pmc.ncbi.nlm.nih.gov/articles/PMC10086956/).
The MRI source supports physical/acquisition principles, not a claim about
current scanner availability or a recommended clinical protocol. The ultrasound
article is CC BY-NC-ND: it is a reading reference only, not a redistributed asset.
Only original short factual synthesis and links are included; no article text,
tables, figures, scans or animations are copied. The MRI article is CC BY, but
none of its media are bundled either. No new fee, dependency or patient data.

`npm run pulmonary-imaging:test` replays the exact saved parent commit and proves
that only these six fields/two references change. The existing nested suite
retains its historical digests through an exact reversible editorial projection;
it still checks source rejection, pending fallbacks, rendered/collapsed sections
and source word budgets. Pins are checked, never regenerated for prose. Source
coverage and introductory notes remain distinct from clinical approval.

Actual current counts are in CURRENT_STATUS.md; verification, browser and backup
evidence is in the main coordination checkpoint. X-ray remains pending here.

## Original clinical/CT milestone (historical)

Select a lung in **Thorax → Explore lung branches**, choose a branch group, then expand **Learn more**. Nine original paragraphs serve three shared concepts and five exact source representations, adding Clinical context, Pathology and CT within the existing panel. No extra toolbar, scrolling region, mesh or external service is introduced. All material is an educational draft awaiting specialist review.

| Concept | Source representations | New topics |
| --- | --- | --- |
| Upper branches | FMA7333 right / FMA7370 left | Clinical evaluation vs location; TB radiographic patterns and diagnostic limits; CT orientation |
| Middle branches | FMA7383 right only | Investigation of recurrent collapse; middle lobe syndrome; CT airway/tissue distinction |
| Lower branches | FMA7337 right / FMA7371 left | Posture-dependent aspiration distribution; pneumonia vs chemical pneumonitis; CT context |

These are **partial airway/vessel groups**, not lobe parenchyma, fissures or separately delineated bronchopulmonary segments. Disease examples are neither findings in the source model nor exclusive to the selected lobe. There is no pathological geometry, scan connection, measurement, patient registration or treatment guidance. MRI and Ultrasound were pending at this original milestone; the extension above adds their introductory notes.

## Primary evidence and rights

Checked 10 September 2026; concise factual paraphrases and links only:

- [CDC clinical/laboratory TB diagnosis](https://www.cdc.gov/tb/hcp/testing-diagnosis/clinical-and-laboratory-diagnosis.html): clinical evaluation, infection-test limits, radiography and microbiology. [CDC 2005 healthcare-setting guidance](https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5417a1.htm), chest-radiography subsection, supports the historical upper-lobe pattern; it is not presented as a current treatment or infection-control protocol.
- [Freidkin et al. (2023), PubMed abstract, DOI 10.1111/1759-7714.15113](https://pubmed.ncbi.nlm.nih.gov/37704575/): a retrospective 66-person bronchoscopy series supports example causes and consequences of right middle lobe syndrome. No prevalence/risk extrapolation, procedural recommendation or copied case is included. Full-text retrieval encountered a browser challenge; the authored claims use the accessible abstract, not unseen tables or images.
- [BTS / Simpson et al. aspiration statement (2023), DOI 10.1136/thorax-2022-219699](https://www.brit-thoracic.org.uk/document-library/clinical-statements/aspiration-pneumonia/bts-clinical-statement-on-aspiration-pneumonia/), printed p. s12 (PDF page 10): posture/distribution, differential diagnosis and CT context. “Superior lower-lobe segment” is the terminology used here for the statement's “apical segment of the lower lobe”. Model-limit statements are editorial, not claims of validated segment geometry.
- [ACR/RSNA RadiologyInfo chest CT](https://www.radiologyinfo.org/en/info/chestct): multiplanar imaging and examination of lung abnormalities. Branch-to-tissue comparison is an atlas learning prompt, not a claim that this source supplies CT data or validates our model.

No source illustration, scan, guideline, table, question bank or article is redistributed. Citations are not asset licences, endorsements or clinical approval. Source word budgets cover all concepts, not just individual paragraphs. No dependency, font, model, texture or paid API is added; existing BodyParts3D CC BY 4.0 and dependency notices remain. See [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md).

## Implementation and verification

`content/pulmonary-teaching.ts` supplies Clinical, Pathology and explicit CT sections; `content/nested-teaching.ts` connects them to the existing concepts. IDs, source/FMA/side/bundle bindings, Anatomy, Function, model limits and original questions are unchanged. No imaging data or lecture entitlements are added.

`npm run nested-teaching:test` checks all 53 targets, source mutation rejection, detached results, exact per-concept modality scope, original pending fallbacks, actual rendered references, collapsed panels and source word budgets. Digests captured from v105 protect all nonpulmonary concepts and the pulmonary core; older hepatic/cardiac core protections remain. Pins are checked, not regenerated. The requirement audit fingerprints this module and the fully resolved concepts/references, including same-count prose changes.

Nested totals: 33 shared concepts / 53 representations / seven parents / 48 references. Clinical 53 draft / zero pending; Pathology 49 / four; CT ten / 43; MRI seven / 46; Ultrasound 11 / 42. Anatomy, Function and Quiz remain 53 draft / zero pending each. Coverage is not clinical completeness or accuracy.

## Remaining acceptance

1. Respiratory physician, thoracic radiologist and educator review of wording, source support, current evidence, intended learner level and differential-diagnosis caveats.
2. Independent validation of source lobe membership, laterality, branch identities, continuity and artefacts. Missing tissue, fissures, pleura and segment boundaries remain genuine anatomy gaps.
3. Explicit browser/device acceptance of the existing tabs, references, keyboard access, text enlargement and mobile scrolling. Code/SSR tests are not browser, GPU or clinical acceptance.
4. Separately licensed, de-identified and validated future scans, with subject-specific registration. The provisional head CT/MRI projects remain untouched and unlinked.
5. Atlas access and paid-lecture access remain independent; the production resource manifest still contains no external resources or correspondences.

Next: remaining nested brain pathology and useful modality-specific anatomy lessons, alongside source-backed spatial/detail work. Do not infer unavailable surfaces or patient-specific anatomy from a visual arrangement. Dated release checkpoints record saving and recovery separately.
