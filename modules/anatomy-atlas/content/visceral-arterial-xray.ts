// Original factual orientation; reading references do not grant media-reuse rights.
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
const catheter='https://www.radiologyinfo.org/en/info/angiocath';
const visceralDsa='https://pubmed.ncbi.nlm.nih.gov/12147854/';
const renalDonors='https://pubmed.ncbi.nlm.nih.gov/10075363/';

export const visceralArterialXrayTopics={
  'splenic-artery':{
    title:'Splenic angiographic orientation',
    body:'On acquired contrast catheter angiography, trace the demonstrated splenic artery from its actual origin toward the spleen. A coeliac origin is the usual anatomical reference, not a substitute for following the opacified vessel on this examination.',
    bullets:[
      'Published visceral DSA examples demonstrate the splenic branch of the coeliac axis. An illustrated usual pattern does not establish the origin, complete distal branches or visibility in every patient.',
      'The four retained source files share one splenic artery identity, not four separately named arteries. Compare the assembled pancreatic relationship without treating projected overlap, surface contact or explode offsets as proof of depth or branch continuity.',
    ],
    citations:[anatomy,catheter,visceralDsa],
  },
  'right-renal-artery':{
    title:'Right renal angiographic orientation',
    body:'On an acquired right renal catheter angiogram, trace the demonstrated artery from its actual origin toward the right kidney. The usual abdominal-aortic origin is an anatomical reference; confirm examination laterality rather than using screen position or this donor surface as a patient-side marker.',
    bullets:[
      'A 1999 comparison in 16 potential living kidney donors reported 39 renal arteries on catheter angiography. This small historical cohort is not a universal visibility or diagnostic-accuracy guarantee.',
      'Check demonstrated additional arterial origins separately from branches of a single trunk. One retained right renal source segment cannot establish the number of arteries, their complete distal distribution or renal perfusion in a patient.',
    ],
    citations:[anatomy,catheter,renalDonors],
  },
  'left-renal-artery':{
    title:'Left renal angiographic orientation',
    body:'On an acquired left renal catheter angiogram, trace the demonstrated artery from its actual origin toward the left kidney. Its usual abdominal-aortic origin is an orientation reference; the source left label does not register this surface to an examination.',
    bullets:[
      'In the 16-donor comparison, source CT images and catheter angiography each depicted 39 renal arteries, while maximum-intensity and shaded-surface reconstructions depicted 37. Review the actual examination rather than assuming a projection or reconstruction shows every artery.',
      'Keep additional origins distinct from early branching and name only demonstrated branches. The retained left renal segment alone cannot determine arterial multiplicity, stenosis, complete distal supply or patient perfusion.',
    ],
    citations:[anatomy,catheter,renalDonors],
  },
  'trunk-of-gastroduodenal-artery':{
    title:'Gastroduodenal trunk angiographic orientation',
    body:'On acquired contrast catheter angiography, distinguish the demonstrated gastroduodenal origin from the hepatic continuation. A common hepatic origin is the usual reference relationship; this source selection is the retained gastroduodenal trunk, not the complete distal vascular network.',
    bullets:[
      'The 600-patient visceral DSA series documented gastroduodenal origin and branching variants, including coeliac origin and an origin beyond one hepatic artery. Confirm the observed configuration rather than forcing the usual branching sequence.',
      'Preserve FMA76574 as a trunk identity, not whole-artery FMA14775. Downstream gastro-omental and pancreaticoduodenal branches must be demonstrated separately; a retained trunk does not establish complete branches or collateral perfusion.',
    ],
    citations:[anatomy,catheter,visceralDsa],
  },
} as const;
