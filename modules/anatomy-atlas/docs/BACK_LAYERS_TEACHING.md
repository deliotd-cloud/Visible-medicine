# Back-layer functional and radiology teaching

12 September 2026. Open **Spine / Whole body → Back layers · separate specimen**, select a muscle and expand **Learn**. The existing Anatomy, Clinical and Imaging groups stay collapsed by default. No new permanent control, geometry, source fitting or root-body lesson is added.

All fourteen supplied muscles now have explicit attachment and motor-supply notes. Five baseline concepts are retained; six trapezius selections receive three exact-ID part qualifications and the two multifidus selections receive side-specific rotational qualifications. Whole-muscle attachments are not presented as validated footprints for each trapezius part. Source fragments are not assigned invented fascicle or motor-territory identities.

## Scope

| Draft topic | Selection placements |
| --- | ---: |
| Clinical | 14 |
| Pathology | 12 |
| MRI | 14 |
| CT | 2 |
| Ultrasound | 4 |
| X-ray | 0 |

The 46 extended placements reuse **17 topic texts across five muscle concepts**, with five original clinical self-checks displayed on the fourteen eligible selections. They are not 46 independent lessons. Minor-specific pathology, all X-ray topics, CT outside multifidus and ultrasound outside latissimus/multifidus remain pending. All 34 skeletal-context selections retain their pending teaching state. Baseline Anatomy/Function and identification practice remain available.

Clinical distinctions include an omitted posterior-axillary MRI field versus a negative examination, rhomboid major versus minor identity, muscle outline versus composition, and trapezius imaging observations versus an independently established neuropathy. The CT text explicitly distinguishes a whole-paraspinal region from isolated multifidus; it does not recommend a new CT examination for muscle assessment.

## Evidence and limits

University anatomy sources from the [specimen documentation](BACK_LAYERS_SPECIMEN.md) support attachment/action/nerve facts. The following primary reports inform original short factual synthesis, not copied teaching text or assets:

- [Pardiwala et al., latissimus avulsion case](https://pmc.ncbi.nlm.nih.gov/articles/PMC7205911/): clinical pattern and MRI/dynamic-US confirmation, not diagnostic performance or treatment guidance.
- [Posterior axillary injury case and MRI coverage](https://pmc.ncbi.nlm.nih.gov/articles/PMC4861626/): relevant field-of-view limits; its case is teres major, not a supplied latissimus patient model.
- [Furuhata et al., rhomboid major tear](https://pmc.ncbi.nlm.nih.gov/articles/PMC10729626/): insertional disruption/retraction and periscapular MRI. The case does not establish minor-specific pathology.
- [Dorsal scapular neuropathy case](https://pmc.ncbi.nlm.nih.gov/articles/PMC8008197/): a neural differential, not a proven isolated minor lesion or a procedural tutorial.
- [Li et al., accessory neuropathy](https://pubmed.ncbi.nlm.nih.gov/26787069/): 12 EMG-confirmed patients; MRI observations are not an independent diagnostic rule.
- [Ballatori et al., multifidus fat and patient factors](https://pubmed.ncbi.nlm.nih.gov/36601370/): cohort associations, not proof of the cause of pain.
- [Khil et al., asymptomatic paraspinal CT/MRI](https://link.springer.com/article/10.1186/s12891-020-03432-w): region/composition/level distinctions. Whole-paraspinal results are not relabelled as isolated multifidus.
- [Rummens et al., multifidus ultrasound/MRI](https://pmc.ncbi.nlm.nih.gov/articles/PMC10941570/): boundary, position and processing limitations, not interchangeable atlas/patient volumes.

Checked 12 September 2026. Some PMC full-page opens returned a challenge page; indexed primary article passages and available publisher/PubMed records supplied the cited facts. No challenge was bypassed, and no images, scans, publisher tables, question banks or treatment protocols were copied. Reading a source does not transfer rights to its illustrations. New authored code/text use the application licence; unchanged specimen assets retain their separate ShareAlike terms and notices. No dependencies, fonts, textures, paid APIs or mandatory services were added.

All content is draft for the owner's radiologist review. No patient scan, MR signal, CT attenuation, ultrasound motion, disease geometry, validated diagnostic threshold, registration or separately paid lecture entitlement is supplied. Source geometry and controls cannot establish muscle injury, nerve integrity, activation or a safe procedure.

## Verification

`node scripts/validate-back-layers-teaching.mjs` tests all fourteen exact source bindings, copied nested records, source/frame mutations, topic counts, three explicit trapezius part groups, sided multifidus notes and 112 real React topic renders including 38 pending states. It verifies collapsed-by-default Learn, unchanged pending bone teaching and no cross-specimen fallback. This is not browser/GPU/accessibility or clinical acceptance.

The full back-layer geometry/dissection/practice regression remains in `node scripts/validate-back-layers.mjs`; the earlier MRI-pending expectation is explicitly replaced because this milestone authors MRI drafts. No unrelated historical test is silently rebaselined. Abdominal teaching regression remains separate. Exact source meshes, source definitions, recipes, licence notices, authentication, databases and entitlements are unchanged.
