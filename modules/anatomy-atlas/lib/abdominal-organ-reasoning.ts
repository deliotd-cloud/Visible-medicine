import type { ReasoningConcept } from './reasoning-questions';

const viscera = { title: 'Texas Tech: abdominal viscera', url: 'https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html' };
const uams = { title: 'UAMS: abdominal visceral structures', url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/viscera-tables/visceral-structures-of-the-abdomen/' };
const bowel = { title: 'OpenStax: small and large intestines', url: 'https://openstax.org/books/anatomy-and-physiology/pages/23-5-the-small-and-large-intestines' };
const one = (fma: string, file: string) => [{ fma, file, side: 'unpaired' as const }];
type Draft = Omit<ReasoningConcept, 'region' | 'sourceTissue' | 'readiness' | 'revision'>;

// Original relationship questions about exact supplied organs, not copied questions,
// joined lumens, pathological meshes or a registered patient examination.
export const abdominalOrganReasoningConcepts: readonly ReasoningConcept[] = ([
  {
    key: 'abdominal-stomach', sourceTree: 'partof', bindings: one('FMA7148', 'FJ2564'),
    prompt: 'Which supplied organ receives the oesophagus at its cardia and continues through the pylorus towards the duodenum?',
    explanation: 'These proximal and distal relationships identify the stomach. The reference surface does not demonstrate a functioning sphincter, gastric emptying or an acquired endoscopic lumen.',
    distractors: ['abdominal-gallbladder', 'abdominal-spleen', 'abdominal-appendix'], references: [viscera],
  },
  {
    key: 'abdominal-gallbladder', sourceTree: 'partof', bindings: one('FMA7202', 'FJ2817'),
    prompt: 'Which structure is the bile reservoir beneath the liver, rather than a duct carrying bile between structures?',
    explanation: 'The gallbladder stores and concentrates bile. Its connection uses the cystic duct; the common hepatic duct is a conduit, not the reservoir. This surface does not establish luminal patency or gallstones.',
    distractors: ['abdominal-cystic-duct', 'abdominal-common-hepatic-duct', 'abdominal-stomach'], references: [viscera],
  },
  {
    key: 'abdominal-spleen', bindings: one('FMA7196', 'FJ2561'),
    prompt: 'Which left upper abdominal lymphatic organ relates to the stomach through the gastrosplenic ligament, rather than forming part of the alimentary lumen?',
    explanation: 'The spleen is a lymphatic organ beside the stomach. The ligament relationship is taught here, not supplied as a new selectable ligament or evidence of a patient-specific tissue plane.',
    distractors: ['abdominal-stomach', 'abdominal-appendix', 'abdominal-gallbladder'], references: [uams],
  },
  {
    key: 'abdominal-cystic-duct', bindings: one('FMA14539', 'FJ3080'),
    prompt: 'Which duct connects the gallbladder to the hepatic duct pathway and normally allows both filling and emptying of the gallbladder?',
    explanation: 'The cystic duct provides that connection. Its union with the common hepatic duct forms the common bile duct in the usual pattern; the model does not validate that junction or depict every variant.',
    distractors: ['abdominal-common-hepatic-duct', 'abdominal-gallbladder', 'abdominal-ileocecal-junction'], references: [viscera],
  },
  {
    key: 'abdominal-common-hepatic-duct', bindings: one('FMA14668', 'FJ3079'),
    prompt: 'Which named duct is formed by the usual union of the right and left hepatic ducts, before it meets the cystic duct?',
    explanation: 'This is the common hepatic duct, not the common bile duct downstream of the cystic junction. The distinction is anatomical teaching, not an operative map or proof of continuity in this reference mesh.',
    distractors: ['abdominal-cystic-duct', 'abdominal-gallbladder', 'abdominal-ileocecal-junction'], references: [viscera],
  },
  {
    key: 'abdominal-ileocecal-junction', bindings: one('FMA11338', 'FJ2599'),
    prompt: 'Which supplied junction marks passage from the terminal small intestine into the caecum, rather than the attachment of a blind-ending appendage?',
    explanation: 'The ileocecal junction links ileum and caecum. The appendix opens separately into the caecum. A labelled junction surface is not a measurement of valve competence or a bowel obstruction.',
    distractors: ['abdominal-appendix', 'abdominal-stomach', 'abdominal-cystic-duct'], references: [bowel],
  },
  {
    key: 'abdominal-appendix', sourceRegions: ['abdomen', 'pelvis'], bindings: one('FMA14542', 'FJ2565'),
    prompt: 'Which blind-ending structure attaches to the caecum but is not the route by which ileal contents enter the large intestine?',
    explanation: 'The vermiform appendix has a caecal attachment, unlike the ileocecal transit junction. Its position is variable; one reference surface cannot establish the location or appearance of appendicitis in a patient.',
    distractors: ['abdominal-ileocecal-junction', 'abdominal-gallbladder', 'abdominal-stomach'], references: [uams],
  },
] satisfies Draft[]).map(concept => ({ ...concept, region: 'abdomen', sourceTissue: 'organ', readiness: 'draft', revision: 1 }));
