// Original factual teaching. References are reading links, not media licences.
const arteries='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
const veins='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-abdomen/';
const angiography='https://www.radiologyinfo.org/en/info/angiocath';
const venography='https://www.radiologyinfo.org/en/info/venography';
const mesenteric='https://anatomy.ttuhscep.edu/schemes/peritoneum_ans.html';
const wallVeins='https://anatomy.ttuhscep.edu/schemes/abdo_wall_ing_questions/abdo_wall_12_feedback.html';
const wallStudy='https://pmc.ncbi.nlm.nih.gov/articles/PMC3830133/';
const pancreaticStudy='https://pmc.ncbi.nlm.nih.gov/articles/PMC8922185/';

export const abdominalDetailVascularXrayTopics={
  'appendicular-artery':{
    title:'Appendicular artery · contrast X-ray orientation',
    body:'If an acquired mesenteric angiogram demonstrates an appendicular artery, follow the opacified vessel toward the appendix and identify its observed origin. It may arise through an ileocolic or caecal pathway; the name does not fix one parent branch.',
    bullets:[
      'Compare the demonstrated vessel with the terminal ileum and caecal arterial branches. The retained FMA14818 selection has unspecified laterality and does not supply a patient-side marker.',
      'Do not use its projected overlap with an ileocolic branch to assert a junction or a complete appendiceal supply.',
    ],citations:[arteries,angiography],
  },
  'ascending-branch-of-inferior-branch-of-ileocolic-artery':{
    title:'Source-labelled ileocolic ascending branch · contrast X-ray orientation',
    body:'This selection retains the source name “ascending branch of inferior branch of ileocolic artery.” If a contrast angiogram shows a comparable ileocolic route, follow its actual branching from the superior mesenteric system toward the ileocaecal region before assigning a name.',
    bullets:[
      'The ileocolic artery can contribute ileal, caecal, appendicular and colic branches. Those territory names do not independently verify this unusually specific nested source label on a patient image.',
      'An upward direction on the rotated screen, or apparent surface contact with a neighbouring branch, cannot establish parentage. FMA14820 retains unspecified source laterality.',
    ],citations:[arteries,angiography],
  },
  'ileal-vein':{
    title:'Ileal venous drainage · contrast X-ray orientation',
    body:'The ileal vein belongs with the small-bowel mesenteric drainage that reaches the superior mesenteric vein and then the portal system. If a contrast study depicts this small tributary, trace its observed connection instead of presuming a direct portal junction.',
    bullets:[
      'Distinguish this venous return from the ileal arterial supply. A vessel of the same regional name does not mean the two lumens share an identical course.',
      'The FMA15405 source label is laterality-unspecified; its selected segment does not establish every ileal tributary or the complete mesenteric venous tree.',
    ],citations:[veins,mesenteric,venography],
  },
  'middle-colic-vein':{
    title:'Middle colic venous drainage · contrast X-ray orientation',
    body:'The middle colic vein drains the transverse-colon region into the superior mesenteric venous system. If it is demonstrated on an acquired contrast examination, identify the actual confluence before comparing it with the middle colic artery.',
    bullets:[
      'The artery supplies the transverse colon; the vein returns blood from that region. Similar names do not make an arterial angiogram a venous map.',
      'The FMA15406 surface carries a midline source identity, not a claim that its entire course or drainage territory lies on the midline.',
    ],citations:[veins,mesenteric,venography],
  },
  'pancreaticoduodenal-vein':{
    title:'Pancreaticoduodenal venous group · contrast X-ray orientation',
    body:'Pancreaticoduodenal veins drain the pancreatic-head and duodenal region through several possible pathways into the portal venous system. If an acquired venous phase demonstrates a branch, follow its actual termination rather than assigning one fixed confluence.',
    bullets:[
      'The retained FMA15398 selection groups three source files under one broad name. It does not identify those components as anterior, posterior, superior or inferior named veins.',
      'A surgical series in patients with right-colon cancer found differing drainage routes for an anterosuperior pancreaticoduodenal vein. That selected cohort supports caution about a fixed junction, not routine visibility of this grouped mesh on X-ray.',
    ],citations:[veins,pancreaticStudy,venography],
  },
  'right-colic-vein':{
    title:'Right colic venous drainage · contrast X-ray orientation',
    body:'The right colic vein returns blood from the ascending-colon region toward the superior mesenteric vein. On an acquired contrast study, trace an opacified right-colic pathway to the junction actually shown.',
    bullets:[
      'Compare this venous route with the right colic artery without assuming matched origins or identical courses. A projected crossing cannot prove a shared vessel.',
      'The right-labelled FMA15407 segment does not establish every colic tributary or a single invariant gastrocolic confluence.',
    ],citations:[veins,mesenteric,venography],
  },
  'left-inferior-epigastric-artery':{
    title:'Left inferior epigastric artery · contrast X-ray orientation',
    body:'The left inferior epigastric artery ordinarily arises from the external iliac artery and ascends toward the lower rectus abdominal wall. If contrast imaging demonstrates it, follow the observed origin rather than the nearby venous course.',
    bullets:[
      'Compare the left artery with the left inferior epigastric vein: the artery receives inflow from the external iliac artery, while the vein drains toward the external iliac vein.',
      'Keep this deep artery distinct from the superficial epigastric artery, which arises from the femoral artery. A cadaver study records arterial course variation, so the surface is not an invariant patient landmark.',
    ],citations:[arteries,wallVeins,wallStudy,angiography],
  },
  'right-inferior-epigastric-artery':{
    title:'Right inferior epigastric artery · contrast X-ray orientation',
    body:'The right inferior epigastric artery ordinarily branches from the external iliac artery and ascends into the deep anterior abdominal wall. If it is shown on an acquired angiogram, identify its observed takeoff.',
    bullets:[
      'Compare the right artery with the right inferior epigastric vein, a separate drainage route toward the external iliac vein; they are not interchangeable contrast-phase labels.',
      'The inferior epigastric artery differs from the femoral-origin superficial epigastric artery. Cadaveric course variation limits what can be inferred from this retained surface.',
    ],citations:[arteries,wallVeins,wallStudy,angiography],
  },
  'left-inferior-epigastric-vein':{
    title:'Left inferior epigastric vein · contrast X-ray orientation',
    body:'The left inferior epigastric vein carries deep lower abdominal-wall drainage toward the external iliac vein. If an acquired venous study demonstrates it, follow its observed entry separately from the arterial origin.',
    bullets:[
      'Compare the left vein with the left inferior epigastric artery on the same anatomical side. The artery supplies the wall from the external iliac artery; the vein returns blood to the external iliac venous system.',
      'The source segment does not establish every small wall tributary or an exact venous junction on a patient projection.',
    ],citations:[wallVeins,arteries,venography],
  },
  'right-inferior-epigastric-vein':{
    title:'Right inferior epigastric vein · contrast X-ray orientation',
    body:'The right inferior epigastric vein returns deep lower abdominal-wall blood toward the external iliac vein. If seen on acquired venous contrast imaging, identify the demonstrated termination rather than treating the adjacent artery as the same channel.',
    bullets:[
      'Pair this right-labelled vein with the right inferior epigastric artery for regional orientation, while preserving their different drainage and supply roles.',
      'A right source label does not independently verify patient-side markers, tributary completeness or venous patency.',
    ],citations:[wallVeins,arteries,venography],
  },
  'tributary-of-left-hepatic-vein':{
    title:'Left hepatic tributary group · contrast X-ray orientation',
    body:'Left hepatic venous tributaries carry blood from liver tissue toward the left hepatic vein and onward to the inferior vena cava. If a hepatic venogram demonstrates one, follow the observed channel into the hepatic venous outflow rather than confusing it with portal inflow.',
    bullets:[
      'FMA15794 retains five original source files as one left-labelled selection. Their separate components have no newly assigned branch names or validated segment boundaries.',
      'The source group cannot establish a complete left-liver drainage map or the particular left–middle hepatic vein junction of an individual patient.',
    ],citations:[veins,venography],
  },
  'tributary-of-right-hepatic-vein':{
    title:'Right hepatic tributary group · contrast X-ray orientation',
    body:'Right hepatic venous tributaries contribute to outflow through the right hepatic vein and inferior vena cava. If an acquired hepatic venogram shows a tributary, trace its demonstrated destination and keep it distinct from right portal inflow.',
    bullets:[
      'FMA15791 retains four original source files as one right-labelled group, including disconnected components. Those pieces are not individually named veins.',
      'This source selection does not define all right-liver drainage, an accessory hepatic vein, or a patient-specific hepatic segment boundary.',
    ],citations:[veins,venography],
  },
} as const;
