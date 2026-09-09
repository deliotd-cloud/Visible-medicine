# Pelvic vessel Clinical/Pathology teaching

## Scope and status

Twenty-four introductory drafts cover the 12 represented primary-pelvis vessels / 22 official components in seven teaching groups. Clinical and Pathology each reach **880 draft / 142 pending** (138 other vessels plus four held identities). This is not an exhaustive vascular curriculum or clinical approval. Existing compact navigation, dissection, geometry, imaging hooks and other tabs are unchanged.

## Exact source binding

Every row is ISA, category vessel, system vessels, primary pelvis, ordered regions pelvis → abdomen → thigh. The official BodyParts3D ISA index was checked on 9 September 2026: source names and every component match, with none omitted for these identities. Six right and six left selections remain independent.

| Selection                   | FMA ID   | Ordered source components                      |
| --------------------------- | -------- | ---------------------------------------------- |
| Right common iliac artery   | FMA14765 | FJ3565                                         |
| Left common iliac artery    | FMA14766 | FJ3464                                         |
| Right external iliac artery | FMA18806 | FJ3567                                         |
| Left external iliac artery  | FMA18807 | FJ3466                                         |
| Right internal iliac artery | FMA18809 | FJ3569                                         |
| Left internal iliac artery  | FMA18810 | FJ3468                                         |
| Right common iliac vein     | FMA21387 | FJ3566                                         |
| Left common iliac vein      | FMA21388 | FJ3465                                         |
| Right external iliac vein   | FMA18885 | FJ3568                                         |
| Left external iliac vein    | FMA18886 | FJ3484, FJ3522, FJ3523, FJ3524                 |
| Right internal iliac vein   | FMA18887 | FJ3570, FJ3571, FJ3572, FJ3607, FJ3608, FJ3609 |
| Left internal iliac vein    | FMA18888 | FJ3469, FJ3470, FJ3471                         |

The left external vein has four components; internal veins have six on the right and three on the left. Counts are not tributary counts, thrombus segments or proof of a complete plexus. No gap is bridged. The adult-male reference does not provide female organ-specific pelvic vasculature. Shared regional navigation is not a supply/drainage territory map.

## Original teaching and sources

Brief factual synthesis, consulted 9 September 2026. These links are references, not asset licences or endorsements:

- Common iliac arteries: aneurysmal enlargement, local pressure effects and rupture context. [Cleveland Clinic: iliac artery aneurysm](https://my.clevelandclinic.org/health/diseases/iliac-artery-aneurysm).
- External iliac arteries: arterial inflow disease and clinical assessment. [NHS: PAD](https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/), [NHS: diagnosis](https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/diagnosis/), [2024 multisociety PAD guideline](https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001251). No management algorithm, urgency classification or treatment threshold reproduced.
- Internal iliac arteries and veins: more than one source of pelvic traumatic bleeding. [WSES pelvic trauma guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC5241998/). The 2017 guideline supports introductory anatomy/clinical context only; no current procedural protocol, incidence or predicted outcome is derived.
- Right common and external iliac veins: DVT and post-thrombotic context. [NHS: DVT](https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/), [NHS: PE](https://www.nhs.uk/conditions/pulmonary-embolism/), [NHLBI: VTE recovery](https://www.nhlbi.nih.gov/health/venous-thromboembolism/recovery).
- Left common iliac vein: [2024 VIVA/AVF/AVLS consensus](https://pmc.ncbi.nlm.nih.gov/articles/PMC11332375/) and [Kibbe et al., 2004 observational CT study](https://pubmed.ncbi.nlm.nih.gov/15111841/). The study is not a population risk calculator or diagnostic threshold. Its right-artery/left-vein relationship was checked independently; schematic captions are not used to relabel anatomy.
- Internal iliac veins: reflux and obstruction are distinct mechanisms discussed in the [2024 venous consensus](https://pmc.ncbi.nlm.nih.gov/articles/PMC11332375/); female-cohort context does not validate the adult-male model.

Some PMC full-page opens returned browser-check pages and an AHA page open failed; available indexed article excerpts and official provider pages supported the bounded introductory facts. No access control was bypassed. The ESVS 2024 PDF redirected to a login page: no account, payment or document download was attempted, and it is not included as an atlas asset. Public patient-page and guideline repair thresholds differ; **neither threshold is reproduced or resolved into a treatment rule here**. Routine management guidance must be independently reviewed against current specialist standards.

## Commercial rights

Only original text/code and source links were added. No publisher paragraph, table, illustration, angiogram, scan, quiz, device instructions, algorithm or clinical protocol is imported. In particular, the 2024 venous consensus carries CC BY-NC-ND: its article/media are **not** incorporated or relicensed; only independently phrased basic facts and a citation are used. Public access is not commercial reuse permission. Existing original MIT material, BodyParts3D CC BY 4.0 attribution and dependency-specific obligations remain. No added dependencies, fonts, models, textures, paid service or ongoing API charge. Hosting quotas/pricing are not guaranteed forever.

## Validation and architecture

Runtime: `lib/pelvic-vessel-clinical-curriculum.ts`, integrated into the existing body lesson selector/export. Match requires the exact FMA/side/tree/ordered-files/primary-region/ordered-regions/category tuple plus vessels system. Only Clinical/Pathology are eligible; caller arrays are detached and source warnings retained. Unknown or mutated identities fall through.

`content/pelvic-vessel-clinical-curriculum.before.json` is an immutable pre-edit capture from a605cf0785e741deeacb9cf6df376fe8a53facdf. Its paired transition pins all 24 edits. The offline historical chain now protects 3,340 topic changes without replacing the original baseline or changing production text. The abdominal validator uses its pre-pelvic milestone for historical counts/unrelated sections and current runtime for direct/export checks.

Run:

- `npm run pelvic-vessel-clinical-curriculum:test -- --source`
- `npm run abdominal-vessel-clinical-curriculum:test -- --source`
- `npm run thoracic-vessel-clinical-curriculum:test -- --source`
- `npm run content:test`
- `npm run requirements:audit -- --check`
- `npm run content:export -- --scope=shoulder --check`

The new validator checks every source component, exact side/ordering/cross-region binding, unchanged unrelated topics and recipes, direct/display/export agreement, draft state, detached arrays, four identity holds and 27 intentional negative mutations. Results: `docs/pelvic-vessel-clinical-curriculum-validation.json`. Offline/source tests do not constitute clinical, visual or mobile acceptance. Browser testing is not performed in this background pass.

## Required clinical review and remaining work

Independent vascular, pelvic anatomy/trauma and radiology reviewers must check identities, branch extent, laterality, vein-versus-artery distinction, wording, citations and appropriate urgency language. Validate the right/left iliac crossing on the source geometry before promoting spatial teaching; inspect the asymmetric venous component sets and incomplete plexuses. Do not infer organ perfusion, reflux, clot, aneurysm, lumen continuity or safe access from surface colour, proximity, cut or explode.

No medication dose, treatment threshold, catheter route, stent sizing, embolisation plan, procedural clearance or patient-specific diagnosis is supplied. No CT/MRI/US images, Doppler data or verified registration are added; existing synchronization interfaces still require licensed/de-identified imaging, coordinate metadata and independent alignment validation.

Keep FMA45097/FMA45098, FMA19728 and FMA61970 holds unchanged. Next: remaining vessel Clinical/Pathology gaps, deeper independently reviewed quizzes, editorial coverage and validated geometry/imaging improvements. The broad atlas goal remains active.
