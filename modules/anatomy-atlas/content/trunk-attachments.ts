import {trunkMuscleLessons} from '../lib/trunk-curriculum';

// Explicit right/left pairs or an unpaired identity; never infer FMA arithmetic.
export const trunkAttachmentPartners={
  occipital:['FMA52735'],sacrum:['FMA16202'],hip:['FMA16586','FMA16587'],
  manubrium:['FMA7486'],sternum:['FMA7487'],xiphoid:['FMA7488'],
  clavicle:['FMA13322','FMA13323'],scapula:['FMA13395','FMA13396'],humerus:['FMA23130','FMA23131'],
  c6:['FMA12524'],c7:['FMA12525'],
  t1:['FMA9165'],t2:['FMA9187'],t3:['FMA9209'],t4:['FMA9248'],t5:['FMA9922'],t6:['FMA9945'],
  t7:['FMA9968'],t8:['FMA9991'],t9:['FMA10014'],t10:['FMA10037'],t11:['FMA10059'],t12:['FMA10081'],
  l1:['FMA13072'],l2:['FMA13073'],l3:['FMA13074'],
  r1:['FMA7857','FMA7987'],r2:['FMA7882','FMA8012'],r3:['FMA7909','FMA8039'],r4:['FMA7957','FMA8148'],
  r5:['FMA8066','FMA8093'],r6:['FMA8175','FMA8202'],r7:['FMA8229','FMA8256'],r8:['FMA8283','FMA8310'],
  r9:['FMA8364','FMA8391'],r10:['FMA8445','FMA8472'],r11:['FMA8531','FMA8532'],r12:['FMA8533','FMA8534'],
  cc1:['FMA7875','FMA8005'],cc2:['FMA7886','FMA8031'],cc3:['FMA7913','FMA8058'],cc4:['FMA7976','FMA8167'],
  cc5:['FMA8070','FMA8112'],cc6:['FMA8194','FMA8221'],cc7:['FMA8248','FMA8275'],
} as const;
export type TrunkAttachmentPartner=keyof typeof trunkAttachmentPartners;
type Mapping={origin:readonly TrunkAttachmentPartner[];insertion:readonly TrunkAttachmentPartner[];originUnresolved?:boolean;insertionUnresolved?:boolean;originLabel?:string;insertionLabel?:string;note?:string};
const unresolved={origin:[],insertion:[],originUnresolved:true,insertionUnresolved:true} as const;
const mappings:Record<string,Mapping>={
  'external-intercostal':unresolved,'internal-intercostal':unresolved,'innermost-intercostal':unresolved,
  'external-oblique':{origin:['r5','r6','r7','r8','r9','r10','r11','r12'],insertion:['hip'],insertionLabel:'Insertion · iliac/pubic partner via aponeurosis'},
  'pectoralis-minor':{origin:['r3','r4','r5'],insertion:['scapula']},
  'pectoralis-major':{origin:['manubrium','sternum','cc1','cc2','cc3','cc4','cc5','cc6','cc7'],insertion:['humerus'],originLabel:'Origin · typical sternocostal partners',note:'Only represented sternocostal/abdominal components; no clavicular head. Cartilage slips and aponeurosis remain unsegmented.'},
  'transversus-thoracis':{origin:['sternum','xiphoid'],insertion:['cc2','cc3','cc4','cc5','cc6'],insertionLabel:'Insertion · costal cartilage, not rib bone'},
  'diaphragm':{origin:['xiphoid','r7','r8','r9','r10','r11','r12','l1','l2','l3'],insertion:[],originLabel:'Origin · combined typical bony partners',insertionLabel:'Insertion · central tendon',note:'Combined crural range, not separate left/right footprints. Costal cartilage, arcuate ligaments and central tendon are not mapped here.'},
  'trapezius-ascending':{origin:['t4','t5','t6','t7','t8','t9','t10','t11','t12'],insertion:['scapula']},
  'trapezius-transverse':{origin:[],insertion:['scapula'],originUnresolved:true},
  'trapezius-descending':{origin:['occipital'],insertion:['clavicle']},
  'lumbar-rotator':unresolved,'thoracic-rotator':unresolved,
  'iliocostalis-lumborum':{origin:['sacrum','hip'],insertion:[],insertionUnresolved:true,note:'Distinct lumbar/thoracic portions; exact insertion levels are not assigned.'},
  'iliocostalis-thoracis':{origin:['r7','r8','r9','r10','r11','r12'],insertion:['r1','r2','r3','r4','r5','r6','c7']},
  'longissimus-thoracis':{origin:['sacrum','hip'],insertion:[],originUnresolved:true,insertionUnresolved:true,note:'Only sacropelvic partners mapped; vertebral/rib levels and fascicles remain unresolved. No skull partner.'},
  'semispinalis-thoracis':{origin:['t6','t7','t8','t9','t10'],insertion:['c6','c7','t1','t2','t3','t4']},
  'serratus-posterior-inferior':{origin:['t11','t12','l1','l2'],insertion:['r9','r10','r11','r12']},
  'serratus-posterior-superior':{origin:['c7','t1','t2','t3'],insertion:['r2','r3','r4','r5']},
  'spinalis':{...unresolved,note:'Mixed source group: thoracic reference prose does not identify every component. No skull attachment assigned.'},
  'lateral-lumbar-intertransversarius':unresolved,'medial-lumbar-intertransversarius':unresolved,'interspinalis-thoracis':unresolved,
};
export const trunkAttachments=trunkMuscleLessons.map(lesson=>{
  const m=mappings[lesson.key];if(!m)throw Error('Missing trunk attachment mapping: '+lesson.key);
  // Keep the complete curriculum and references unchanged in its existing tabs.
  const references=lesson.references.slice(0,1);
  return {key:lesson.key,region:lesson.region,fmas:lesson.fmaIds,representation:lesson.representation,
    mappingStatus:m.originUnresolved||m.insertionUnresolved?'partial' as const:'typical' as const,
    endpoints:[
      {role:'proximal' as const,label:m.originLabel??(m.originUnresolved?'Origin · levels/parts unresolved':'Origin · mapped partners'),partners:m.origin,site:lesson.origin,unresolved:!!m.originUnresolved},
      {role:'distal' as const,label:m.insertionLabel??(m.insertionUnresolved?'Insertion · levels/parts unresolved':'Insertion · mapped partners'),partners:m.insertion,site:lesson.insertion,unresolved:!!m.insertionUnresolved},
    ],
    reference:{title:'Attachment reading reference',url:references[0]},references,note:m.note??'',
  };
});
