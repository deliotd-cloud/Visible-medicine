import {thighMuscleLessons} from '../lib/thigh-curriculum';

// Explicit source pairs: right/left, except the unpaired sacrum.
export const hipAttachmentPartners={
  hip:['FMA16586','FMA16587'],femur:['FMA24474','FMA24475'],
  sacrum:['FMA16202'],iliotibial:['FMA58776','FMA58777'],
  t12:['FMA10081'],l1:['FMA13072'],l2:['FMA13073'],
  l3:['FMA13074'],l4:['FMA13075'],l5:['FMA13076'],
} as const;
type Partner=keyof typeof hipAttachmentPartners;
type Mapping={origin:readonly Partner[];insertion:readonly Partner[];originUnresolved?:boolean;insertionUnresolved?:boolean;originLabel?:string;insertionLabel?:string;originSite?:string;references?:readonly string[];note?:string};
const hipFemur={origin:['hip'],insertion:['femur']} as const;
const mappings:Record<string,Mapping>={
  'adductor-brevis':hipFemur,'adductor-longus':hipFemur,
  'adductor-magnus':hipFemur,'adductor-minimus':hipFemur,
  'gemellus-inferior':{...hipFemur,insertionLabel:'Insertion · through shared tendon'},
  'gemellus-superior':{...hipFemur,insertionLabel:'Insertion · through shared tendon'},
  'gluteus-maximus':{origin:['hip','sacrum'],insertion:['iliotibial','femur'],originUnresolved:true,note:'Lumbar fascia, sacrotuberous ligament and coccygeal contributions are not separately mapped.'},
  'gluteus-medius':hipFemur,'gluteus-minimus':hipFemur,
  'iliacus':{...hipFemur,insertionLabel:'Insertion · iliopsoas apparatus'},
  'obturator-externus':{...hipFemur,originUnresolved:true,note:'Obturator membrane is not separately selectable; the hip bone is only the bony-margin partner.'},
  'obturator-internus':{...hipFemur,originUnresolved:true,note:'Obturator membrane is not separately selectable; the hip bone is only the bony-margin partner.'},
  'pectineus':hipFemur,'piriformis':{origin:['sacrum'],insertion:['femur']},
  'psoas-major':{origin:['t12','l1','l2','l3','l4','l5'],insertion:['femur'],originUnresolved:true,
    originLabel:'Origin · mapped vertebrae; discs unmapped',insertionLabel:'Insertion · iliopsoas apparatus',
    originSite:'T12–L5 vertebral bodies and L1–L5 transverse processes. Disc contributions are not separately mapped.',
    references:['https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/psmj.htm','https://rad.uw.edu/muscle-atlas/psoas'],
    note:'Whole vertebrae provide typical bony partners, not measured attachment footprints or proof of this donor muscle’s exact cranial extent.'},
  'quadratus-femoris':hipFemur,
  'tensor-fasciae-latae':{origin:['hip'],insertion:['iliotibial'],insertionLabel:'Insertion · iliotibial tract, not direct tibial tendon'},
};
const hipLessons=thighMuscleLessons.filter(l=>Object.hasOwn(mappings,l.key));
if(hipLessons.length!==17)throw Error('Incomplete hip attachment curriculum');
export const hipAttachments=[
  ...hipLessons.map(lesson=>{
    const m=mappings[lesson.key];
    return {key:lesson.key,fmas:lesson.fmaIds,representation:lesson.representation,
      mappingStatus:m.originUnresolved||m.insertionUnresolved?'partial' as const:'typical' as const,
      endpoints:[
        {role:'proximal' as const,label:m.originLabel??'Origin · mapped partners',partners:m.origin,site:m.originSite??lesson.origin,unresolved:!!m.originUnresolved},
        {role:'distal' as const,label:m.insertionLabel??'Insertion · mapped partners',partners:m.insertion,site:lesson.insertion,unresolved:!!m.insertionUnresolved},
      ],
      reference:{title:'Attachment reading reference',url:(m.references??lesson.references)[0]},references:m.references??lesson.references,
      note:[lesson.caution,m.note].filter(Boolean).join(' '),
    };
  }),
  {
    key:'coccygeus',fmas:['FMA46444','FMA46443'],representation:'muscle' as const,mappingStatus:'partial' as const,
    endpoints:[
      {role:'proximal' as const,label:'Lateral attachment · ischial spine',partners:['hip'] as const,site:'Ischial spine.',unresolved:false},
      {role:'distal' as const,label:'Medial attachment · sacrum mapped; coccyx unmapped',partners:['sacrum'] as const,site:'Lateral coccygeal and lower sacral margins.',unresolved:true},
    ],
    reference:{title:'Pelvic attachment reading reference',url:'https://www.ncbi.nlm.nih.gov/books/NBK482258/'},
    references:['https://www.ncbi.nlm.nih.gov/books/NBK482258/'],
    note:'No separately identified coccyx or sacrospinous ligament is assigned. This is not a complete pelvic-floor reconstruction; uncertain source categories remain unassigned.',
  },
];
