# Renal clinical and imaging teaching

Checkpoint: 2026-09-12. This extends the independent HRA kidney specimen, not the main-body teaching or geometry. Existing Anatomy/Function notes, stable source IDs, three holds, dissection studies, identification eligibility and coordinate frames remain unchanged.

## Coverage and navigation

Use **Kidney layers · separate reference → select a structure → Learn**. The existing collapsed Anatomy / Clinical / Imaging groups and modality tabs are reused. No additional persistent controls, modals or scroll-before-model content is added. Each note remains a draft; absent topics state pending without substituting another tissue’s lesson.

| Topic | Source selections with a draft |
| --- | ---: |
| Clinical | 82 |
| Pathology | 82 |
| CT | 82 |
| MRI | 82 |
| Ultrasound | 82 |
| X-ray | 82 |

Updated1 October2026: **492 placements of54 distinct topic texts**, organised into nine topic families. Twelve concept-specific cautions and12 self-checks remain across all82 selections. Lettered parts share an anatomical concept; these are not492 unique lessons. Ten new structure-specific introductory notes fill94 formerly pending MRI/US/X-ray slots, preserving all398 previously populated placements. Modality/source limitations are explicit; no acquired-image evidence or validated papillary-necrosis detection is added. See [completion scope](HRA_RENAL_TOPIC_COMPLETION.md).

Teaching focuses on tissue/compartment distinction, cortical pseudotumours, papillary injury, parenchymal infection, collecting-system and ureteric disease, renal arterial stenosis and venous tumour extension. Model-specific self-checks distinguish teaching offsets, source gaps and held meshes from clinical pathology. No patient diagnosis, disease simulation, treatment plan, contrast dose, scan-timing prescription, disease grading or copied staging system is supplied.

## Sources and reuse

The following sources were inspected on12 September2026. Retrieval date is not publication date; background references include older literature. Facts were distilled into short original notes, with topic-level links. Reference status is not specialist approval. No images, tables, long passages, restricted models, or paid lecture assets are imported.

- [EAU urological trauma](https://uroweb.org/guidelines/urological-trauma/chapter/urogenital-trauma-guidelines): renal compartments and roles/limits of imaging. No injury-grading table or management protocol copied.
- [EAU RCC diagnostic evaluation](https://uroweb.org/guidelines/renal-cell-carcinoma/chapter/diagnostic-evaluation): tissue-of-origin questions, enhancement and venous evaluation. No staging or scoring system reproduced.
- [NCI renal pelvis/ureter cancer](https://www.cancer.gov/types/kidney/patient/transitional-cell-treatment-pdq) and [renal cell cancer](https://www.cancer.gov/types/kidney/hp/kidney-treatment-pdq): urothelial origin and venous extension only; no AJCC tables or cancer-stage assignment.
- [NIDDK renal artery stenosis](https://www.niddk.nih.gov/health-information/kidney-disease/renal-artery-stenosis): causes and broad imaging principles. This page’s older review date is not presented as a new clinical guideline.
- [ACR/RSNA urography](https://www.radiologyinfo.org/en/info/urography) and [stones](https://www.radiologyinfo.org/en/info/stones-renal): urinary tract imaging and obstructive effects.
- [IDKD chapter20](https://www.ncbi.nlm.nih.gov/books/NBK543798/) and [chapter23](https://www.ncbi.nlm.nih.gov/books/NBK543809/),2018: infection findings and complementary MRI information. The catalogue page NBK543808 is not used as the chapter citation; figures and protocol details are not copied.
- [Algin et al.,2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4261443/): column-of-Bertin imaging and its mass-mimic pitfall. Indexed article text and the PubMed record were available; the direct PMC page intermittently returned a browser challenge. No challenge bypass or image download.
- [Jung et al.,2006](https://pubmed.ncbi.nlm.nih.gov/17102053/): papillary necrosis findings from the available abstract; no paywalled full text or figures imported.

Original teaching uses the project’s code/content terms; the anatomical geometry retains its separate HRA CC BY4.0 notice. This change adds no dependency, font, texture, paid API or mandatory service. Separately paid lectures retain their own entitlements.

## Validation and review boundary

`npm run hra-renal-teaching:test` tests all82 source bindings,656 rendered topic states (now zero pending),984 malformed-source rejections, defensive lesson copies and preservation of previous Anatomy/Function material. Original geometry/navigation milestone comparisons remain pinned separately; the new completion suite compares current geometry/source retention and existing teaching against its exact baseline. The dedicated kidney dissection suite remains separate. Generated results: `docs/hra-renal-teaching-validation.json`.

You remain the radiologist sign-off owner. Review every topic’s wording, anatomical applicability, source age and clinical emphasis; obtain actual device/GPU/interaction evidence separately. Remaining work includes broader/advanced renal teaching, licensed acquired imaging, structure mapping/registration, independent-scope review storage and external lecture entitlement integration. No test or cited guideline approves the source geometry. The absent left outer cortex/right columns/left vein remain source-quality holds, not diagnoses.
