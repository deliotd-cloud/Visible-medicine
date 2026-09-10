import type { NestedImagingTopic, NestedSection } from './nested-teaching';

// Original short teaching drafts. References support facts, not a licence to
// copy their figures, a patient correspondence, or clinical approval.
export const cardiacTeachingReferences = {
  cardiacTricuspid: {
    title: 'AHA · Tricuspid valve regurgitation',
    url: 'https://www.heart.org/en/health-topics/heart-valve-problems-and-disease/heart-valve-problems-and-causes/problem-tricuspid-valve-regurgitation',
  },
  cardiacPulmonaryPressure: {
    title: 'NHLBI · Pulmonary hypertension',
    url: 'https://www.nhlbi.nih.gov/health/pulmonary-hypertension',
  },
  cardiacAtrialRhythm: {
    title: 'NHLBI · Atrial fibrillation',
    url: 'https://www.nhlbi.nih.gov/health/atrial-fibrillation',
  },
  cardiacFailure: {
    title: 'NHLBI · Heart failure diagnosis',
    url: 'https://www.nhlbi.nih.gov/health/heart-failure/diagnosis',
  },
  cardiacCT: {
    title: 'ACR / RSNA RadiologyInfo · Coronary CTA',
    url: 'https://www.radiologyinfo.org/en/info/angiocoroct',
  },
  cardiacMR: {
    title: 'Kramer et al. / SCMR · CMR protocols (2020), pp. 5–7',
    url: 'https://jcmr-online.biomedcentral.com/counter/pdf/10.1186/s12968-020-00607-1.pdf',
  },
  cardiacEcho: {
    title: 'Mitchell et al. / ASE · Comprehensive adult TTE (2019)',
    url: 'https://www.asecho.org/wp-content/uploads/2019/01/2019_Comprehensive-TTE.pdf',
  },
};

type ChamberTeaching = {
  clinical: NestedSection;
  pathology: NestedSection;
  imaging: Record<NestedImagingTopic, NestedSection>;
};
const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

