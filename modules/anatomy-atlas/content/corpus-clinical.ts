// Original adapted teaching text only; no publication image, table or patient data.
export const corpusClinicalReferences = [
  'https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html',
  'https://doi.org/10.3390/jcm12041495',
  'https://creativecommons.org/licenses/by/4.0/',
] as const;

const credit = 'Sources: National Cancer Institute, SEER Training Modules: Penis; Patel AB et al., Urethral Injuries: Diagnostic and Management Strategies for Critical Care and Trauma Clinicians, J Clin Med 2023;12:1495. Original adapted summary of Patel et al. (CC BY 4.0); no endorsement implied.';

export const corpusClinicalTopics = {
  clinical: {
    title: 'Urethral relationship & clinical assessment',
    body: 'Study this ventral erectile column alongside the separately selectable urethra: the spongy urethra lies within the corpus spongiosum in typical anatomy. After genital or perineal trauma, bleeding at the urethral opening or difficulty passing urine warrants prompt clinical assessment; the appearance of an atlas surface cannot confirm or exclude injury.',
    bullets: [
      'The paired corpora cavernosa are different erectile columns. They and the distal glans are not independently represented in this bulb/shaft selection.',
      'Source proximity does not prove an enclosed, continuous or patent urethral lumen. This is orientation teaching, not an examination finding, device route or treatment plan.',
      credit,
    ],
  },
  pathology: {
    title: 'Anterior urethral injury & later narrowing',
    body: 'Blunt straddle trauma can injure the bulbar urethra and adjacent spongiosal tissue. Urethral injury may be followed by scar-related narrowing. This anterior injury context is distinct from posterior urethral disruption associated with pelvic fractures.',
    bullets: [
      'Neither separation nor clipping of this reference surface depicts a tear, haematoma or fibrosis; no pathological tissue or patient scan is included.',
      'This partial model cannot establish injury extent, urethral calibre or sexual or urinary function. The lesson supplies no injury grade, catheter instructions or procedural recommendation.',
      credit,
    ],
  },
} as const;
