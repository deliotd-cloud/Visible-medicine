import type { SpecimenClinicalLesson, SpecimenTopicDraft } from './um-limb-clinical';

// Original short synthesis; renal trauma/RCC references revised 2026-09-17.
// Reading references only: no scan, illustration, table, protocol or passage imported.
export const hraRenalClinicalReferences = {
  trauma: { title: 'Coccolini et al. · Kidney and uro-trauma: WSES-AAST guidelines (2019; CC BY 4.0)', url: 'https://link.springer.com/article/10.1186/s13017-019-0274-x' },
  rcc: { title: 'Withey et al. · Multimodality staging of renal cell carcinoma (2026; CC BY 4.0)', url: 'https://link.springer.com/article/10.1007/s00261-026-05660-5' },
  haematoma: { title: 'Bonatti et al. · MDCT of blunt renal trauma (2015; CC Attribution, version unspecified)', url: 'https://link.springer.com/article/10.1007/s13244-015-0385-1' },
  ccBy4: { title: 'Creative Commons Attribution 4.0 licence', url: 'https://creativecommons.org/licenses/by/4.0/' },
  urothelial: { title: 'NCI · Renal pelvis and ureter cancer', url: 'https://www.cancer.gov/types/kidney/patient/transitional-cell-treatment-pdq' },
  venous: { title: 'NCI · Renal cell cancer and venous extension', url: 'https://www.cancer.gov/types/kidney/hp/kidney-treatment-pdq' },
  artery: { title: 'NIDDK · Renal artery stenosis', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/renal-artery-stenosis' },
  urography: { title: 'ACR/RSNA · Urography', url: 'https://www.radiologyinfo.org/en/info/urography' },
  stones: { title: 'ACR/RSNA · Kidney and bladder stones', url: 'https://www.radiologyinfo.org/en/info/stones-renal' },
  infection: { title: 'IDKD · Urinary infection and obstruction (chapter 20)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK543798/' },
  renalMRI: { title: 'IDKD · Renal MRI and inflammatory disease (chapter 23)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK543809/' },
  column: { title: 'Algin et al. · Columns of Bertin: imaging findings (2014)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4261443/' },
  papilla: { title: 'Jung et al. · Renal papillary necrosis at CT/urography (2006)', url: 'https://pubmed.ncbi.nlm.nih.gov/17102053/' },
} as const;
type Ref = keyof typeof hraRenalClinicalReferences;
const sourceCredits: Partial<Record<Ref, string>> = {
  trauma: 'Summary adapted from Coccolini et al. (2019), CC BY 4.0.',
  rcc: 'Summary adapted from Withey et al. (2026), CC BY 4.0.',
  haematoma: 'Summary adapted from Bonatti et al. (2015), CC Attribution; version unspecified.',
};
const refs = (...keys: Ref[]) => [...new Set([
  ...keys.map(k => hraRenalClinicalReferences[k].url),
  ...(keys.some(k => k === 'trauma' || k === 'rcc') ? [hraRenalClinicalReferences.ccBy4.url] : []),
])];
const draft = (body: string, ...keys: Ref[]): SpecimenTopicDraft => ({ readiness: 'draft', body: [body, ...keys.flatMap(k => sourceCredits[k] ? [sourceCredits[k]] : [])].join(' '), references: refs(...keys) });
type Topics = SpecimenClinicalLesson['topics'];

export const hraRenalTopicFamilies = {
  capsule: {
    clinical: draft('Localise a collection inside or outside the capsule: the subcapsular space lies against parenchyma, whereas the perirenal compartment surrounds the capsule.', 'haematoma'),
    pathology: draft('A subcapsular haematoma may indent the kidney; perirenal blood occupies surrounding fat. Neither collection nor an injury grade is represented by this capsule mesh.', 'haematoma'),
    ct: draft('CT depicts traumatic haematoma alongside parenchymal, vascular and collecting-system injury. An intact reference surface cannot exclude any of these findings in a patient.', 'haematoma'),
    mri: draft('MRI can help when CT is equivocal or during follow-up; it is not the default acute renal-trauma examination. This surface contains no blood-product signal or scan protocol.', 'trauma'),
    ultrasound: draft('FAST may miss renal injury. A negative examination does not rule it out, and FAST cannot substitute for the renal characterisation provided by CT.', 'trauma'),
  },
  hilum: {
    clinical: draft('Assess vessels and the collecting system separately around a central renal mass; involvement of one does not establish involvement of the other.', 'rcc'),
    pathology: draft('Hilar location alone does not identify tumour type. Distinguish a parenchymal renal tumour from malignancy of the urinary lining, and assess spread independently.', 'rcc', 'urothelial'),
    ct: draft('Arterial and nephrographic CT phases assess vascular and parenchymal injury; delayed urographic images assess urinary leakage. A single reference surface supplies none of those phases.', 'trauma'),
    mri: draft('MR urography evaluates the urinary tract; renal MRI also assesses surrounding tissues. The hilum surface alone represents neither a lumen nor a vascular map.', 'urography'),
  },
  parenchyma: {
    clinical: draft('Assess parenchymal abnormalities together with the collecting system and surrounding tissues; infection can extend beyond the kidney.', 'infection'),
    pathology: draft('Pyelonephritis may be focal or diffuse and can be complicated by abscess. Diagrammatic cortex/medulla colours are not evidence of inflammation.', 'infection'),
    ct: draft('Pyelonephritis may produce wedge-shaped or striated reduced enhancement. A striated nephrogram is not specific to infection.', 'infection', 'renalMRI'),
    mri: draft('T1/T2, dynamic enhancement and diffusion provide complementary renal information. Restricted diffusion alone does not distinguish infection from tumour.', 'renalMRI'),
    ultrasound: draft('Renal size, echogenicity, corticomedullary distinction and collecting-system dilatation can be assessed. Ultrasound can miss early infection or small complications.', 'infection'),
  },
  column: {
    clinical: draft('A prominent column of Bertin can mimic a renal mass. Establish continuity with cortical tissue before interpreting a central projection.', 'column'),
    pathology: draft('A hypertrophied column is a pseudotumour, not itself a neoplasm. This source is not labelled hypertrophied and shows no diagnosed mass.', 'column'),
    ct: draft('A cortical pseudotumour typically follows cortical attenuation and enhancement. Do not infer either measurement from this model’s colour.', 'column'),
    mri: draft('Compare the suspected column with cortex across sequences and enhancement phases; matching behaviour supports a cortical pseudotumour.', 'column'),
    ultrasound: draft('Columns may resemble cortical echogenicity and vascularity, but atypical appearances occur. A single echogenicity observation is not definitive.', 'column'),
  },
  papilla: {
    clinical: draft('Papillary necrosis has several causes, including diabetes, analgesic overuse, sickle-cell disease, infection and obstruction; anatomy alone does not establish the cause.', 'papilla'),
    pathology: draft('Papillary injury can lead to sloughing, calyceal distortion or downstream obstruction. Source-part boundaries and missing mesh connections are not sloughed papillae.', 'papilla'),
    ct: draft('Excreted contrast can outline papillary clefts or a sloughed papilla; filling defects and papillary blunting are possible findings, not features simulated here.', 'papilla'),
  },
  collecting: {
    clinical: draft('Separate pelvicalyceal dilatation from its cause. Stones are one potential cause; clinical and imaging assessment must establish whether drainage is obstructed.', 'stones', 'infection'),
    pathology: draft('Urothelial malignancy arises in the urinary lining and differs from a renal parenchymal tumour. These calyx/pelvis surfaces contain no tumour or histological layers.', 'urothelial'),
    ct: draft('CT urography evaluates the collecting system and surrounding anatomy. Contrast outlining a cavity is not the same as parenchymal enhancement.', 'urography'),
    mri: draft('T2-weighted and contrast-enhanced urographic images can assess urinary spaces. A filling defect is an indirect finding, not proof of a stone.', 'renalMRI'),
    xray: draft('Intravenous urography uses iodinated contrast to outline the urinary tract. It is a contrast examination, not equivalent to a plain abdominal radiograph.', 'urography'),
    ultrasound: draft('Ultrasound can identify collecting-system dilatation and help detect stones. Dilatation alone does not describe tissue histology or the full cause of obstruction.', 'stones', 'infection'),
  },
  ureter: {
    clinical: draft('A ureteric stone can impede renal drainage. Follow the outflow pathway rather than attributing an upstream abnormality only to renal parenchyma.', 'stones'),
    pathology: draft('The ureteric lining can develop urothelial cancer. Wall disease is distinct from an intraluminal calculus; neither is represented by the source shell.', 'urothelial'),
    ct: draft('CT can localise a calculus and assess its effect on drainage. Urographic evaluation adds information about the urinary tract and adjacent tissues.', 'stones', 'urography'),
    mri: draft('A ureteric calculus may appear indirectly as a filling defect on urographic images. MRI signal or a defect alone does not establish stone composition.', 'renalMRI'),
    xray: draft('Contrast urography depicts the ureteric passage. Superimposed 2D projection anatomy must not be mistaken for this freely rotated 3D source view.', 'urography'),
    ultrasound: draft('Ultrasound can help assess stones and their obstructive effects. The long source ureter does not imply its entire course is visible in one ultrasound window.', 'stones'),
  },
  artery: {
    clinical: draft('Renal arterial narrowing may contribute to renovascular hypertension and impaired renal perfusion. A visible reference artery does not establish normal flow.', 'artery'),
    pathology: draft('Atherosclerosis and fibromuscular dysplasia are causes of renal artery stenosis. No plaque, dysplasia or measured stenosis is modelled.', 'artery'),
    ct: draft('CTA evaluates renal arterial anatomy using contrast-enhanced CT. The reference surface has no patient-specific lumen measurements or accessory-artery completeness guarantee.', 'artery'),
    mri: draft('MRA evaluates renal arteries without x-ray radiation. This mesh contains no angiographic signal, flow measurement or individual contrast-safety assessment.', 'artery'),
    ultrasound: draft('Duplex combines structural imaging with Doppler flow assessment. Colour assigned to the mesh is not Doppler flow direction or a velocity criterion.', 'artery'),
    xray: draft('Catheter angiography uses contrast and x-rays to depict arteries. It is not a plain radiograph or a simulated procedure in this atlas.', 'artery'),
  },
  vein: {
    clinical: draft('Renal cancer may extend into renal veins and towards the vena cava. Evaluate extent using acquired imaging, not reference-mesh length.', 'venous'),
    pathology: draft('Venous tumour extension is distinct from a missing or fragmented source surface. The held left-vein mesh is not evidence of thrombosis.', 'venous'),
    ct: draft('Contrast-enhanced CT helps map venous extension of a renal tumour. This mesh has no enhancement, thrombus or measured venous patency.', 'rcc'),
    mri: draft('When CT leaves the upper extent of venous tumour thrombus unclear, MRI can resolve that uncertainty. The specimen does not contain a complete caval pathway.', 'rcc'),
  },
} as const satisfies Record<string, Topics>;

type Concept = { family: keyof typeof hraRenalTopicFamilies; limit: string; question: string; answer: string; refs: Ref[] };
export const hraRenalClinicalConcepts = {
  capsule: { family: 'capsule', limit: 'Capsules are supplied; perirenal fat and renal fascia are not. Separation does not expose a validated surgical or haematoma plane.', question: 'Does removing this capsule also remove renal fascia?', answer: 'No. They are different anatomical boundaries, and renal fascia is not supplied here.', refs: ['haematoma'] },
  hilum: { family: 'hilum', limit: 'The labelled hilum is a source surface, not a solid organ, complete pedicle or validated hilar dissection. The left renal vein is held.', question: 'Can this hilar surface establish a complete venous–arterial–pelvic arrangement?', answer: 'No. Its extent and neighbouring partial surfaces require review; the left vein is absent from the display.', refs: ['rcc'] },
  cortex: { family: 'parenchyma', limit: 'Only the right outer-cortex surface is admitted. The absent left counterpart is a source hold, not cortical thinning or disease.', question: 'Does the absent left outer cortex indicate atrophy?', answer: 'No. That mesh was withheld for geometry defects; no patient cortical thickness is measured.', refs: ['infection'] },
  column: { family: 'column', limit: 'Only the left renal-column group is admitted. It is not a diagnosed hypertrophied column, and the defective right group remains held.', question: 'Is a prominent cortical column necessarily a neoplasm?', answer: 'No. Cortical tissue can mimic a mass; continuity and matching imaging behaviour are relevant, but this mesh supplies no measured signal.', refs: ['column'] },
  pyramid: { family: 'parenchyma', limit: 'Each lettered pyramid is a source part, not a vascular territory, scan segment or microscopic nephron reconstruction.', question: 'Do the pyramid letters specify arterial territories?', answer: 'No. The letters identify source parts; no perfusion territories have been validated.', refs: ['infection'] },
  papilla: { family: 'papilla', limit: 'Eleven left papillary parts and ten left minor-calyx parts are supplied. Letters and proximity do not validate one-to-one drainage.', question: 'Can source part A be assumed to drain into calyx A?', answer: 'No. A matching letter is not a verified anatomical correspondence, particularly with unequal source-part counts.', refs: ['papilla'] },
  'minor-calyx': { family: 'collecting', limit: 'Minor-calyx parts may contain separate source shells. No validated papillary pairing, continuous wall or patent lumen is inferred.', question: 'Does a visible gap between a papilla and calyx demonstrate obstruction?', answer: 'No. Source boundaries are incomplete and drainage connections have not been validated.', refs: ['stones'] },
  'major-calyx': { family: 'collecting', limit: 'Three right and four left major-calyx source parts are retained. Their labels do not define universal branching or segmental drainage.', question: 'Are these major-calyx counts a universal template?', answer: 'No. They describe this source assembly, not normal variation in every individual.', refs: ['urography'] },
  pelvis: { family: 'collecting', limit: 'The renal pelvis is a collecting-region surface, not a segmented urine volume, pressure model or validated ureteropelvic junction.', question: 'Does expanding the renal pelvis with Explode demonstrate hydronephrosis?', answer: 'No. Explode translates source geometry; it does not dilate tissue or simulate urinary obstruction.', refs: ['stones'] },
  ureter: { family: 'ureter', limit: 'Long source ureters are supplied without validated bladder insertions, wall layers, peristalsis or complete luminal continuity.', question: 'Does a continuous-looking ureter mesh prove urinary patency?', answer: 'No. Reference surface geometry cannot establish flow, obstruction or individual wall disease.', refs: ['stones'] },
  artery: { family: 'artery', limit: 'Two partial renal arterial sources are supplied. Accessory vessels, branch territories, lumen calibre and perfusion are not validated.', question: 'Can mesh width be used to grade renal artery stenosis?', answer: 'No. Stenosis assessment requires patient imaging and appropriate measurements; the atlas is an unregistered reference.', refs: ['artery'] },
  vein: { family: 'vein', limit: 'Only the right renal vein is admitted; the left source is held for geometry defects. No full cava or venous drainage network is supplied.', question: 'Does the missing left renal vein imply occlusion?', answer: 'No. Its exclusion reflects a source-quality hold, not a clinical diagnosis.', refs: ['venous'] },
} as const satisfies Record<string, Concept>;

export function authoredHraRenalClinical(concept: string): SpecimenClinicalLesson | null {
  if (!Object.hasOwn(hraRenalClinicalConcepts, concept)) return null;
  const c = hraRenalClinicalConcepts[concept as keyof typeof hraRenalClinicalConcepts];
  return JSON.parse(JSON.stringify({
    modelLimit: c.limit + ' Teaching draft; radiologist review pending. No patient images, scan registration or separately paid lecture access.',
    topics: hraRenalTopicFamilies[c.family],
    selfCheck: { question: c.question, answer: c.answer, references: refs(...c.refs) },
  })) as SpecimenClinicalLesson;
}