export const cardiacTeaching = {
  'right-atrium': {
    clinical: draft(
      'Use the right atrium to understand venous congestion: leakage through the tricuspid valve sends blood back into this receiving chamber during ventricular contraction. Clinical assessment combines symptoms, examination and cardiac testing; the displayed cavity cannot establish pressure or regurgitation severity.',
      'cardiacTricuspid',
    ),
    pathology: draft(
      'Tricuspid regurgitation can increase right atrial volume and enlarge the chamber. It often accompanies right ventricular enlargement. Peripheral swelling or abdominal congestion may occur, but neither those findings nor the source cavity alone identifies the cause. No diseased valve is modelled here.',
      'cardiacTricuspid',
    ),
    imaging: {
      ct: draft(
        'For a future CT comparison, follow systemic venous return towards the right atrium across multiple planes. Coronary CTA uses intravenous iodine contrast; this cavity is an orientation aid, not a CT finding.',
        'cardiacCT',
        'cardiacFlow',
      ),
      mri: draft(
        'In a four-chamber cine view, distinguish the right atrial blood pool from the right ventricle across the tricuspid plane. Cine frames show motion; rotating this static cavity does not. The model has no valve leaflet or cardiac-phase information.',
        'cardiacMR',
      ),
      ultrasound: draft(
        'An apical four-chamber view places the right atrium beside the right ventricle and the left-sided chambers. Compare their relationships, not apparent screen sizes. Echo provides moving tissue and valve information that this isolated source cavity lacks.',
        'cardiacEcho',
      ),
    },
  },
  'left-atrium': {
    clinical: draft(
      'Atrial fibrillation disrupts coordinated atrial and ventricular activity. Use the left atrium as an anatomical starting point for learning about filling and rhythm, not as an electrical map. Symptoms can be absent; a static chamber shape cannot diagnose an arrhythmia.',
      'cardiacAtrialRhythm',
    ),
    pathology: draft(
      'During atrial fibrillation, ineffective atrial emptying can allow blood to pool and clots to form, increasing stroke risk. This is a functional and clinical problem, not a conclusion from the displayed cavity. No thrombus, appendage-specific segmentation or electrical activity is shown.',
      'cardiacAtrialRhythm',
    ),
    imaging: {
      ct: draft(
        'For a future CT comparison, follow pulmonary venous return towards the left atrium using multiplanar images. Identify the receiving chamber before comparing its shape. This model supplies no contrast-enhancement information or thrombus assessment.',
        'cardiacCT',
        'cardiacFlow',
      ),
      mri: draft(
        'Two- and four-chamber long-axis views show the left atrium in relation to the mitral plane and left ventricle. Compare the same phase when studying cine images. The atlas has no phase-matched images or measured atrial volume.',
        'cardiacMR',
      ),
      ultrasound: draft(
        'Dedicated apical four- and two-chamber views help assess the left atrium. For atrial volume tracing, pulmonary veins and the appendage are excluded. That measurement boundary is not supplied by this model; its source surface must not substitute for an echocardiographic contour.',
        'cardiacEcho',
      ),
    },
  },
  'right-ventricle': {
    clinical: draft(
      'Pulmonary hypertension increases the work needed to pump blood through the lungs. Relate this load to the right ventricle and pulmonary circulation. Breathlessness or fatigue requires clinical evaluation; neither a cavity outline nor a vessel colour measures pulmonary pressure.',
      'cardiacPulmonaryPressure',
    ),
    pathology: draft(
      'Persistently raised pressure in the lung circulation can damage the heart. Pulmonary hypertension has several causes, including heart disease, lung disease and vascular obstruction. The displayed right ventricular cavity cannot distinguish these causes, demonstrate pressure overload or diagnose a pulmonary embolus.',
      'cardiacPulmonaryPressure',
    ),
    imaging: {
      ct: draft(
        'For a future CT comparison, distinguish the right ventricle from the pulmonary arteries it supplies. Multiplanar review provides more context than one image. This static cavity cannot show contraction or establish pulmonary arterial pressure.',
        'cardiacCT',
        'cardiacFlow',
      ),
      mri: draft(
        'RV cine assessment uses inflow and outflow views alongside a covering short-axis or transaxial stack. The outflow view is distinct from the four-chamber view. This cavity is not a cine stack and cannot supply ventricular function or outflow measurements.',
        'cardiacMR',
      ),
      ultrasound: draft(
        'An RV-focused apical four-chamber view is adjusted to display the right ventricle fully; a routine four-chamber view is not interchangeable for every measurement. Compare the chamber relationships here, while leaving functional assessment to a complete echocardiographic examination.',
        'cardiacEcho',
      ),
    },
  },
  'left-ventricle': {
    clinical: draft(
      'Ejection fraction describes the proportion of left ventricular blood expelled per beat. It requires cardiac imaging across the cycle, not a static cavity. Heart failure assessment also considers symptoms, examination and other tests; an apparently preserved ejection fraction does not by itself exclude heart failure.',
      'cardiacFailure',
    ),
    pathology: draft(
      'Heart failure may involve reduced ejection or impaired filling despite a preserved ejection fraction. These patterns need clinical and imaging assessment rather than classification by one chamber shape. No myocardial dysfunction, filling pressure or disease-specific geometry is represented here.',
      'cardiacFailure',
    ),
    imaging: {
      ct: draft(
        'For a future CT comparison, relate the left ventricle to the aorta it supplies. Multiplanar images help establish orientation. Coronary CTA evaluates coronary arteries; this cavity alone is neither a coronary study nor an ejection-fraction measurement.',
        'cardiacCT',
        'cardiacFlow',
      ),
      mri: draft(
        'LV cine assessment combines long-axis views with a short-axis stack covering base to apex. The three-chamber view includes the outflow towards the aortic valve. Atlas cut planes are arbitrary display cuts, not these prescribed cardiac MRI views.',
        'cardiacMR',
      ),
      ultrasound: draft(
        'Apical four- and two-chamber views support biplane LV volume assessment at end-diastole and end-systole. Foreshortening can distort the result. The atlas provides neither phase-specific contours nor ejection fraction; a cut through its cavity is not an ultrasound acquisition.',
        'cardiacEcho',
      ),
    },
  },
} satisfies Record<string, ChamberTeaching>;
