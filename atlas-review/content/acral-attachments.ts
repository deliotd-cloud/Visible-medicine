import {handMuscleLessons} from '../lib/hand-curriculum';
import {footMuscleLessons} from '../lib/foot-curriculum';

/** Exact right/left pairs. Hand/foot keys stay separate despite shared names. */
export const acralAttachmentBones={
  hPisiform:['FMA24441','FMA24442'],hHamate:['FMA24448','FMA24449'],hScaphoid:['FMA24435','FMA24436'],hTrapezium:['FMA24443','FMA24444'],hCapitate:['FMA24446','FMA24447'],
  hMc1:['FMA24464','FMA24465'],hMc2:['FMA24466','FMA24467'],hMc3:['FMA24468','FMA24469'],hMc4:['FMA24470','FMA24471'],hMc5:['FMA24472','FMA24473'],
  hThumb:['FMA24450','FMA65470'],hIndex:['FMA24451','FMA71915'],hMiddle:['FMA24452','FMA71908'],hRing:['FMA24453','FMA71916'],hLittle:['FMA24454','FMA66791'],
  fCalcaneus:['FMA24497','FMA24498'],fCuboid:['FMA24528','FMA24529'],fLateralCuneiform:['FMA24525','FMA24526'],
  fMt2:['FMA24509','FMA24510'],fMt3:['FMA24511','FMA24512'],fMt4:['FMA24513','FMA24514'],fMt5:['FMA24515','FMA24516'],
  fHallux:['FMA43253','FMA43254'],fThird:['FMA32636','FMA32637'],fFourth:['FMA32638','FMA32639'],fFifth:['FMA32640','FMA32641'],
  fSecondMiddle:['FMA32642','FMA32643'],fThirdMiddle:['FMA32644','FMA32645'],fFourthMiddle:['FMA32646','FMA32647'],fFifthMiddle:['FMA230986','FMA230988'],
} as const;
type Bone=keyof typeof acralAttachmentBones;
type Mapping={origin:readonly Bone[];insertion:readonly Bone[];originLabel?:string;label?:string};
const nonBony={origin:[],insertion:[],originLabel:'Origin · tendon',label:'Insertion · extensor apparatus'} as const;
const mappings:Record<string,Mapping>={
  'hand:abductor-digiti-minimi':{origin:['hPisiform'],insertion:['hLittle']},
  'hand:flexor-digiti-minimi-brevis':{origin:['hHamate'],insertion:['hLittle']},
  'hand:opponens-digiti-minimi':{origin:['hHamate'],insertion:['hMc5']},
  'hand:abductor-pollicis-brevis':{origin:['hScaphoid','hTrapezium'],insertion:['hThumb']},
  'hand:opponens-pollicis':{origin:['hTrapezium'],insertion:['hMc1']},
  'hand:adductor-pollicis-oblique-head':{origin:['hCapitate','hMc2','hMc3'],insertion:['hThumb']},
  'hand:adductor-pollicis-transverse-head':{origin:['hMc3'],insertion:['hThumb']},
  'hand:lumbrical-group':nonBony,
  'hand:palmar-interosseous-group':{origin:['hMc2','hMc4','hMc5'],insertion:['hIndex','hRing','hLittle'],label:'Proximal phalanges · group partners'},
  'hand:dorsal-interosseous-group':{origin:['hMc1','hMc2','hMc3','hMc4','hMc5'],insertion:['hIndex','hMiddle','hRing'],label:'Proximal phalanges · group partners'},
  'foot:lumbrical-1':nonBony,'foot:lumbrical-2':nonBony,'foot:lumbrical-3':nonBony,'foot:lumbrical-4':nonBony,
  'foot:plantar-interosseous-1':{origin:['fMt3'],insertion:['fThird']},
  'foot:plantar-interosseous-2':{origin:['fMt4'],insertion:['fFourth']},
  'foot:plantar-interosseous-3':{origin:['fMt5'],insertion:['fFifth']},
  'foot:abductor-digiti-minimi':{origin:['fCalcaneus'],insertion:['fFifth']},
  'foot:flexor-digiti-minimi-brevis':{origin:['fMt5'],insertion:['fFifth']},
  'foot:opponens-digiti-minimi':{origin:[],insertion:['fMt5'],originLabel:'Origin · variable soft tissues'},
  'foot:abductor-hallucis':{origin:['fCalcaneus'],insertion:['fHallux']},
  'foot:extensor-hallucis-brevis':{origin:['fCalcaneus'],insertion:['fHallux']},
  'foot:quadratus-plantae':{origin:['fCalcaneus'],insertion:[],label:'Insertion · long-flexor tendon'},
  'foot:flexor-digitorum-brevis':{origin:['fCalcaneus'],insertion:['fSecondMiddle','fThirdMiddle','fFourthMiddle','fFifthMiddle']},
  'foot:flexor-hallucis-brevis-medial-head':{origin:['fCuboid','fLateralCuneiform'],insertion:['fHallux'],label:'Insertion via medial sesamoid apparatus'},
  'foot:flexor-hallucis-brevis-lateral-head':{origin:['fCuboid','fLateralCuneiform'],insertion:['fHallux'],label:'Insertion via lateral sesamoid apparatus'},
  'foot:adductor-hallucis-oblique-head':{origin:['fMt2','fMt3','fMt4'],insertion:['fHallux']},
  'foot:adductor-hallucis-transverse-head':{origin:[],insertion:['fHallux'],originLabel:'Origin · joint/transverse ligaments'},
};
export const acralAttachments=([
  ...handMuscleLessons.map(lesson=>({region:'hand' as const,lesson})),
  ...footMuscleLessons.map(lesson=>({region:'foot' as const,lesson})),
]).map(({region,lesson})=>{
  const key=region+':'+lesson.key,mapping=mappings[key];
  if(!mapping)throw Error('Missing explicit acral attachment mapping: '+key);
  // Keep the primary attachment reading here; the full existing reference list
  // remains in the Anatomy/Function curriculum without duplicate summaries.
  const references=lesson.references.slice(0,1);
  return {key,region,fmas:lesson.fmaIds,representation:lesson.representation,
    endpoints:[
      {role:'proximal' as const,label:mapping.originLabel??'Origin · bony partners',bones:mapping.origin,site:lesson.origin},
      {role:'distal' as const,label:mapping.label??'Insertion · bony partners',bones:mapping.insertion,site:lesson.insertion},
    ],
    reference:{title:'Attachment reading reference',url:references[0]},references,
    note:lesson.caution??'',
    sesamoidUnresolved:region==='foot'&&lesson.key.startsWith('flexor-hallucis-brevis-'),
  };
});
