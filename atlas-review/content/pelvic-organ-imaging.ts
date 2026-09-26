// Original teaching drafts; linked references do not license their images for reuse.
export const pelvicOrganImagingGroups = {
  bladder: ['FMA15900'],
  prostate: ['FMA9600'],
  seminalVesicle: ['FMA19387', 'FMA19388'],
  ureter: ['FMA15571', 'FMA15572'],
  urethra: ['FMA19667'],
  testis: ['FMA7211', 'FMA7212'],
  epididymis: ['FMA18256', 'FMA18257'],
} as const;
export type PelvicOrganGroup = keyof typeof pelvicOrganImagingGroups;
export type PelvicOrganModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export const pelvicOrganReferences = {
  ct: 'https://www.radiologyinfo.org/en/info/bodyct',
  urography: 'https://www.radiologyinfo.org/en/info/urography',
  urinary:
    'https://www.niddk.nih.gov/health-information/diagnostic-tests/urinary-tract-imaging',
  pelvicUs: 'https://www.radiologyinfo.org/en/info/pelvus',
  prostateMr: 'https://www.radiologyinfo.org/en/info/mr_prostate',
  prostateUs: 'https://www.radiologyinfo.org/en/info/us-prostate',
  scrotalUs: 'https://www.radiologyinfo.org/en/info/us-scrotal',
  scrotalMr:
    'https://acsearch.acr.org/list/GetAppendix?PanelName=Urologic&TopicId=304',
  urethra:
    'https://link.springer.com/article/10.1007/s00345-023-04760-x',
  ccBy4: 'https://creativecommons.org/licenses/by/4.0/',
  xray: 'https://www.radiologyinfo.org/en/info/abdominrad',
  glands:
    'https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html',
} as const;
export const pelvicOrganLandmarks: Record<PelvicOrganGroup, string> = {
  bladder:
    'Use the bladder as a pelvic orientation landmark; distinguish its outlet from the paired ureters entering it.',
  prostate:
    'Below the bladder and anterior to the rectum; the proximal male urethra passes through this gland.',
  seminalVesicle:
    'Paired glands posterior to the bladder, distinct from the prostate and ductus deferens. Confirm the selected side.',
  ureter:
    'Trace the selected side from kidney towards bladder across abdominal and pelvic views; do not confuse ureter with urethra.',
  urethra:
    'Follow the bladder outlet inferiorly through the male reference anatomy. This is not a female urethral model.',
  testis:
    'Pelvis is a navigation category here: this gonad belongs in the scrotum, not within the pelvic cavity.',
  epididymis:
    'Distinguish the selected epididymis from the adjacent same-side testis before comparing an image.',
};
export const pelvicOrganLimits: Record<PelvicOrganGroup, string> = {
  bladder:
    'Reference envelope only: no validated wall layers, filling state, urine volume, ureteric jets or detrusor function.',
  prostate:
    'Whole-gland surface only: no separately validated zones, capsule, neurovascular bundles or lesion segmentation.',
  seminalVesicle:
    'External source surface only: no validated internal lumen, complete duct continuity, secretory state or invasion map.',
  ureter:
    'Source tube surface only: no verified lumen, calibre, peristalsis, obstruction or complete urographic opacification.',
  urethra:
    'Single source representation: named urethral segments, sphincters, lumen and tissue fibrosis are not separately validated.',
  testis:
    'Whole-organ reference only: no tubules, intratesticular lesions, vascular waveform or validated perfusion territory.',
  epididymis:
    'Source envelope only: head/body/tail and the coiled duct are not independently segmented or sonographically characterised.',
};
export const pelvicOrganLandmarkReferences: Record<
  PelvicOrganGroup,
  keyof typeof pelvicOrganReferences
> = {
  bladder: 'urinary',
  prostate: 'prostateMr',
  seminalVesicle: 'glands',
  ureter: 'urinary',
  urethra: 'urinary',
  testis: 'scrotalUs',
  epididymis: 'scrotalUs',
};
type Topic = {
  body: string;
  // Two teaching bullets, with an optional third attribution line.
  bullets: [string, string] | [string, string, string];
  references: (keyof typeof pelvicOrganReferences)[];
};
const plainFilm: Topic = {
  body: 'Plain radiographs have limited internal soft-tissue detail. Use this model for regional orientation, not as proof that the selected organ or its internal borders are visible on a film.',
  bullets: [
    'A projection overlaps structures at different depths.',
    'Atlas transparency does not generate calibrated X-ray attenuation.',
  ],
  references: ['xray'],
};
const scrotalCt: Topic = {
  body: 'For a palpable scrotal abnormality, ultrasound is the usual initial examination; CT is not a substitute for dedicated scrotal assessment.',
  bullets: [
    'A pelvic CT may not include the entire scrotum.',
    'Do not infer a normal selected organ from an incomplete field of view.',
  ],
  references: ['scrotalUs', 'ct'],
};
export const pelvicOrganImagingTopics: Record<
  PelvicOrganGroup,
  Record<PelvicOrganModality, Topic>
