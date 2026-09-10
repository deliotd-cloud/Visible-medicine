import type { NestedConcept, NestedSection } from './nested-teaching';

export const pancreaticTeachingReferences = {
  pancreaticDuctAnatomy: {
    title: 'NCI SEER · Anatomy of the pancreas and duodenum',
    url: 'https://training.seer.cancer.gov/biliary/anatomy/',
  },
  pancreaticDuctInflammation: {
    title: 'NIDDK · Definition and facts for pancreatitis',
    url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis/definition-facts',
  },
};
const draft = (body: string, reference: string): NestedSection => ({
  body,
  references: [reference],
  readiness: 'draft',
});
export const pancreaticConcepts: NestedConcept[] = [
  {
    id: 'pancreatic-ductal-system',
    study: 'pancreatic',
    fmaIds: ['FMA10419', 'FMA63103'],
    sections: {
      anatomy: draft(
        'The pancreatic duct opens into the duodenum. The pancreas is closely related to the stomach, duodenum, spleen and major abdominal vessels.',
        'pancreaticDuctAnatomy',
      ),
      function: draft(
        'Pancreatic juices support digestion: this is the exocrine function. Hormone production, including insulin, is a separate endocrine function.',
        'pancreaticDuctAnatomy',
      ),
      clinical: draft(
        'Pancreatitis can be complicated by pancreatic duct narrowing, blockage or leakage. A surface model cannot establish duct patency or diagnose these complications.',
        'pancreaticDuctInflammation',
      ),
      pathology: draft(
        'Pancreatitis means inflammation of the pancreas. These are source anatomy surfaces, not examples of inflammation, obstruction or a patient-specific abnormality.',
        'pancreaticDuctInflammation',
      ),
    },
    modelLimit:
      'Two source selections illustrate a ductal system, not two complete independent duct trees. The duct-tree selection uses the singleton IS-A source; the PART-OF group includes that component and the pancreatic duct. No accessory duct, patent lumen, junction, papillary opening or image correspondence is validated. One optional envelope is orientation only; the near-coincident parenchymal alternative is not displayed.',
    quiz: {
      question:
        'Which pancreatic function produces digestive juices: exocrine or endocrine?',
      answer:
        'Exocrine. Endocrine function produces hormones, including insulin.',
      references: ['pancreaticDuctAnatomy'],
      basis: 'primary-reference',
    },
  },
];
