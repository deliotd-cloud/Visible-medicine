// Original source-backed educational drafts. No image, specimen or patient data imported.
const anatomy = 'https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_tables.html';
const relationships = 'https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_ans.html';
const physiology = 'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work';
const urography = 'https://www.radiologyinfo.org/en/info/urography';
const renalMass = 'https://acsearch.acr.org/docs/69367/Narrative/';
const abdominalMri = 'https://www.radiologyinfo.org/en/info/mri-abdomen-pelvis';
const priorAnatomy = 'https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html';
const priorUrinary = 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works';
const priorRenal = 'https://www.ncbi.nlm.nih.gov/books/NBK543811/';
const renalCtPhases = 'https://www.radiology.jp/content/files/gl2021/diagnostic_imaging_guidelines_2021e.pdf';
const renalCtStudy = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7692100/';
const renalMrStudy = 'https://pubmed.ncbi.nlm.nih.gov/3522232/';
const staticFluidMrU = 'https://pubmed.ncbi.nlm.nih.gov/3575695/';

export const kidneyOrientation = {
  right: {
    anatomy: {
      body: 'The right kidney is retroperitoneal against the posterior abdominal wall, usually lower than the left beneath the liver. Find its upper and lower poles and its medial hilum; anterior neighbours include the liver, second part of the duodenum and right colic region.',
      bullets: [
        'At the hilum, renal vessels and the renal pelvis connect with the kidney. The pelvis continues as the ureter; do not treat the surface indentation as a visible collecting system.',
        'Conceptually, an outer cortex surrounds medullary pyramids. Papillae drain through minor and major calyces into the pelvis. The sinus contains vessels, calyces and fat, not a single empty cavity.',
        'Locate the adrenal gland separately above and medial to the upper pole. The atlas selects one outer renal surface; it does not resolve these compartments, vessels, or the donor’s microscopic anatomy.',
      ],
      citations: [priorAnatomy, priorUrinary, anatomy, relationships, physiology],
    },
    ct: {
      body: 'On an acquired CT that includes the right kidney, check patient side, plane, field of view and contrast phase. Use the liver and posterior abdominal wall to orient its poles and medial hilum.',
      bullets: [
        'If both unenhanced and corresponding post-contrast images were acquired, compare attenuation to assess enhancement. A lone post-contrast series lacks the unenhanced baseline needed to quantify an attenuation change.',
        'If a corticomedullary phase was acquired, the cortex usually enhances more than the medulla; in the later nephrographic phase they become more uniformly enhanced. If delayed excretory images exist, follow opacified calyces and pelvis toward the right ureter.',
        'Do not infer cortex, medulla, collecting-system patency, a lesion or renal function from the intact outer mesh or an unacquired phase.',
      ],
      citations: [priorAnatomy, priorRenal, anatomy, urography, renalMass, renalCtPhases, renalCtStudy],
    },
    mri: {
      body: 'On an acquired abdominal MRI that includes the right kidney, verify side, plane, field of view and sequence before comparing its upper pole beneath the liver and medial hilum with the atlas.',
      bullets: [
        'On acquired T1-weighted images, look for cortex-to-medulla signal distinction where visible. If a heavily T2-weighted static-fluid urographic series was acquired and sufficiently filled, urine in the calyces and pelvis can appear bright; neither appearance is atlas colour.',
        'Diffusion-weighted and post-contrast series answer additional questions only when acquired. Enhancement needs the appropriate pre- and post-contrast images; the model cannot supply either.',
        'A fluid-sensitive collecting-system view, if present, is different from parenchymal characterization. Do not assume every abdominal MRI is an MR urography examination.',
      ],
      citations: [priorAnatomy, priorRenal, abdominalMri, renalMass, urography, renalMrStudy, staticFluidMrU],
    },
    quiz: {
      body: 'Which route correctly carries urine from the right renal papilla toward the bladder?',
      bullets: ['Papilla → minor calyx → major calyx → renal pelvis → right ureter', 'Papilla → renal vein → inferior vena cava → bladder', 'Right adrenal gland → renal sinus → bladder', 'Cortex → right renal artery → ureter'],
      correctAnswer: 'Papilla → minor calyx → major calyx → renal pelvis → right ureter',
      explanation: 'Papillae drain into minor calyces; these join as major calyces and the renal pelvis, which continues into the ureter. The atlas outer surface cannot show this route.',
      citations: [anatomy, physiology],
      additionalChecks: [{
        key: 'right-ct-phase', body: 'A right renal CT includes a nephrographic phase but no delayed excretory phase. What can you compare from the acquired series?',
        bullets: ['Parenchymal appearance in the nephrographic phase, without claiming delayed collecting-system opacification', 'The full opacified right ureter because the kidney is visible', 'MR T2 signal from the CT image', 'Renal filtration rate from atlas colour'],
        correctAnswer: 'Parenchymal appearance in the nephrographic phase, without claiming delayed collecting-system opacification',
        explanation: 'Phase-specific CT interpretation depends on the images actually obtained; a nephrographic acquisition does not establish a later excretory appearance.',
        citations: [urography, renalMass], note: 'Unscored draft check; no clinical or assessment validation.'
      }],
    },
  },
  left: {
    anatomy: {
      body: 'The left kidney lies retroperitoneally on the posterior abdominal wall and usually reaches higher than the right. Locate its poles and medial hilum; anterior relationships include the spleen, stomach, pancreatic region and left colic region.',
      bullets: [
        'The left renal hilum opens toward the sinus, where vessels and the renal pelvis pass. The pelvis continues as the left ureter; the surface does not expose these structures.',
        'Use cortex, medullary pyramids, papillae, calyces and pelvis as a conceptual internal route. The central sinus also contains fat and vessels; it is not equivalent to the collecting system.',
        'Separate the left adrenal gland from the upper renal pole and verify left/right anatomically rather than by current screen position. Internal renal divisions are not independently selectable meshes.',
      ],
      citations: [priorAnatomy, priorUrinary, anatomy, relationships, physiology],
    },
    ct: {
      body: 'On an acquired CT that includes the left kidney, confirm side, section plane, coverage and contrast phase. The spleen and posterior abdominal wall help locate the poles; trace the medial hilum only where actually shown.',
      bullets: [
        'Use an unenhanced series only if obtained. Do not infer pre-contrast attenuation by looking at a post-contrast image.',
        'On a corticomedullary phase, if acquired, the cortex usually enhances more strongly than the medulla; on a nephrographic phase the parenchyma appears more uniform. Delayed excretory images, when acquired, may depict opacified calyces and pelvis toward the left ureter.',
        'The outer atlas surface has no CT attenuation, phase behaviour, internal compartments or patient-specific collecting-system findings.',
      ],
      citations: [priorAnatomy, priorRenal, anatomy, urography, renalMass, renalCtPhases, renalCtStudy],
    },
    mri: {
      body: 'On an acquired MRI covering the left kidney, establish patient side, plane, coverage and sequence. Orient its upper pole near the spleen and its medial hilum before examining the actual images.',
      bullets: [
        'If T1-weighted images were acquired, seek visible cortex-to-medulla contrast in the left renal tissue. A heavily T2-weighted static-fluid urographic acquisition, when present and sufficiently filled, may show high-signal urine in calyces and pelvis.',
        'Use diffusion-weighted images or dynamic contrast comparison only if present. Enhancement is an acquired-image property, not a colour or shape of the atlas mesh.',
        'If a collecting-system sequence was acquired, distinguish its question from parenchymal characterization; a routine abdominal study does not automatically include MR urography.',
      ],
      citations: [priorAnatomy, priorRenal, abdominalMri, renalMass, urography, renalMrStudy, staticFluidMrU],
    },
    quiz: {
      body: 'Which relationship best orients the left kidney in the abdomen?',
      bullets: ['Retroperitoneal, usually higher than the right, with the spleen near its upper pole', 'Intraperitoneal and directly beneath the right liver lobe', 'Inside the spleen, with no medial hilum', 'Below the urinary bladder, with the pancreas behind both poles'],
      correctAnswer: 'Retroperitoneal, usually higher than the right, with the spleen near its upper pole',
      explanation: 'The left kidney lies posteriorly behind the peritoneum and usually higher than the right; the spleen is a left-sided anterior neighbour. Screen position alone does not determine laterality.',
      citations: [physiology, anatomy, relationships],
      additionalChecks: [{
        key: 'left-mri-sequence', body: 'A left renal MRI has T2-weighted images but no post-contrast series. Which comparison is supported?',
        bullets: ['Describe signal on the acquired T2 images without claiming enhancement', 'Measure gadolinium enhancement from the T2 series alone', 'Infer nephrographic CT attenuation from atlas colour', 'Declare the collecting system normal because the outer mesh is smooth'],
        correctAnswer: 'Describe signal on the acquired T2 images without claiming enhancement',
        explanation: 'T2 signal and post-contrast enhancement are different observations. The missing series and the surface model cannot supply enhancement data.',
        citations: [abdominalMri, renalMass], note: 'Unscored draft check; no clinical or assessment validation.'
      }],
    },
  },
} as const;

export const kidneyOrientationNote = 'Educational draft for revision-bound radiologist review. The source kidney is a single unvalidated outer mesh; no internal compartment, independent HRA specimen, patient scan, registration, diagnosis or functional measurement is represented.';
