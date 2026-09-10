import type { NestedConcept, NestedSection } from './nested-teaching';

// Reuse existing abdominal-table keys; one source must have one word budget.
const renalArteries = 'hepaticArteries';
const renalVeins = 'hepaticVeins';
const draft = (body: string, reference: string): NestedSection => ({
  body,
  references: [reference],
  readiness: 'draft',
});
const pending: NestedSection = {
  body: 'Structure-specific pathology teaching has not yet been reviewed for this vascular group. The source surface cannot establish disease, patency or a diagnostic measurement.',
  references: [],
  readiness: 'pending',
};
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
      pathology: pending,
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
      pathology: pending,
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
      pathology: pending,
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
      pathology: pending,
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
