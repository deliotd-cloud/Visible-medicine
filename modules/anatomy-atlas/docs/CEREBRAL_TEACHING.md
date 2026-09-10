# Insular and anterior-temporal teaching extension

Inside **Brain → Dissect brain → Cerebral regions**, select an insula or anterior superior temporal part and open **Learn more**. The existing Pathology and imaging tabs contain five new shared draft paragraphs, displayed across four side-specific source selections. No new control, image or layout is introduced.

| Exact source concept | Existing FMA bindings | Added introductory teaching |
| --- | --- | --- |
| Insula | FMA72978 / FMA72977 | Ischaemic injury; CT ribbon definition; diffusion-MRI study context |
| Anterior superior temporal source part | FMA72801 / FMA72800 | Regional degeneration example; MRI atrophy-distribution comparison |

These are disease examples for anatomical learning, **not diagnoses, exclusive structure–symptom assignments or findings in the model**. A whole-insula mesh is not a vascular territory; an anterior superior temporal fragment is not the entire temporal lobe, a semantic centre or evidence of language dominance. No infarct, pathological atrophy, diffusion signal, volume measurement, treatment protocol or patient-specific registration is supplied. Ultrasound remains pending for both concepts; anterior-temporal CT remains pending.

## Evidence and rights

Checked 10 September 2026. The following primary research or official educational sources support concise original factual paraphrases:

- [Truwit et al., Radiology (1990), PMID 2389039](https://pubmed.ncbi.nlm.nih.gov/2389039/), DOI 10.1148/radiology.176.3.2389039: early insular grey–white interface change in MCA infarction and limited early CT sensitivity. The accessible indexed abstract was used; direct page retrieval returned no text. This historical imaging observation is not presented as a current treatment-selection guideline or a sensitivity estimate applicable to all patients.
- [Min et al., PLoS One (2020), PMID 32160209](https://pubmed.ncbi.nlm.nih.gov/32160209/): the accessible indexed Methods excerpt describes initial/follow-up DWI in minor stroke with proximal MCA/ICA occlusion. Only that narrow methodological point is used. Full-article details, prediction thresholds and treatment recommendations were not imported or inferred.
- [Chan et al., Annals of Neurology (2001), PMID 11310620](https://pubmed.ncbi.nlm.nih.gov/11310620/), DOI 10.1002/ana.92: the accessible abstract describes volumetric MRI group patterns. The atlas presents regional context and cohort limitations, not a diagnostic classifier or a claim that the selected fragment is the disease epicentre.
- [NIA, Frontotemporal disorders: causes, symptoms and diagnosis](https://www.nia.nih.gov/health/frontotemporal-disorders/what-are-frontotemporal-disorders-causes-symptoms-and-treatment), Primary progressive aphasia section: semantic PPA symptoms. The NIA page was read after the separate NINDS frontotemporal URL could not be retrieved; no claims depend on that unavailable page.

No figure, scan, article, table, guideline, case history, lecture or question bank is redistributed. Copyright remains with the authors/publishers; a citation or freely readable abstract is not a commercial asset licence, endorsement or clinical approval. No new font, model, texture, dataset, package or paid API is added. Existing BodyParts3D credit/licensing obligations remain. Source-word checks count shared paragraphs once per concept and combine sections using the same reference. See [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md).

## Implementation and checks

`content/cerebral-teaching.ts` supplies only these two Pathology entries and three explicit imaging entries. `content/nested-teaching.ts` connects them to existing source-pinned concepts. Anatomy, Function, Clinical, questions, limits, FMA/side/bundle identities and all geometry are unchanged. Existing pending fallbacks remain for unprovided modalities.

`npm run nested-teaching:test` covers 53 source bindings, detached teaching data, mutation rejection, exact modality scope, rendered references, collapsed panels and conservative reference word limits. A baseline captured from v108 protects every unrelated concept and the selected concepts' unchanged core. Existing cardiac/hepatic/pulmonary core checks remain. `requirements:audit` fingerprints both the new module and fully resolved text/references, not just coverage counts.

Current nested coverage: 33 concepts / 53 representations / 52 references. Introductory Pathology now has 53 draft / zero pending; CT 12 / 41, MRI 11 / 42, Ultrasound 11 / 42. Anatomy, Function and Clinical remain 53 draft / zero pending each. A nonempty draft is not complete clinical content or validated anatomy; disease breadth and modality coverage remain limited. Root-body coverage is separate.

## Remaining release requirements

1. Neuroradiologist, neurologist and educator review of terminology, evidence, relevance to the exact source selections, disease examples and learner level. No clinical approval has been recorded.
2. Independent source-surface and laterality validation, especially superior-temporal fragment identity and missing adjacent white matter/functional boundaries. No lesion-localisation or language-dominance inference from source names.
3. Real-browser, mobile, keyboard, text-enlargement and GPU acceptance of the existing viewer and teaching tabs; code/SSR checks cannot establish these.
4. Separately licensed, de-identified and clinically reviewed scans with subject-specific registration. The provisional CT/MRI head projects remain untouched, unlinked and not approved for publication by this work.
5. Atlas and separately paid lecture access remain independent; the production learning manifest still has no external resources or correspondences. GitHub/off-device recovery is a separate unresolved matter.