> = {
  bladder: {
    ct: {
      body: 'CT urography depicts the urinary tract in its surrounding anatomy. Confirm whether the bladder contains excreted contrast before comparing its appearance with a reference surface.',
      bullets: [
        'Contrast within urine is different from tissue enhancement.',
        'The atlas has no calibrated density or contrast phase.',
      ],
      references: ['urography'],
    },
    mri: {
      body: 'MR urography can depict the bladder and upstream urinary tract. Identify the acquired sequence before relating an apparent boundary to this envelope.',
      bullets: [
        'Displayed model colour is not MR signal.',
        'This surface cannot establish wall invasion or normal histology.',
      ],
      references: ['urography'],
    },
    ultrasound: {
      body: 'Transabdominal pelvic ultrasound uses the bladder as an accessible fluid-filled structure. Filling is relevant to the examination and changes the appearance being compared.',
      bullets: [
        'The model has no known distension or post-void state.',
        'An atlas size is not a patient bladder-volume measurement.',
      ],
      references: ['pelvicUs'],
    },
    xray: {
      body: 'A KUB radiograph is not a complete bladder-wall study. Keep plain films distinct from examinations that deliberately opacify the urinary tract.',
      bullets: [
        'Contrast technique must be identified in future linked images.',
        'No contrast study or urine leakage is simulated here.',
      ],
      references: ['xray', 'urinary'],
    },
  },
  prostate: {
    ct: {
      body: 'CT provides pelvic context, but the atlas gland boundary is not a zonal map. Ultrasound and MRI are the commonly used dedicated prostate examinations.',
      bullets: [
        'Separate gland position from lesion characterisation.',
        'This reference gives no patient-specific gland volume.',
      ],
      references: ['ct', 'prostateMr'],
    },
    mri: {
      body: 'Prostate MRI combines anatomical information with diffusion and, in multiparametric studies, perfusion assessment. A surface model cannot reproduce these tissue measurements.',
      bullets: [
        'Compare the gland beneath the bladder and in front of the rectum.',
        'No PI-RADS score or cancer probability is assigned by this atlas.',
      ],
      references: ['prostateMr'],
    },
    ultrasound: {
      body: 'Transrectal ultrasound provides a close acoustic view of the prostate. Probe-based orientation must be identified independently of the atlas camera.',
      bullets: [
        'Selecting the gland does not represent a biopsy target.',
        'A shared organ name is not image-to-model registration.',
      ],
      references: ['prostateUs'],
    },
    xray: plainFilm,
  },
  seminalVesicle: {
    ct: {
      body: 'Identify each seminal vesicle separately from the bladder and prostate when orienting pelvic cross-sections. The selected gland surface does not prove a visible or patent ejaculatory duct.',
      bullets: [
        'Check the selected side before comparison.',
        'An apparently touching model surface is not tissue invasion.',
      ],
      references: ['ct', 'glands'],
    },
    mri: {
      body: 'Use the paired seminal vesicles as neighbouring landmarks when reviewing prostate MRI. Keep whole-gland orientation distinct from assessment of tumour extension.',
      bullets: [
        'No MR signal or restricted diffusion is represented.',
        'This source envelope cannot confirm or exclude invasion.',
      ],
      references: ['prostateMr', 'glands'],
    },
    ultrasound: {
      body: 'Male pelvic ultrasound can evaluate the seminal vesicles as well as the prostate. Distinguish the paired gland from the adjacent urinary bladder.',
      bullets: [
        'A selected surface does not establish internal duct patency.',
        'Do not infer secretory function from the model.',
      ],
      references: ['pelvicUs', 'glands'],
    },
    xray: plainFilm,
  },
  ureter: {
    ct: {
      body: 'CT urography follows the ureters between kidneys and bladder. Relate cross-sections along the same side instead of matching an isolated circular profile by proximity.',
      bullets: [
        'Identify contrast use and acquisition phase.',
        'The atlas does not simulate an opacified lumen.',
      ],
      references: ['urography'],
    },
    mri: {
      body: 'MR urography offers urinary-tract anatomy without an X-ray projection. Sequence and contrast choices affect what is visible; model colour predicts neither.',
      bullets: [
        'Follow the same ureter across adjacent images.',
        'No flow, drainage or obstruction measurement is provided.',
      ],
      references: ['urography'],
    },
    ultrasound: {
      body: 'Urinary ultrasound may provide selected views rather than a continuous picture of a ureter. The model must not be treated as proof that the whole tube is sonographically visible.',
      bullets: [
        'Acoustic access depends on surrounding tissue and bowel gas.',
        'Missing visibility is not itself proof of absent anatomy.',
      ],
      references: ['pelvicUs'],
    },
    xray: {
      body: 'KUB refers to the kidney–ureter–bladder region, not automatic delineation of both ureters. Contrast urography and a plain film are different examinations.',
      bullets: [
        'Do not infer a complete lumen from a regional label.',
        'No calculus or fluoroscopic passage is generated here.',
      ],
      references: ['xray', 'urinary'],
    },
  },
  urethra: {
    ct: {
      body: 'Routine pelvic CT and dedicated urethrography are different examinations. This surface orients the outlet but establishes neither luminal length nor patency.',
      bullets: [
        'Do not equate CT urography with urethrography.',
        'No injury or narrowing is simulated.',
        'Summary adapted from Frankiewicz et al. (2024), CC BY 4.0.',
      ],
      references: ['ct', 'urethra', 'ccBy4'],
    },
    mri: {
      body: 'MR urethrography can supplement luminal assessment with surrounding-tissue detail in selected problems. Interpretation requires acquired images, not this reference surface.',
      bullets: [
        'The atlas does not measure fibrosis or stenosis length.',
        'No routine acquisition recommendation is made here.',
        'Summary adapted from Frankiewicz et al. (2024), CC BY 4.0.',
      ],
      references: ['urethra', 'ccBy4'],
    },
    ultrasound: {
      body: 'Specialised sonourethrography assesses the anterior urethra and surrounding tissue, unlike routine bladder ultrasound. Posterior assessment is more limited and results are operator dependent.',
      bullets: [
        'No distension, stiffness or validated wall layers are modelled.',
        'Summary adapted from Frankiewicz et al. (2024), CC BY 4.0.',
      ],
      references: ['urethra', 'ccBy4'],
    },
    xray: {
      body: 'Retrograde urethrography and voiding cystourethrography depict the urethral passage with contrast, unlike plain radiographs. Projection and positioning can affect apparent stricture length.',
      bullets: [
        'This model does not simulate contrast injection or voiding.',
        'Summary adapted from Frankiewicz et al. (2024), CC BY 4.0.',
      ],
      references: ['urethra', 'ccBy4'],
    },
  },
  testis: {
    ct: scrotalCt,
    mri: {
      body: 'MRI may be a problem-solving examination for a palpable scrotal abnormality. It does not replace initial ultrasound merely because it offers more sequences.',
      bullets: [
        'Confirm that the acquired examination includes the selected testis.',
        'No intratesticular signal or enhancement is modelled.',
      ],
      references: ['scrotalMr'],
    },
    ultrasound: {
      body: 'Scrotal ultrasound distinguishes an abnormality within the testis from one outside it. Doppler adds blood-flow information to the greyscale examination.',
      bullets: [
        'Compare with the opposite testis using acquired images.',
        'A coloured mesh is not a Doppler perfusion map.',
      ],
      references: ['scrotalUs'],
    },
    xray: plainFilm,
  },
  epididymis: {
    ct: scrotalCt,
    mri: {
      body: 'If scrotal MRI is obtained for problem solving, distinguish an extratesticular epididymal finding from the adjacent testis. This surface cannot supply tissue characterisation.',
      bullets: [
        'A separate mesh is not evidence of a separate lesion.',
        'No independently verified head, body or tail is provided.',
      ],
      references: ['scrotalMr'],
    },
    ultrasound: {
      body: 'The epididymis is evaluated alongside the testis on scrotal ultrasound. Location and Doppler findings complement greyscale appearance.',
      bullets: [
        'Keep epididymal findings distinct from intratesticular findings.',
        'No cyst, inflammation or measured hyperaemia is simulated.',
      ],
      references: ['scrotalUs'],
    },
    xray: plainFilm,
  },
};
