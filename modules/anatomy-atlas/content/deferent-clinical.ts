// Original introductory teaching. Reading links do not license third-party images.
export const deferentClinicalReferences = {
  anatomy: 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html',
  clinical: 'https://medlineplus.gov/genetics/condition/congenital-bilateral-absence-of-the-vas-deferens/',
  obstruction: 'https://www.nichd.nih.gov/health/topics/vasectomy/conditioninfo',
} as const;

type Reference = keyof typeof deferentClinicalReferences;
type Topic = {
  title: string;
  body: string;
  bullets: string[];
  references: Reference[];
};

export const deferentClinicalTopics: Record<'clinical' | 'pathology', Topic> = {
  clinical: {
    title: 'Clinical localisation and sperm transport',
    body: 'The deferent duct carries sperm from the epididymal tail through the inguinal canal into the pelvis. Behind the bladder, its terminal portion joins the seminal-vesicle duct to form the ejaculatory duct. Distinguish this transport pathway from sperm production in the testis.',
    bullets: [
      'Use the selected side to orient the inguinal, pelvic-wall and posterior-bladder segments. The vas crosses over the ureter before approaching the seminal-vesicle region.',
      'Vasectomy illustrates interruption of the sperm-transport route, not removal of the testis. This atlas does not depict an operated duct or confirm any contraceptive outcome.',
      'A displayed surface or apparently touching endpoints does not establish an open lumen, complete anatomical continuity or normal sperm transport.',
      'Source: National Cancer Institute (NCI), SEER Training Modules: Duct System. Transport context courtesy of the Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD).',
    ],
    references: ['anatomy', 'obstruction'],
  },
  pathology: {
    title: 'Congenital absence and interruption of transport',
    body: 'In congenital bilateral absence of the vas deferens, the ducts do not develop normally. Sperm transport is impaired even though the testes may otherwise function normally. CFTR variants are associated with many cases; the condition may occur without the usual respiratory or digestive features of cystic fibrosis.',
    bullets: [
      'Distinguish congenital absence from acquired interruption of a previously formed duct, as in vasectomy. The normal reference surfaces here simulate neither condition.',
      'A structure hidden by a layer switch, absent from a source dataset or not seen in one imaging view is not evidence of congenital absence. The paired normal model cannot establish genetic status or fertility in an individual.',
      'Source: MedlinePlus, National Library of Medicine. Transport context courtesy of the Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD). This is an original introductory summary, not a genetic-testing or treatment recommendation.',
    ],
    references: ['clinical', 'obstruction'],
  },
};
