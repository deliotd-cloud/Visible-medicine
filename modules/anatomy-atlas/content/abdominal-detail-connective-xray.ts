// Original teaching; citations provide reading context, not reusable media.
const wall='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/topographical-anatomy-tables/topographical-anatomy-of-the-abdomen/';
const peritoneum='https://anatomy.ttuhscep.edu/schemes/peritoneum_ans.html';
const radiograph='https://www.radiologyinfo.org/en/info/abdominrad';
const contrast='https://www.radiologyinfo.org/en/info/safety-';

export const abdominalDetailConnectiveXrayTopics={
  'linea-alba':{
    title:'Anterior abdominal wall · plain-film limits',
    body:'The linea alba is the midline aponeurotic band between the two rectus regions, extending from the xiphoid toward the pubic symphysis. Use it to orient the assembled anterior wall, not as a directly delineated strip on a plain abdominal radiograph.',
    bullets:[
      'The retained fascia surface is a reference selection, not a measurement of fascial thickness, rectus separation or the integrity of a patient abdominal wall.',
      'A projected soft-tissue outline does not establish a hernia or an exact attachment. A separately acquired CT, MRI or ultrasound examination would need its own image-based assessment.',
    ],citations:[wall,radiograph],
  },
  'mesentery-of-small-intestine':{
    title:'Small-intestinal mesentery · bowel projection limits',
    body:'The small-intestinal mesentery connects the jejunum and ileum with the posterior abdominal wall and carries their vessels and nerves. Keep the supporting membrane distinct from the bowel loops it supports.',
    bullets:[
      'Contrast X-ray examinations can outline bowel lumen. An opacified loop does not directly delineate the mesenteric membrane, its two leaves or its complete attachment.',
      'Compare this source surface with the separately selected mesenteric vessels in assembled anatomy. Surface overlap cannot verify vascular continuity, a mesenteric root or a patient-specific fascial plane.',
    ],citations:[peritoneum,radiograph,contrast],
  },
  'mesoappendix':{
    title:'Mesoappendix · appendix and supporting fold',
    body:'The mesoappendix is a peritoneal fold associated with the appendix and its blood supply, including the appendicular artery. The fold and the artery are separate anatomical selections; neither substitutes for the appendiceal lumen.',
    bullets:[
      'A contrast bowel examination, even if the appendix is opacified, does not directly show this supporting membrane. Do not infer inflammation from the appearance or separation of the reference surface.',
      'The retained source identity has unspecified laterality. Compare the fold with the appendix and caecal region without treating a rotated screen position as an acquired patient-side marker.',
    ],citations:[peritoneum,radiograph,contrast],
  },
  'transverse-mesocolon':{
    title:'Transverse mesocolon · colon and supporting fold',
    body:'The transverse mesocolon supports the transverse colon from the posterior abdominal wall and separates supracolic from infracolic compartments. Its membrane is different from the colon wall and lumen.',
    bullets:[
      'Contrast X-ray imaging may outline the bowel lumen; it does not directly delineate the complete transverse mesocolon. An apparent colon position does not certify a patient mesenteric attachment.',
      'Compare the separately selected middle colic vessels with this fold, while retaining their distinct identities. The source membrane does not define an operative plane or a complete peritoneal compartment.',
    ],citations:[peritoneum,radiograph,contrast],
  },
} as const;
