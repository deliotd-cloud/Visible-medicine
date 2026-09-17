# Remaining major-organ Function teaching — 17 September 2026

This is a verified next-work plan, not implemented teaching or clinical approval.
Main task ran the actual display-catalog/lesson dispatcher at Atlas source
55086d1e206385b75febbed6c7f7b9634d652a60. Of 83 organ-system selections,
13 still reach the generic single-sentence `Function` fallback with no specific
reference links. All 83 currently have `draft` readiness: that label alone does
not measure depth, completeness, reviewed accuracy or source-bound provenance.
The other 70 are not certified comprehensive by this audit.

## Exact pending placements

| Selection | FMA | Display source components | Important existing context |
| --- | --- | ---: | --- |
| Pancreas | 7198 | 3 | Corrected envelope plus two duct components; omitted near-coincident parenchymal alternative remains archived |
| Stomach | 7148 | 1 | Root surface, not functional wall layers |
| Small intestine | 7200 | 55 | Ileocecal junction is separately selectable and excluded from this aggregate |
| Large intestine | 7201 | 6 | Rectum and ileocecal junction are excluded from this aggregate |
| Gallbladder | 7202 | 1 | Anatomical region is abdomen despite its legacy pelvis-organs bundle name |
| Right / left kidney | 7204 / 7205 | 1 each | Root surfaces; separately bound renal vascular detail and independent HRA specimen already exist |
| Urinary bladder | 15900 | 1 | Pelvic root; not an animated emptying or capacity model |
| Esophagus | 7131 | 1 | Thoracic navigation grouping, not a claim that its full course is exclusively thoracic |
| Trachea | 7394 | 1 | Existing airway/lung context; no simulated ventilation |
| Spleen | 7196 | 1 | Root surface, not separately segmented pulp |
| Right / left adrenal | 15629 / 15630 | 1 each | Roots, not independently separated cortical zones and medulla |

The complete runtime audit, including exact IDs, side/region/bundle, source
counts, coverage notes and current Function payloads, is retained in the main
task as work/organ-function-gap-audit-20260917.json. Reproduce with
work/audit-organ-function-gaps-20260917.mjs from the Atlas checkout. These are
public reference anatomy records, not patient data.

## Reference-grounded teaching scope

Main inspected these primary pages and reuse terms on 17 September 2026.
Write original concise prose, credit the institutions and link each factual
source in its lesson. Do not copy pictures, diagrams, videos, logos or layouts.

- [NIDDK digestive system](https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works): peristaltic transport; gastric mixing and controlled onward emptying; intestinal digestion/absorption versus colonic water recovery and stool movement; pancreatic digestive secretions; gallbladder bile storage/release. Preserve bile production as a liver function. This page was last reviewed December 2017; avoid extending it into treatment advice.
- [NCI SEER pancreas](https://training.seer.cancer.gov/anatomy/endocrine/glands/pancreas.html): distinguish duct-delivered exocrine enzymes from endocrine islet insulin/glucagon. Do not imply all endocrine cells or functions are represented by these two hormones or visible source meshes.
- [NIDDK kidneys](https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work): glomerular filtration versus tubular handling, fluid/electrolyte/acid balance and endocrine roles. Do not infer equal left/right function, filtration rates or patient physiology from shape.
- [NIDDK urinary tract](https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works): storage versus coordinated voiding involving bladder wall, outlet and neural control. Do not claim the surface establishes patency, continence or quantitative capacity.
- [NHLBI respiratory system](https://www.nhlbi.nih.gov/health/lungs/respiratory-system): tracheal air conduction in the route to bronchi/lungs, distinct from alveolar gas exchange. Do not copy its expressly copyrighted Nucleus Medical Media graphics/animations.
- [NCI SEER spleen](https://training.seer.cancer.gov/anatomy/lymphatic/components/spleen.html): blood filtration, removal of old/damaged erythrocytes and immune surveillance; distinguish blood filtration from lymph-node filtration. Avoid overgeneralising its emergency blood-reservoir discussion.
- [NCI SEER adrenal](https://training.seer.cancer.gov/anatomy/endocrine/glands/adrenal.html): cortex steroid classes versus medullary catecholamines. [NIDDK adrenal hormones](https://www.niddk.nih.gov/health-information/endocrine-diseases/adrenal-insufficiency-addisons-disease/definition-facts) supports cortisol stress/metabolic roles and aldosterone salt/water balance. Its disease-focused two-hormone summary is not a complete adrenal-hormone inventory; do not import disease management.

## Commercial reuse boundary

[NIDDK policy](https://www.niddk.nih.gov/copyright) permits most information reuse,
with exceptions for third-party material and logos; edited work must not imply
endorsement or recommend medical treatment. Use named source credit, no logos,
original introductory educational summaries and no third-party media.
[NCI policy](https://www.cancer.gov/policies/copyright-reuse) generally permits
reuse with NCI credit and original links; separately copyrighted material and
graphics retain their restrictions. No PDQ database/translation or NCI logo is
imported. [NHLBI policy](https://www.nhlbi.nih.gov/about/contact/trademark-branding-and-logo)
distinguishes public-domain information from protected publications/media and
branding; preserve credits and exclude the explicit media exceptions above.
These text-reference decisions do not clear unrelated assets or the whole Atlas.

## Implementation and acceptance

Implement all 13 placements as a coherent major-organ Function increment,
reusing the existing compact note panel rather than adding navigation controls.
Pin the then-current exact display identities, source arrays/bounds, bundle
hashes and prior content. Use separate immutable transitions, not edits to the
heart/lung/liver milestone's accepted snapshots. Preserve every other topic and
the exact coverage notes. Changed source/side/bundle must invalidate dispatch.

Explicitly distinguish root, nested and independent specimen representations:
the HRA renal study already contains selected cortical/collecting structures
with three source holds; it is not registered to these root kidneys. Existing
pancreatic duct detail is not evidence of lumen continuity or islet anatomy.
Do not assert that those independently available details are absent everywhere.

Require source rejection cases, real note renders, immutable preservation
checks, content/review/source-hold checks, TypeScript/builds and desktop/mobile
sampling. Clinical facts remain drafts for revision-bound owner radiologist
review. No scan registration, patient data, new entitlement, paid asset, source
geometry mutation or publication is authorised by this content plan.
