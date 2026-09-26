import {legMuscleLessons} from '../lib/leg-curriculum';

/** Explicit paired bones, using the current source catalogue's right/left IDs. */
export const legAttachmentBones={
  femur:['FMA24474','FMA24475'],tibia:['FMA24477','FMA24478'],fibula:['FMA24480','FMA24481'],
  calcaneus:['FMA24497','FMA24498'],navicular:['FMA24500','FMA24501'],
  medialCuneiform:['FMA24521','FMA24522'],intermediateCuneiform:['FMA24523','FMA24524'],lateralCuneiform:['FMA24525','FMA24526'],cuboid:['FMA24528','FMA24529'],
  mt1:['FMA24507','FMA24508'],mt2:['FMA24509','FMA24510'],mt3:['FMA24511','FMA24512'],mt4:['FMA24513','FMA24514'],mt5:['FMA24515','FMA24516'],
  halluxDistal:['FMA32650','FMA32651'],secondDistal:['FMA32652','FMA32653'],thirdDistal:['FMA32654','FMA32655'],fourthDistal:['FMA32656','FMA32657'],fifthDistal:['FMA32658','FMA32659'],
  secondMiddle:['FMA32642','FMA32643'],thirdMiddle:['FMA32644','FMA32645'],fourthMiddle:['FMA32646','FMA32647'],fifthMiddle:['FMA230986','FMA230988'],
} as const;
type Bone=keyof typeof legAttachmentBones;
type Mapping={origin:readonly Bone[];insertion:readonly Bone[];label?:string;note?:string};
const lesserDistal=['secondDistal','thirdDistal','fourthDistal','fifthDistal'] as const;
const lesserMiddle=['secondMiddle','thirdMiddle','fourthMiddle','fifthMiddle'] as const;
const achillesNote='The shared tendon is not divided into validated subtendons by these bony links.';
const mappings:Record<string,Mapping>={
  'extensor-digitorum-longus':{origin:['tibia','fibula'],insertion:[...lesserMiddle,...lesserDistal],label:'Insertion via extensor apparatus'},
  'extensor-hallucis-longus':{origin:['fibula'],insertion:['halluxDistal']},
  'fibularis-brevis':{origin:['fibula'],insertion:['mt5']},
  'fibularis-longus':{origin:['fibula'],insertion:['mt1','medialCuneiform']},
  'fibularis-tertius':{origin:['fibula'],insertion:['mt5']},
  'flexor-digitorum-longus':{origin:['tibia'],insertion:lesserDistal},
  'flexor-hallucis-longus':{origin:['fibula'],insertion:['halluxDistal']},
  'plantaris':{origin:['femur'],insertion:['calcaneus'],label:'Usual insertion · variable'},
  'popliteus':{origin:['femur'],insertion:['tibia']},
  'soleus':{origin:['fibula','tibia'],insertion:['calcaneus'],label:'Insertion via Achilles tendon'},
  'tibialis-anterior':{origin:['tibia'],insertion:['medialCuneiform','mt1']},
  'tibialis-posterior':{origin:['tibia','fibula'],insertion:['navicular'],label:'Main insertion · navicular'},
  'gastrocnemius-medial-head':{origin:['femur'],insertion:['calcaneus'],label:'Insertion via Achilles tendon',note:achillesNote},
  'gastrocnemius-lateral-head':{origin:['femur'],insertion:['calcaneus'],label:'Insertion via Achilles tendon',note:achillesNote},
};
const tibialisPosteriorReferences=[
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC7236122/',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC8466387/',
];
export const legAttachments=legMuscleLessons.map(lesson=>{
  const mapping=mappings[lesson.key];
  if(!mapping)throw Error('Missing explicit lower-leg attachment mapping: '+lesson.key);
  const posterior=lesson.key==='tibialis-posterior';
  const endpoints:{role:string;label:string;bones:readonly Bone[];site:string}[]=[
    {role:'proximal',label:'Origin · bony partners',bones:mapping.origin,site:lesson.origin},
    {role:'distal',label:mapping.label??'Insertion · bony partners',bones:mapping.insertion,site:posterior?'Main bony insertion at the navicular tuberosity.':lesson.insertion},
  ];
  if(posterior)endpoints.push({role:'distal-extensions',label:'Reported extensions · variable',
    bones:['medialCuneiform','intermediateCuneiform','lateralCuneiform','cuboid','calcaneus','mt1','mt2','mt3','mt4','mt5'],
    site:'Additional attachments have been described on cuneiforms, cuboid, calcaneus and metatarsal bases. This is a union of reported sites, not one specimen or a universal pattern.'});
  // The calf reference covers both gastrocnemius heads; avoid duplicating the
  // broader posterior-compartment chapter for the same short relationship note.
  const references=posterior?[...tibialisPosteriorReferences,...lesson.references]
    :lesson.key.startsWith('gastrocnemius-')?[lesson.references[0]]:lesson.references;
  return {key:lesson.key,fmas:lesson.fmaIds,endpoints,
    reference:{title:'Attachment reading reference',url:references[0]},references,
    note:[lesson.caution,mapping.note].filter(Boolean).join(' '),
  };
});
