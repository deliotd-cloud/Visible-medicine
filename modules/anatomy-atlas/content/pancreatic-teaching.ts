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
  pancreaticImagingDiagnosis: {
    title: 'NIDDK · Diagnosis of pancreatitis: imaging tests',
    url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis/diagnosis',
  },
  pancreaticMRCP: {
    title: 'ACR / RSNA · MR cholangiopancreatography (MRCP)',
    url: 'https://www.radiologyinfo.org/en/info/mrcp',
  },
  pancreaticUltrasoundWindow: {
    title: 'ACR / RSNA · Abdominal ultrasound: limitations',
    url: 'https://www.radiologyinfo.org/en/info/abdominus',
  },
};
const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
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
    imaging: {
      ct: draft(
        'CT examines the pancreas alongside the gallbladder and bile ducts and can reveal pancreatitis or pancreatic cancer. When studying an approved CT examination, relate the duct course to the surrounding organ rather than treating an isolated tube as the whole assessment. These source surfaces contain no CT attenuation, enhancement, calcification or patient-specific disease findings.',
        'pancreaticImagingDiagnosis',
      ),
      mri: draft(
        'MRCP is an MRI technique that examines the pancreatic and biliary ducts without X-rays and can investigate causes of pancreatitis. Distinguish it from ERCP, which combines endoscopy, injected iodinated contrast and X-ray imaging. Use the selected duct sources for orientation only: neither source colour nor apparent surface contact demonstrates an MR signal, duct communication or an individual branching variant.',
        'pancreaticMRCP',
      ),
      ultrasound: draft(
        'Abdominal ultrasound can identify gallstones when investigating pancreatitis. Overlying bowel gas can obscure deeper organs and limit the available acoustic window. An unobstructed 3D view therefore does not mean the same duct is visible on an ultrasound examination. These static surfaces contain no sonographic texture, measured duct calibre or probe position, and are not an endoscopic ultrasound study.',
        'pancreaticImagingDiagnosis',
        'pancreaticUltrasoundWindow',
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
