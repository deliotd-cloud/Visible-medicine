import {forearmMuscleLessons} from '../lib/forearm-curriculum';

/** Existing draft teaching connected to whole bones, never to inferred mesh footprints. */
export const forearmAttachmentBones = {
  humerus:['FMA23130','FMA23131'],radius:['FMA23464','FMA23465'],ulna:['FMA23467','FMA23468'],
  pisiform:['FMA24441','FMA24442'],hamate:['FMA24448','FMA24449'],
  mc1:['FMA24464','FMA24465'],mc2:['FMA24466','FMA24467'],mc3:['FMA24468','FMA24469'],mc5:['FMA24472','FMA24473'],
  thumbProximal:['FMA24450','FMA65470'],thumbDistal:['FMA24459','FMA23951'],
  indexMiddle:['FMA24455','FMA23938'],middleMiddle:['FMA24456','FMA23940'],ringMiddle:['FMA24457','FMA23942'],littleMiddle:['FMA24458','FMA23944'],
  indexDistal:['FMA24460','FMA23953'],middleDistal:['FMA24461','FMA23955'],ringDistal:['FMA24462','FMA23957'],littleDistal:['FMA24463','FMA23959'],
} as const;
type Bone=keyof typeof forearmAttachmentBones;
type Mapping={origin:readonly Bone[];insertion:readonly Bone[];label?:string;note?:string};
const fingerMiddle=['indexMiddle','middleMiddle','ringMiddle','littleMiddle'] as const;
const fingerDistal=['indexDistal','middleDistal','ringDistal','littleDistal'] as const;
const extensorNote='Phalangeal partners are reached through the extensor apparatus; this view does not supply that apparatus or verified digital slips.';
const headNote='Only the selected source head is shown with its bony partners; the shared insertion does not establish a complete muscle or tendon.';
const mappings:Record<string,Mapping>={
  'extensor-carpi-ulnaris':{origin:['humerus','ulna'],insertion:['mc5']},
  'flexor-digitorum-superficialis':{origin:['humerus','ulna','radius'],insertion:fingerMiddle},
  'abductor-pollicis-longus':{origin:['radius','ulna'],insertion:['mc1']},
  'brachioradialis':{origin:['humerus'],insertion:['radius']},
  'extensor-carpi-radialis-brevis':{origin:['humerus'],insertion:['mc3']},
  'extensor-carpi-radialis-longus':{origin:['humerus'],insertion:['mc2']},
  'extensor-digiti-minimi':{origin:['humerus'],insertion:['littleMiddle','littleDistal'],label:'Insertion via extensor apparatus',note:extensorNote},
  'extensor-digitorum':{origin:['humerus'],insertion:[...fingerMiddle,...fingerDistal],label:'Insertion via extensor apparatus',note:extensorNote},
  'extensor-indicis':{origin:['ulna'],insertion:['indexMiddle','indexDistal'],label:'Insertion via extensor apparatus',note:extensorNote},
  'extensor-pollicis-brevis':{origin:['radius'],insertion:['thumbProximal']},
  'extensor-pollicis-longus':{origin:['ulna'],insertion:['thumbDistal']},
  'flexor-carpi-radialis':{origin:['humerus'],insertion:['mc2','mc3']},
  'flexor-digitorum-profundus':{origin:['ulna'],insertion:fingerDistal},
  'flexor-pollicis-longus':{origin:['radius'],insertion:['thumbDistal']},
  'palmaris-longus':{origin:['humerus'],insertion:[],label:'Insertion · non-bony',note:'No insertion bone is substituted for the palmar aponeurosis or flexor retinaculum.'},
  'pronator-quadratus':{origin:['ulna'],insertion:['radius']},
  'supinator':{origin:['humerus','ulna'],insertion:['radius']},
  'pronator-teres-humeral-head':{origin:['humerus'],insertion:['radius'],note:headNote},
  'pronator-teres-ulnar-head':{origin:['ulna'],insertion:['radius'],note:headNote},
  'flexor-carpi-ulnaris-humeral-head':{origin:['humerus'],insertion:['pisiform','hamate','mc5'],label:'Insertion & ligament continuations',note:headNote},
  'flexor-carpi-ulnaris-ulnar-head':{origin:['ulna'],insertion:['pisiform','hamate','mc5'],label:'Insertion & ligament continuations',note:headNote},
};
export const forearmAttachments=forearmMuscleLessons.map(lesson=>{
  const mapping=mappings[lesson.key];
  if(!mapping)throw Error('Missing explicit forearm attachment mapping: '+lesson.key);
  return {
    key:lesson.key,fmas:lesson.fmaIds,
    endpoints:[
      {role:'proximal' as const,label:'Origin · bony partners',bones:mapping.origin,site:lesson.origin},
      {role:'distal' as const,label:mapping.label??'Insertion · bony partners',bones:mapping.insertion,site:lesson.insertion},
    ],
    reference:{title:'Attachment reading reference',url:lesson.references[0]},
    references:lesson.references,
    note:[lesson.caution,mapping.note].filter(Boolean).join(' '),
  };
});
