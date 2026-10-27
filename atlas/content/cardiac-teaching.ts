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
  cardiacRightHeart2025: {
    title: 'Mukherjee et al. / ASE · Right heart assessment (2025), Tables 2–3 and focused views',
    url: 'https://www.asecho.org/wp-content/uploads/2026/08/ASE-Right-Heart-Guidelines-May-2025.pdf',
    scopedToConcept: true,
  },
};

type ChamberTeaching = {
  clinical: NestedSection;
  pathology: NestedSection;
  imaging: Partial<Record<NestedImagingTopic, NestedSection>>;
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
        'Four-chamber cine relates both atria and ventricles across atrioventricular junctions. RV vertical long-axis follows tricuspid inflow; identify the right atrium by connections, not screen position. Static cavity: no cine, valve detail, phase matching, function metrics or registration; cuts are arbitrary, not prescribed MRI planes.',
        'cardiacMR',
      ),
      ultrasound: draft(
        'An RA-focused apical view shows the whole chamber. An area contour follows endocardium between the lateral and septal tricuspid annulus, excluding the IVC, SVC and appendage. Use these as image-reading landmarks, not separate boundaries invented in this cavity model. The static surface provides no acquired ultrasound or functional measurement.',
        'cardiacEcho',
        'cardiacRightHeart2025',
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
        'LV two-chamber passes through the apex and mitral centre; four-chamber adds right-sided chambers. Follow the left atrium into the LV across the mitral plane. Static cavity: no cine, valve detail, phase matching, function metrics or registration; cuts are arbitrary, not prescribed MRI planes.',
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
        'Review RV inflow and separate sagittal or oblique outflow through the pulmonary valve. A covering short-axis or transaxial cine stack assesses the whole RV beyond one plane. Static cavity: no cine, valve detail, phase matching, function metrics or registration; cuts are arbitrary, not prescribed MRI planes.',
        'cardiacMR',
      ),
      ultrasound: draft(
        'In an RV-focused four-chamber view, avoid foreshortening and show the free wall and apex throughout the cycle. Fractional area change omits outflow tract contribution; TAPSE tracks longitudinal annular motion and needs other indices for global function. This static cavity supplies neither acquired ultrasound nor those measurements.',
        'cardiacEcho',
        'cardiacRightHeart2025',
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
        'Apex and mitral centre orient the LV long axis. Short-axis runs perpendicular from base to apex; three-chamber includes LV outflow and aortic valve. Static cavity: no cine, valve detail, phase matching, function metrics or registration; cuts are arbitrary, not prescribed MRI planes.',
        'cardiacMR',
      ),
      ultrasound: draft(
        'Apical four- and two-chamber views support biplane LV volume assessment at end-diastole and end-systole. Foreshortening can distort the result. The atlas provides neither phase-specific contours nor ejection fraction; a cut through its cavity is not an ultrasound acquisition.',
        'cardiacEcho',
      ),
    },
  },
} satisfies Record<string, ChamberTeaching>;
