import type { NestedConcept, NestedSection } from './nested-teaching';

export const renalTeachingReferences = {
  renalUreterInjury: {
    title: 'EAU · Urological trauma guideline, ureteral injury (§4.2)',
    url: 'https://uroweb.org/guidelines/urological-trauma/chapter/urogenital-trauma-guidelines',
  },
  renalUrinaryImaging: {
    title: 'NIDDK · Urinary tract imaging',
    url: 'https://www.niddk.nih.gov/health-information/diagnostic-tests/urinary-tract-imaging',
  },
  renalVenousCompression: {
    title: 'Kolber et al. · Nutcracker syndrome: diagnosis and therapy (2021)',
    url: 'https://cdt.amegroups.org/article/view/49808/html',
  },
  renalAdrenalHaemorrhage: {
    title:
      'Elhassan et al. · Approach to the patient with adrenal hemorrhage (2023)',
    url: 'https://academic.oup.com/jcem/article/108/4/995/6834810',
  },
  renalAdrenalVeinImaging: {
    title: 'Ota et al. · Right adrenal vein CT/MR comparison (2016; abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26108640/',
  },
};

// Reuse existing abdominal-table keys; one source must have one word budget.
const renalArteries = 'hepaticArteries';
const renalVeins = 'hepaticVeins';
const draft = (body: string, reference: string): NestedSection => ({
  body,
  references: [reference],
  readiness: 'draft',
});
const limit =
  'A source-labelled vascular group, not a complete circulation or validated lumen. Kidney association is study navigation; adrenal vessels are not kidney tissue. Source positions are retained, but endpoints, variants and patient correspondence are unvalidated. Cortex, medulla, calyces and pelvis are absent. The left inferior suprarenal artery is withheld because of a source defect.';
