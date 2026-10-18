// Original factual teaching; references are reading links, not reusable media.
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
const catheter='https://www.radiologyinfo.org/en/info/angiocath';
const leftDsa='https://www.wjgnet.com/1007-9327/full/v26/i24/3484.htm';
const descendingCt='https://pubmed.ncbi.nlm.nih.gov/33555389/';

export const colicArterialXrayTopics={
  'ileocolic-artery':{
    title:'Ileocolic angiographic orientation',
    body:'On an acquired contrast catheter angiogram, follow the demonstrated ileocolic artery from its actual origin toward the ileocaecal region. The superior mesenteric artery is the usual origin; the terminal ileum and caecum provide anatomical context, not a patient-specific perfusion map.',
    bullets:[
      'Separate a demonstrated colic branch from ileal, caecal and appendicular branches. Their reference names do not mean that every distal branch is present or visible in this retained surface or one angiographic projection.',
      'The retained FMA14815 selection has unspecified source laterality. Keep that identity rather than relabelling it right-sided from its screen position or the expected position of the caecum.',
      'Compare the assembled colic branch with the marginal arterial chain. Apparent surface contact or a projected crossing does not prove a patent communicating vessel.',
    ],citations:[anatomy,catheter],
  },
  'right-colic-artery':{
    title:'Right colic angiographic orientation',
    body:'On an acquired contrast catheter angiogram, trace the demonstrated right colic vessel toward the ascending colon and back to its observed origin. A superior mesenteric origin, directly or through a branch, is the anatomical reference; do not require a separate independent trunk in every patient.',
    bullets:[
      'Distinguish demonstrated ascending and descending branches from the adjacent middle-colic and ileocolic pathways. Label the configuration actually shown rather than forcing three separate trunks onto an examination.',
      'Use the assembled reference model for gross course orientation. A crossing in a two-dimensional projection cannot establish whether this artery lies anterior or posterior to an adjacent vein in the patient.',
      'The right source label belongs to FMA14811. It neither identifies the patient side of an unmarked acquired image nor validates this surface as that patient’s branching pattern.',
    ],citations:[anatomy,catheter],
  },
  'middle-colic-artery':{
    title:'Middle colic angiographic orientation',
    body:'On an acquired contrast catheter angiogram, follow the demonstrated middle colic origin and branches toward the transverse colon. The usual superior mesenteric origin and right and left branches are orientation references, not guaranteed visibility or a fixed territorial boundary.',
    bullets:[
      'Compare the assembled course through the transverse mesocolon with the peripheral marginal chain. A demonstrated branch and its communication must be followed on the examination; a single projection can superimpose unrelated vessels.',
      'Do not equate the middle colic trunk with its left branch or infer a complete connection to the ascending left-colic branch at the splenic flexure merely because model surfaces approach one another.',
      'FMA14810 retains the source’s midline classification. It does not mean that all branches or their supply lie on the midline, or that patient laterality can be inferred from the viewport.',
    ],citations:[anatomy,catheter],
  },
  'left-colic-artery':{
    title:'Left colic angiographic orientation',
    body:'On an acquired contrast catheter angiogram, distinguish the demonstrated left colic origin from the sigmoid and superior rectal pathways. An inferior mesenteric origin with ascending and descending branches is the reference relationship; the actual examination determines the branching configuration.',
    bullets:[
      'Selective IMA DSA in 154 selected patients aged 65 or older documented variable left-colic branching. This interventional cohort is not routine normal-anatomy visibility evidence.',
      'Keep this retained trunk separate from the two individually named left-colic branch selections. Selecting or hiding one surface does not establish a complete arterial tree or complete bowel supply.',
      'Retain the left source identity. Neither gross model size nor an exploded gap can establish a patient lumen, stenosis or a catheter route.',
    ],citations:[anatomy,catheter,leftDsa],
  },
  'ascending-branch-of-left-colic-artery':{
    title:'Ascending left colic branch orientation',
    body:'On an acquired contrast catheter angiogram, follow a demonstrated ascending left-colic branch toward the upper descending colon and splenic-flexure region. Keep the parent left-colic trunk, this branch and the marginal chain as distinct selections.',
    bullets:[
      'IMA DSA in 154 selected patients aged 65 or older described an ascending left-colic pathway reaching the transverse colon. This is not routine normal-anatomy visibility evidence or a universal communication.',
      'A connection toward the left middle-colic branch is an anatomical comparison task, not an established anastomosis in this mesh. Follow the actual contrast-filled course rather than closing an apparent model gap by assumption.',
      'Direction is anatomical, not a requirement that the vessel runs upward on a rotated screen. Reassemble before comparing the splenic-flexure relationship.',
    ],citations:[anatomy,catheter,leftDsa],
  },
  'descending-branch-of-left-colic-artery':{
    title:'Descending left colic branch orientation',
    body:'Distinguish the descending left-colic branch from a sigmoid artery arising from the left colic artery. The reference definition follows a branch from the left colic artery into the marginal artery along the descending colon; a caudally directed line alone is insufficient to name it.',
    bullets:[
      'The defining study assessed 411 patients with contrast-enhanced CT phases and 3D reconstructions, not catheter DSA. Its positional measures are not transferred here as angiographic diagnostic thresholds.',
      'When comparing an acquired angiogram, follow the demonstrated origin and destination; do not assume the separate sigmoid pathway from this retained branch surface. CT anatomy evidence alone does not guarantee DSA visibility.',
      'The left source identity and FMA14829 remain unchanged. A rotated or exploded reference surface cannot determine patient-side markers, branch patency or bowel perfusion.',
    ],citations:[anatomy,catheter,descendingCt],
  },
  'marginal-colic-artery':{
    title:'Marginal colic chain orientation',
    body:'Compare the marginal colic arterial chain with the adjoining ileocolic, right-colic, middle-colic, left-colic and sigmoid pathways. On acquired contrast angiography, trace only the demonstrated peripheral communications; do not substitute a schematic complete arcade for the examination.',
    bullets:[
      'IMA DSA in 154 selected patients aged 65 or older distinguished the peripheral marginal artery of Drummond from the more central arc of Riolan, with variable continuity and filling extent. This is not routine normal-anatomy visibility evidence.',
      'An opacified communicating vessel does not by itself quantify tissue perfusion. The retained FMA14824 surface cannot exclude an ischaemic segment, determine a watershed boundary or justify a surgical or embolisation plan.',
      'Keep the source’s midline identity and original single selection. It does not assert a midline course, complete colonic arterial coverage or continuous patent lumen around the colon.',
    ],citations:[anatomy,catheter,leftDsa],
  },
} as const;
