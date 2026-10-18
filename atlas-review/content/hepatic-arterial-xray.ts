// Independently written factual orientation. Reading references confer no media rights.
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
const catheter='https://www.radiologyinfo.org/en/info/angiocath';
const dsa='https://pubmed.ncbi.nlm.nih.gov/12147854/';
const donorComparison='https://pubmed.ncbi.nlm.nih.gov/15848625/';

export const hepaticArterialXrayTopics={
  'common-hepatic-artery':{
    title:'Common hepatic angiographic orientation',
    body:'On an acquired contrast catheter angiogram, identify the common hepatic artery from its demonstrated origin. In the usual arrangement it arises from the coeliac trunk and continues as the proper hepatic artery beyond the gastroduodenal branch; confirm that sequence on the actual images.',
    bullets:[
      'A 600-patient digital subtraction angiography (DSA) series documented variant common hepatic origins from the superior mesenteric artery or aorta. The usual coeliac route is an orientation pattern, not a rule for every patient or this donor surface.',
      'Follow the visible parent segment and gastroduodenal origin separately. Projected overlap or an absent branch on one image does not establish continuity, occlusion or a complete hepatic arterial supply.',
    ],
    citations:[anatomy,catheter,dsa],
  },
  'hepatic-artery-proper':{
    title:'Proper hepatic angiographic orientation',
    body:'On the acquired contrast catheter angiogram, distinguish the proper hepatic artery beyond the gastroduodenal origin from the common hepatic parent. In the usual arrangement, the proper hepatic segment divides into right and left hepatic arteries; name only branches demonstrated by the examination.',
    bullets:[
      'The 600-patient DSA series also recorded proper hepatic origin from the superior mesenteric artery. Do not force an observed variant into the usual common-to-proper sequence.',
      'A donor study compared CT angiography with conventional catheter angiography in 28 candidates and reported one variant branch not identified on CT. Agreement in that cohort is not proof that CTA and DSA are interchangeable or that this surface depicts every branch.',
    ],
    citations:[anatomy,catheter,dsa,donorComparison],
  },
  'left-gastric-artery':{
    title:'Left gastric angiographic orientation',
    body:'Identify the left gastric artery on the acquired contrast catheter study and distinguish its gastric course toward the lesser curvature from any demonstrated hepatic branch. Its usual coeliac origin is a reference relationship, not a substitute for tracing the actual opacified vessel.',
    bullets:[
      'DSA observations document both replaced and accessory left hepatic arteries arising from the left gastric artery. Replaced and accessory describe different supply patterns; this retained gastric segment alone cannot establish which pattern, if either, is present.',
      'A liver-donor CT/conventional-angiography comparison reported an accessory hepatic artery from the left gastric artery as its most common arterial variant. That donor cohort does not imply a hepatic branch in every left gastric artery or in this model.',
    ],
    citations:[anatomy,catheter,dsa,donorComparison],
  },
} as const;
