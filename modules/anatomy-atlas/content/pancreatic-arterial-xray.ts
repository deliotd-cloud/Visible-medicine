// Independently written factual teaching; reading links do not supply reusable media.
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
const catheter='https://www.radiologyinfo.org/en/info/angiocath';
const selective='https://pmc.ncbi.nlm.nih.gov/articles/PMC5596604/';
const crossSection='https://pubmed.ncbi.nlm.nih.gov/19777288/';
const dect='https://pmc.ncbi.nlm.nih.gov/articles/PMC8816990/';

export const pancreaticArterialXrayTopics={
  'anterior-superior-pancreaticoduodenal-artery':{
    title:'Anterior superior arcade orientation',
    body:'Compare the retained anterior superior pancreaticoduodenal artery with the gastroduodenal artery and anterior inferior branch. These are the usual upper and lower contributors to the anterior pancreaticoduodenal arcade, not interchangeable names for one surface.',
    bullets:[
      'On acquired contrast angiography, follow the demonstrated origin and anterior arcade around the pancreatic head; do not complete an unopacified segment from the reference mesh.',
      'A 39-patient selective arteriography series demonstrated anterior and posterior arcades. It does not establish universal branch visibility, patency or collateral adequacy.',
      'Anterior describes anatomy, not the nearest line on a rotated screen. Compare the reassembled head and duodenum before interpreting a projection crossing.',
    ],citations:[anatomy,catheter,selective],
  },
  'posterior-superior-pancreaticoduodenal-artery':{
    title:'Posterior superior arcade orientation',
    body:'Distinguish the posterior superior pancreaticoduodenal artery from the anterior superior vessel and the gastroduodenal trunk. Its usual gastroduodenal origin and relationship with the posterior inferior contributor orient the posterior arcade.',
    bullets:[
      'Trace a demonstrated contrast-filled origin and course on the acquired examination. An apparent crossing of anterior and posterior vessels does not identify their depth or prove a junction.',
      'A 100-patient dual-energy CT study described posterior-superior origin variants. This is CT evidence, not a catheter DSA visibility study or a reason to assign a variant to this retained surface.',
      'Keep the posterior superior branch distinct from retroduodenal branches; the single selection is not a complete posterior-head vascular tree.',
    ],citations:[anatomy,catheter,dect],
  },
  'inferior-pancreaticoduodenal-artery':{
    title:'Inferior pancreaticoduodenal trunk orientation',
    body:'Use the retained inferior pancreaticoduodenal trunk as a separate selection from its anterior and posterior inferior branches. The superior mesenteric origin is the usual reference, not a mandatory independent trunk in every patient.',
    bullets:[
      'A 100-patient dual-energy CT study described a common origin with a jejunal branch and configurations with separate inferior branches. These CT observations do not guarantee catheter DSA visibility.',
      'On an acquired angiogram, name the demonstrated origin and bifurcation rather than forcing the reference trunk onto separately arising branches. A projected overlap cannot establish a shared lumen.',
      'Compare inferior pancreaticoduodenal with inferior pancreatic artery deliberately: the names belong to different retained vessels, not two labels for the same inferior border.',
    ],citations:[anatomy,catheter,dect],
  },
  'anterior-inferior-pancreaticoduodenal-artery':{
    title:'Anterior inferior arcade orientation',
    body:'Compare the anterior inferior branch with the retained inferior pancreaticoduodenal trunk and anterior superior contributor. The usual reference connects the inferior and superior contributors through the anterior arcade near the pancreatic head and duodenum.',
    bullets:[
      'On acquired contrast angiography, start from the origin actually demonstrated. The mesh name does not require a common inferior trunk or prove that an apparent anterior loop is continuous.',
      'A 100-patient dual-energy CT study found variable inferior-branch origins. CT reconstruction evidence is not a catheter DSA detection rate; an unseen branch must not be labelled absent solely from one projection.',
      'Anterior and inferior are anatomical directions. Preserve the original unspecified source laterality rather than making this a right-sided patient annotation.',
    ],citations:[anatomy,catheter,dect],
  },
  'posterior-inferior-pancreaticoduodenal-artery':{
    title:'Posterior inferior arcade orientation',
    body:'Keep the posterior inferior pancreaticoduodenal branch separate from the anterior inferior branch. Its usual relationship with the inferior trunk and posterior superior contributor provides an anatomical comparison for the posterior arcade.',
    bullets:[
      'An acquired contrast-filled posterior course must be followed independently of the anterior arcade. Two lines meeting in projection are not sufficient evidence of a communicating vessel.',
      'A 100-patient dual-energy CT study documented alternative inferior-branch origins. Its CT findings do not prove a common inferior trunk, a fixed origin or catheter DSA visibility in a new examination.',
      'Use the assembled pancreas and duodenum to orient posterior versus anterior. FMA70480 retains unspecified source laterality even when the rotated model puts it on the right of the screen.',
    ],citations:[anatomy,catheter,dect],
  },
  'dorsal-pancreatic-artery':{
    title:'Dorsal pancreatic origin and branching',
    body:'Compare the dorsal pancreatic artery near the pancreatic neck with its neighbouring body vessels. A splenic origin is the usual reference; the actual acquired examination determines the origin and branches.',
    bullets:[
      'In a 39-patient selective arteriography series the dorsal vessel was not always visualized; an inverted-T appearance helped identify some examples. Do not make that outline mandatory or equate non-visualization with absence.',
      'Okahara and colleagues reviewed 226 selective angiographic and CT-during-selective-arteriography examinations. Their cross-sectional territory comparison is not routine intravenous CTA validation or a patient perfusion map supplied by this atlas.',
      'Separate a demonstrated origin, branch and communicating pathway. The retained dorsal surface alone cannot prove the full prepancreatic or retropancreatic circulation.',
    ],citations:[anatomy,catheter,selective,crossSection],
  },
  'inferior-pancreatic-artery':{
    title:'Inferior pancreatic body-vessel orientation',
    body:'The inferior pancreatic artery is the retained body-vessel selection, not the inferior pancreaticoduodenal trunk. Its usual relationship is with the left branch of the dorsal pancreatic artery along the lower pancreatic body.',
    bullets:[
      'A 39-patient selective arteriography series described the inferior vessel usually from the dorsal artery, with one gastroduodenal origin. That series does not make either pattern universal or establish visibility in every examination.',
      'Follow the demonstrated body-vessel course separately from the head-and-duodenal arcades. An inferior line in an angiogram is not sufficient to choose between these similarly named arteries.',
      'The source name remains inferior pancreatic artery. Terminology used for a transverse body pathway in another study does not authorize renaming, merging or extending this exact FMA14790 surface.',
    ],citations:[anatomy,catheter,selective],
  },
  'great-pancreatic-artery':{
    title:'Great pancreatic branch orientation',
    body:'The great pancreatic artery, also called pancreatica magna, is a named splenic pancreatic branch associated with the body. Keep it separate from the dorsal and inferior pancreatic selections.',
    bullets:[
      'A 39-patient selective arteriography series illustrated the greater pancreatic branch. This establishes an example, not universal visibility or a rule that the largest line in every angiogram must bear this name.',
      'On acquired contrast angiography, trace the demonstrated splenic origin and body-directed course before assigning the name. Surface thickness and model colour cannot establish patient vessel calibre.',
      'Compare the body selection with the caudal branch near the tail. A close approach does not prove a complete intrapancreatic anastomosis or adequate residual supply.',
    ],citations:[anatomy,catheter,selective],
  },
  'caudal-pancreatic-artery':{
    title:'Caudal pancreatic tail orientation',
    body:'Compare the caudal pancreatic artery with the pancreatic tail and splenic hilum. A splenic origin is the usual reference; a left gastro-omental origin is also described. Tail location does not change the source’s unspecified laterality.',
    bullets:[
      'On acquired contrast angiography, follow a demonstrated tail-directed branch back to its actual parent rather than naming any line near the hilum caudal pancreatic artery.',
      'A 100-patient dual-energy CT study assessed caudal-artery visualization under specific reconstructions. This is CT evidence, not a catheter DSA detection promise or a claim that non-visualization means absence.',
      'Keep this single retained surface separate from the great pancreatic and splenic selections. It is not the entire tail microvasculature, a territorial boundary or an independently validated tissue-supply map.',
    ],citations:[anatomy,catheter,dect],
  },
} as const;