export const renalConcepts: NestedConcept[] = [
  {
    id: 'renal-ureteric-arteries',
    study: 'renal',
    fmaIds: ['FMA70492', 'FMA70493'],
    sections: {
      anatomy: draft(
        'The renal artery gives ureteric branches. The selected source label describes a ureteric arterial segment, not a segment of kidney tissue.',
        renalArteries,
      ),
      function: draft(
        'These branches contribute arterial supply to the upper ureter.',
        renalArteries,
      ),
      clinical: draft(
        'Do not equate this small group with the ureter’s entire arterial supply. Its relationship with a kidney does not establish intrarenal branching or a complete vascular route.',
        renalArteries,
      ),
      pathology: draft(
        'Loss of ureteric blood supply can cause ischaemic injury, including after an operation. This arterial group illustrates only part of that supply. Its shape cannot establish tissue viability, the extent of injury or the likelihood of a later complication.',
        'renalUreterInjury',
      ),
    },
    imaging: {
      ct: draft(
        'CT urography investigates suspected ureteric injury; delayed contrast leakage can reveal urinary extravasation. That is a finding in the urinary tract, not arterial contrast escape. The selected ureteric arterial segment is not a ureter lumen, CT phase or injury map.',
        'renalUreterInjury',
      ),
      mri: draft(
        'MR urography evaluates the urinary tract, whereas MR angiography examines vessels such as the renal arteries. Keep the ureter and its arterial supply distinct. Neither technique is represented by this surface, and visibility of this small branch is not established.',
        'renalUrinaryImaging',
      ),
      ultrasound: draft(
        'Kidney ultrasound can assess position, obstruction and other structural abnormalities. Such an examination is not a demonstration of every ureteric arterial branch. This small source group supplies no ultrasound image, flow measurement or evidence of ureteric perfusion.',
        'renalUrinaryImaging',
      ),
    },
    modelLimit: limit,
    quiz: {
      question:
        'Does this selection show the entire blood supply of the ureter?',
      answer:
        'No. It shows only the supplied renal arterial group; other arterial sources and continuous junctions are not established.',
      references: [],
      basis: 'model-scope',
    },
  },
  {
    id: 'renal-inferior-suprarenal-artery',
    study: 'renal',
    fmaIds: ['FMA69265'],
    sections: {
      anatomy: draft(
        'The inferior suprarenal artery usually arises from the renal artery and approaches the adrenal gland.',
        renalArteries,
      ),
      function: draft(
        'It contributes arterial inflow to the adrenal gland alongside other suprarenal arterial sources.',
        renalArteries,
      ),
      clinical: draft(
        'Keep adrenal arterial inflow separate from adrenal venous drainage when comparing these structures. This model does not establish all adrenal arterial sources.',
        renalArteries,
      ),
      pathology: draft(
        'Adrenal haemorrhage may occur with trauma, severe illness or an underlying tumour. The gland has several arterial sources; a haemorrhage cannot automatically be attributed to its inferior suprarenal artery. This single branch is not a complete bleeding-source map.',
        'renalAdrenalHaemorrhage',
      ),
    },
    imaging: {
      ct: draft(
        'Acute adrenal haemorrhage can produce a high-attenuation gland lesion and surrounding stranding on CT. These are tissue and surrounding-space findings, not features of a normal arterial surface. Identifying this branch does not identify the origin of bleeding.',
        'renalAdrenalHaemorrhage',
      ),
      mri: draft(
        'MRI can characterise adrenal blood products and help assess an underlying enhancing mass. Signal changes with the age of haemorrhage and the sequence used. The arterial model contains no blood-product signal, enhancement or adrenal lesion.',
        'renalAdrenalHaemorrhage',
      ),
    },
    modelLimit: limit,
    quiz: {
      question:
        'Why is there no matching left inferior suprarenal artery in this study?',
      answer:
        'The left source contains a geometry defect and was withheld. Its absence is a model limitation, not normal anatomical absence.',
      references: [],
      basis: 'model-scope',
    },
  },
  {
    id: 'renal-veins',
    study: 'renal',
    fmaIds: ['FMA14335', 'FMA14336'],
    sections: {
      anatomy: draft(
        'Renal veins drain to the inferior vena cava. The left crosses the aorta; the right is shorter.',
        renalVeins,
      ),
      function: draft('They return blood from the kidneys.', renalVeins),
      clinical: draft(
        'An aortic crossing alone does not establish compression or a clinical diagnosis.',
        renalVeins,
      ),
      pathology: draft(
        'Left-sided example: nutcracker syndrome involves symptomatic left renal venous compression, classically between the superior mesenteric artery and aorta. Compression anatomy alone is not the syndrome. This is not the usual right renal vein arrangement, and neither modelled vein establishes disease.',
        'renalVenousCompression',
      ),
    },
    imaging: {
      ct: draft(
        'For suspected left renal venous compression, CT assesses the aortomesenteric relationship, vein calibre and possible collateral pathways. Findings require clinical interpretation. Do not measure a diagnostic angle or stenosis ratio from this atlas, particularly with structures separated.',
        'renalVenousCompression',
      ),
      mri: draft(
        'MRI can evaluate the left renal vein and adjacent or collateral veins without ionising radiation. Sequence choice affects visibility. This left-sided teaching example does not establish a right-sided equivalent, a patient-specific venous variant or a registered MRI correspondence.',
        'renalVenousCompression',
      ),
      ultrasound: draft(
        'Doppler evaluation of suspected left renal venous compression compares flow velocities near the hilum and the compressed segment; body position influences findings. Atlas blue identifies a vein, not Doppler direction, velocity or patency. No diagnostic waveform or pressure gradient is supplied.',
        'renalVenousCompression',
      ),
    },
    modelLimit: limit,
    quiz: {
      question: 'Which major vessel receives renal venous drainage?',
      answer: 'The inferior vena cava.',
      references: [renalVeins],
      basis: 'primary-reference',
    },
  },
  {
    id: 'renal-suprarenal-veins',
    study: 'renal',
    fmaIds: ['FMA14343', 'FMA14349'],
    sections: {
      anatomy: draft(
        'The right suprarenal vein usually drains to the cava; the left to the left renal vein.',
        renalVeins,
      ),
      function: draft('They drain the adrenal glands.', renalVeins),
      clinical: draft(
        'Paired structures need not have identical connections. Junctions and variants require review.',
        renalVeins,
      ),
      pathology: draft(
        'Adrenal haemorrhage provides a reason to consider venous outflow as well as arterial inflow: numerous small arteries drain through a more limited venous route. Haemorrhage alone does not prove thrombosis of the selected vein; no diseased adrenal tissue is represented.',
        'renalAdrenalHaemorrhage',
      ),
    },
    imaging: {
      ct: draft(
        'Right-sided reference example: a study before adrenal venous sampling used dynamic CT to map the right adrenal vein and its variants. Visibility depended on the examination. These results do not validate this mesh, the left vein or a catheter route.',
        'renalAdrenalVeinImaging',
      ),
      mri: draft(
        'In the same right-adrenal-vein study, a dedicated non-contrast MR sequence depicted the vein in many, but not all, patients. This is not a guarantee for routine MRI or the left adrenal vein. The atlas supplies no sequence-specific signal or sampling plan.',
        'renalAdrenalVeinImaging',
      ),
    },
    modelLimit: limit,
    quiz: {
      question: 'Where does the left suprarenal vein usually drain?',
      answer: 'Into the left renal vein.',
      references: [renalVeins],
      basis: 'primary-reference',
    },
  },
];
