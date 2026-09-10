# Eye imaging teaching

Open an eye's internal dissection, select a layer, then expand **Learn more → CT / MRI / Ultrasound**. Ten introductory drafts serve eight concepts across fifteen existing selections, without additional controls. Unauthored modalities remain explicitly pending; this is not a complete ophthalmic imaging atlas.

| Existing concept | Authored modality | Teaching distinction |
| --- | --- | --- |
| Cornea | Ultrasound | Pachymetry versus OCT; no validated model thickness |
| Iris | Ultrasound | UBM relationships, not pupil-only or muscle-layer assessment |
| Lens | CT | Trauma-related position assessment versus artificial separation |
| Zonule | Ultrasound | UBM support relationships versus individual fibre integrity |
| Vitreous | Ultrasound | Distinct dynamic findings; no retinal layer or moving interfaces |
| Choroid | Ultrasound, MRI | Lesion imaging versus the source coat and its two pieces |
| Sclera | CT, MRI | Actual wall findings versus colour, opacity and apparent thickness |
| Left anterior chamber | Ultrasound | Structural relationships, not pressure or flow |

The source supplies **only a left anterior chamber** and **no separate retinal mesh**. Neither is fabricated or mirrored to increase coverage. No dimensions, sensitivity thresholds, acquisition recipes, scan interpretations, tumours or new anatomical surfaces are added. The model-specific cautions are editorial statements about inspected source scope, not claims that clinical papers validate the geometry.

## Primary references consulted on 10 September 2026

- [Kim et al., corneal thickness comparison](https://pubmed.ncbi.nlm.nih.gov/18054888/): public abstract; adult normal-cornea comparison with measurements on different days. Supports instrument-specific interpretation, not a universal correction factor.
- [Pavlin et al., UBM (1992)](https://pubmed.ncbi.nlm.nih.gov/1558111/): indexed primary abstract describing anterior-segment visualisation. Direct retrieval was rate-limited; no claim of full-paper review. Used for iris, zonule and chamber relationship prompts, not pressure assessment or a scanning protocol.
- [Gad et al., anterior eye trauma CT (2017)](https://pubmed.ncbi.nlm.nih.gov/28952811/): public abstract; retrospective study of 122 patients. Supports adjunctive lens-position assessment, not exclusion of globe injury by a reassuring appearance.
- [Lahham et al., ocular POCUS (2019)](https://pubmed.ncbi.nlm.nih.gov/30977855/): public abstract and indexed caption; adult emergency-department cohort excluded trauma and suspected rupture. No image or caption reproduced. The note uses the anatomically appropriate term vitreous cavity; it does not conflate this with the posterior chamber.
- [Ferreira et al., uveal melanoma MRI (2022)](https://pubmed.ncbi.nlm.nih.gov/34718831/): public abstract; 42 lesions, with histopathology in a subset. Supports modality comparison and limitations, not individual diagnosis or generalisation to every choroidal disorder.
- [CT and MR Imaging in the Diagnosis of Scleritis (2016)](https://pubmed.ncbi.nlm.nih.gov/27444937/): indexed [primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC7963878/) Summary, case-series and Discussion text. Direct pages encountered a browser check; indexed text was used. This small retrospective series is not a universal decision rule.

Brief original factual paraphrases are accompanied by reference links. No third-party figure, article, scan, patient case, lecture or question bank is reproduced or relicensed. Access to an abstract or public paper does not confer asset reuse rights. Existing BodyParts3D and dependency obligations remain; no new dependency, model, font, texture, paid API or service is introduced.

## Implementation and preservation

`content/eye-imaging-teaching.ts` adds explicit, draft-labelled modality fields to eight existing concepts. The existing exact-source resolver and collapsed panel display them. Identity, source bindings, geometry, core Anatomy/Function/Clinical/Pathology text, quizzes, controls, clinical-review status and resource/entitlement configuration are unchanged.

The validator removes only these eight fields and reconstructs the complete v116 concept graph (SHA-256 `fe48b99e9beca00af5e9d0da1f6bb88e64e98fbce7d5114e59c0e736af2cc0c9`). It retains all earlier preservation assertions. All 63 source bindings remain byte-identical; no editorial repinning is permitted. Each new field has an explicit modality expectation, with no generic fallback masquerading as authored teaching.

At this milestone, the nested catalogue remains 63 representations / 39 concepts with 69 unique reference URLs. CT is 31 draft / 32 pending; MRI 30/33; ultrasound 26/37. Ten new paragraphs have nineteen display bindings because most concepts are bilateral. These are introductory-copy counts, not clinical completeness, scan availability or validation.

## Verification and remaining acceptance

Run `node scripts/validate-nested-teaching.mjs`, `node scripts/pin-nested-teaching.mjs --check`, `npx --no-install tsc --noEmit`, `npm run requirements:audit -- --check` and `npm run build`. Tests cover source identity and bundle rejection, references, rendered draft warnings, explicit missing-modality behaviour, detached return values, unchanged earlier content and a conservative 200-word aggregate per unique teaching reference.

Independent ophthalmology, radiology and anatomy review must assess wording, source geometry, side specificity, the distinction between research findings and routine imaging, and trauma/ultrasound cautions. Browser, touch-device, GPU and clinical acceptance are not established by static rendering or compilation; background continuation does not open or inspect the browser. No clinical approval is created.

Actual CT/MRI/X-ray/US links still require licensed approved studies, verified subject/frame/annotation manifests, reviewed correspondences and secure independent eligibility checks. Atlas subscription must never confer paid-lecture or other imaging-product access. OCT is mentioned as a comparison technique only; no OCT viewer or new modality entitlement is implied.
