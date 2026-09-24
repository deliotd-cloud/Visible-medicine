# Chest and abdominal organ imaging teaching

Added 13 September 2026 against Atlas source
`76e0d191c683f273d2399216d82a592b14438b7d`: 42 original draft orientation notes
for 15 exact existing organ selections. CT and MRI cover all 15; ultrasound
covers 12. These are concise entry points alongside the existing Anatomy,
Function, Pathology, Clinical and Quiz content, not complete imaging lectures.

## Scope and teaching distinctions

| Selection | FMA | Teaching emphasis |
| --- | --- | --- |
| Heart | 7088 | Cardiac versus routine CT; cardiac planes/cine versus tissue characterisation; echo windows |
| Right / left lung | 7309 / 7310 | Lobar relationships, lingula, low conventional MR signal, pleural ultrasound and artefacts |
| Esophagus | 7131 | Continuity and distension-dependent wall assessment; wall versus mucosal/motility information |
| Trachea | 7394 | Carina and multiplanar course; static versus dynamic assessment; cervical tissue–air interface |
| Thymus | 9607 | Age-dependent appearance; limits of chemical shift and diffusion; paediatric US is not adult validation |
| Right / left main bronchus | 7395 / 7396 | Carinal continuity, asymmetric proximal courses and limits of distal-branch inference |
| Stomach | 7148 | Filling, gastric regions, wall and surrounding tissues; antral ultrasound coverage limits |
| Small intestine | 7200 | Continuity, enterographic distension, collapse/spasm pitfalls, cine and layered US appearance |
| Large intestine | 7201 | Following the colon; routine CT/MRE versus dedicated colonic/rectal examinations |
| Cystic duct | 14539 | Junction variation, limited visibility and MRCP projection overlap |
| Common hepatic duct | 14668 | Confluence versus cystic junction; source-image review and contextual duct measurements |
| Appendix | 14542 | Base-to-tip tracing, variable position, associated findings and nonvisualisation |
| Ileocecal junction | 11338 | Ileum-to-caecum continuity; separate appendix and unresolved source valve aliases |

The original increment left external ultrasound topics for oesophagus and both
main bronchi pending. This is not a claim that specialised endoscopic ultrasound
cannot assess them.
No endoscopic probe model, procedure lesson or validated sonographic study is
supplied by this increment. The other US entries explicitly distinguish direct
tissue visibility from acoustic artefacts and limited windows.

On 24 September 2026, two later draft LIMITATION lessons were added for the
exact pinned right and left main bronchi, FMA7395 and FMA7396. They address
external transthoracic ultrasound only: air and rib shadows restrict the
acoustic window, and pleural artefacts are not direct bronchial-lumen images.
Neither the external scan nor the Atlas surface establishes bronchial patency
or distal branches. Endobronchial and endoscopic ultrasound remain outside
this lesson. The oesophageal ultrasound topic remains pending. The original
42-topic pins and earlier transition are unchanged; the two additions have
their own exact-source transition and historical reconstruction.

## Sources and commercial-use boundary

The publication/society links in
`content/thoracoabdominal-organ-imaging.ts` are factual reading references, not
assets admitted for redistribution. All new prose is brief, original synthesis;
no articles, illustrations, screenshots, tables, scans or patient examples are
copied. Search-index excerpts supplied the factual verification where PMC's
direct page request returned a browser check; that page check was not bypassed.
The later bronchus limitation drafts add one reading reference: the
[College of Intensive Care Medicine Ultrasound SIG recommendations](https://onlinelibrary.wiley.com/doi/10.1002/ajum.12163).
Existing anatomical context and cautions are retained verbatim from the local
pre-change lessons, with their existing references. The new resolver is original
MIT code. Model, dependency, font and texture inventories are unchanged; no paid
API or new mandatory service is added. Hosting/review costs are not guaranteed.

Principal reading references include [SCMR protocols](https://pmc.ncbi.nlm.nih.gov/articles/PMC7038611/),
[ASE echocardiographic examination](https://www.asecho.org/wp-content/uploads/2019/01/2019_Comprehensive-TTE.pdf),
[lung ultrasound consensus](https://pmc.ncbi.nlm.nih.gov/articles/PMC10086956/),
[CT enterography](https://pmc.ncbi.nlm.nih.gov/articles/PMC3474054/),
[gastrointestinal US anatomy](https://pmc.ncbi.nlm.nih.gov/articles/PMC5658311/)
and [MRCP principles and pitfalls](https://pmc.ncbi.nlm.nih.gov/articles/PMC3292642/).
The validation report counts new unique words attributed to each reference;
every reference remains below the 200-word synthesis ceiling. Repeated UI
placement of a shared fact is not a newly authored source passage.

## Implementation and verification

The resolver accepts the exact retained source identity, including mesh/source
hashes, side, region, source names, bounds and validation metadata. It does not
attach these notes to a similarly named independent specimen or a patient mask.
Pins preserve the previous lessons and anatomical context. Offline transition
history checks all changed topics before reconstructing the earlier state;
older histories remain fixed and private approvals are never migrated.

`npm run thoracoabdominal-organ-imaging:test` checks all 42 real note-callback
server renders, 798 altered-source/topic rejections, all 1,101 displayed schema
records and preservation of the other 9,867 topics plus existing dissection
recipes. It hashes all six affected bundles and checks draft status, citations,
immutability and the originally pending US topics. These checks do not prove clinical
accuracy or GPU, touch-device, real-DICOM or end-to-end Education acceptance.
The later bronchus drafts are checked with
`npm run main-bronchus-external-ultrasound:test`; the original validator now
reports 14 ultrasound drafts and only the oesophageal topic pending.
The dated coordination checkpoint records actual build, publication and recovery
results separately. No new default control or extra scrolling layer is added.

## Radiologist sign-off still needed

Review the exact content/display revision, not just these headings:

1. Correctness and teaching value of every structure/modality note; distinguish
   modality orientation from a complete disease, acquisition or management lesson.
2. Cardiac planes and echo windows; cardiac CT motion/opacification pitfalls.
3. Lung fissures and sided anatomy; air-related US artefacts and MR visibility.
4. Airway scope, dynamic versus static interpretation and cervical US limits.
5. Thymic age variation and the limits of chemical shift/diffusion interpretation.
6. Hollow-viscus distension, continuity and nonvisualisation pitfalls, especially
   appendix, terminal ileum and colonic/rectal examination boundaries.
7. Biliary junction variants, measurement context and MRCP overlap artefacts.
8. Donor geometry, aggregate exclusions and the ileocecal source aliases, which
   remain unvalidated and must not be promoted to complete layers/valve contours.

Clinical sign-off, media privacy/release clearance and spatial registration are
separate gates. Didanix Education/light remains the imaging target; concept
links do not align coordinate frames, and Atlas rights do not unlock paid lectures.
