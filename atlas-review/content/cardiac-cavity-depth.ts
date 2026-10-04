import type { NestedSection } from './nested-teaching';

// Original cavity-only teaching. References support the normal anatomy and
// physiology described here; their figures and media are not imported.
export const cardiacCavityDepthReferences = {
  cardiacCavityBloodFlow: {
    scopedToConcept: true,
    title: 'NHLBI · How blood flows through the heart',
    url: 'https://www.nhlbi.nih.gov/health/heart/blood-flow',
  },
  cardiacCavityHeartbeat: {
    scopedToConcept: true,
    title: 'NHLBI · How the heart beats',
    url: 'https://www.nhlbi.nih.gov/health/heart/heart-beats',
  },
  cardiacCavityRightAtrialWall: {
    scopedToConcept: true,
    title: 'University of Minnesota · Right atrial lateral wall',
    url: 'https://www.vhlab.umn.edu/atlas/right-atrium/lateral-wall/index.shtml',
  },
  cardiacCavityLeftAtrium: {
    scopedToConcept: true,
    title: 'University of Minnesota · Left atrium',
    url: 'https://www.vhlab.umn.edu/atlas/left-atrium/index.shtml',
  },
  cardiacCavityPulmonaryVeinOstia: {
    scopedToConcept: true,
    title: 'University of Minnesota · Pulmonary vein ostia',
    url: 'https://www.vhlab.umn.edu/atlas/left-atrium/pulmonary-vein-ostia/index.shtml',
  },
  cardiacCavityRightVentricularOutflow: {
    scopedToConcept: true,
    title: 'University of Minnesota · Right ventricular outflow tract',
    url: 'https://www.vhlab.umn.edu/atlas/right-ventricle/rvot-right-ventricle-outflow-tract/index.shtml',
  },
  cardiacCavityRightVentricle: {
    scopedToConcept: true,
    title: 'University of Minnesota · Right ventricle',
    url: 'https://www.vhlab.umn.edu/atlas/right-ventricle/index.shtml',
  },
  cardiacCavityLeftVentricle: {
    scopedToConcept: true,
    title: 'University of Minnesota · Left ventricle',
    url: 'https://www.vhlab.umn.edu/atlas/left-ventricle/index.shtml',
  },
};

const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

type CavityDepth = { anatomy: NestedSection; function: NestedSection };

export const cardiacCavityDepthSections = {
  'cardiac-right-atrium': {
    anatomy: draft(
      'The right atrium is the upper receiving chamber on the right side of the heart, above the right ventricle and across the interatrial septum from the left atrium. The superior and inferior venae cavae bring systemic venous blood here. Normal right atrial anatomy includes smooth and pectinate wall regions. This selection represents cavity space only: it does not identify individual venous openings, wall regions, septal tissue, the appendage or tricuspid valve leaflets.',
      'cardiacChambers', 'cardiacCavityRightAtrialWall',
    ),
    function: draft(
      'The right atrium receives blood returning from the body and passes it toward the right ventricle through the tricuspid valve. Blood enters the ventricle during filling, and atrial contraction contributes to that filling. This describes normal circulation, not an observed event in the model. A static cavity cannot show the blood moving, the valve opening, pressure changes or the timing and strength of atrial contraction.',
      'cardiacCavityHeartbeat', 'cardiacCavityBloodFlow',
    ),
  },
  'cardiac-left-atrium': {
    anatomy: draft(
      'The left atrium lies above the left ventricle at the posterior side of the heart, opposite the right atrium across the interatrial septum. Pulmonary veins normally enter its posterior wall, and the mitral valve lies along the route into the left ventricle. The selected object represents the atrial cavity, not every structure at its boundary. It cannot distinguish individual pulmonary vein openings, the appendage, septal tissue, atrial wall details or mitral leaflets. Those are reference-anatomy landmarks for orientation only.',
      'cardiacCavityLeftAtrium', 'cardiacCavityPulmonaryVeinOstia',
    ),
    function: draft(
      'After blood gains oxygen in the lungs, pulmonary veins return it to the left atrium. The atrium receives that blood and passes it through the mitral valve to the left ventricle during filling. This sequence explains normal physiology; it is not a flow simulation or a captured cardiac phase. The displayed cavity cannot establish a particular venous connection, valve motion, chamber pressure, changing volume or how much filling occurred.',
      'cardiacCavityLeftAtrium', 'cardiacCavityPulmonaryVeinOstia',
    ),
  },
  'cardiac-right-ventricle': {
    anatomy: draft(
      'The right ventricle lies below the right atrium and anterior to the left ventricle, with the interventricular septum between them. In normal anatomy its route extends from the tricuspid valve region toward the pulmonary valve; the outlet includes the infundibulum and runs anteriorly and superiorly. This selection is the cavity space, not a mapped inlet or outlet. It does not establish a continuous vessel lumen or identify septal tissue, trabeculae, papillary muscles, ventricular wall or valve leaflets.',
      'cardiacChambers', 'cardiacCavityRightVentricle', 'cardiacCavityRightVentricularOutflow',
    ),
    function: draft(
      'The right ventricle receives blood from the right atrium through the tricuspid valve during ventricular relaxation. During contraction, it pumps blood through the pulmonary valve into the pulmonary artery and onward to the lungs, where gas exchange occurs before blood returns to the left atrium. This is a conceptual route through normal circulation. The static cavity cannot display valve motion, contraction, pressure, flow direction or a measured chamber volume; it also does not establish an open connection to the pulmonary artery.',
      'cardiacCavityBloodFlow',
    ),
  },
  'cardiac-left-ventricle': {
    anatomy: draft(
      'The left ventricle lies below the left atrium, posterior and lateral to the right ventricle, and contributes to the cardiac apex. The interventricular septum separates the ventricular chambers. In normal anatomy blood enters near the mitral valve and leaves through the aortic valve toward the aorta. This selection shows the space within the chamber rather than its muscular wall. It does not delineate septal tissue, wall thickness, trabeculae, papillary muscles, valve leaflets or a continuous open aortic outlet.',
      'cardiacCavityLeftVentricle',
    ),
    function: draft(
      'The left ventricle receives blood from the left atrium through the mitral valve during filling. During contraction, it ejects blood through the aortic valve into the aorta for distribution around the body. These are normal physiological roles, not motions measured in this model. The cavity surface alone cannot establish contractility, valve competence, wall thickness, stroke volume, ejection fraction or a particular phase of the cardiac cycle.',
      'cardiacCavityHeartbeat', 'cardiacCavityLeftVentricle',
    ),
  },
} satisfies Record<
  | 'cardiac-right-atrium'
  | 'cardiac-left-atrium'
  | 'cardiac-right-ventricle'
  | 'cardiac-left-ventricle',
  CavityDepth
>;
