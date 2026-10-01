import type {RegionalTour} from './regional-tours';

const bones=[
  ['hip','vm:anatomy:body:pelvis:right:bone:right-hip-bone','pelvis-skeleton'],
  ['femur','vm:anatomy:body:thigh:right:bone:right-femur','thigh-skeleton'],
  ['patella','vm:anatomy:body:leg:right:bone:right-patella','leg-skeleton'],
  ['tibia','vm:anatomy:body:leg:right:bone:right-tibia','leg-skeleton'],
  ['fibula','vm:anatomy:body:leg:right:bone:right-fibula','leg-skeleton'],
  ['talus','vm:anatomy:body:foot:right:bone:right-talus','foot-skeleton'],
  ['calcaneus','vm:anatomy:body:foot:right:bone:right-calcaneus','foot-skeleton'],
] as const;
type Bone=typeof bones[number][0];
const id=(name:Bone)=>bones.find(item=>item[0]===name)![1];
const frame=bones.map(item=>item[1]);
const reference='https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const stop=(name:Bone,title:string,view:RegionalTour['steps'][number]['view'],caption:string):RegionalTour['steps'][number]=>({
  id:name,title,selectedId:id(name),view,caption,frameIds:[...frame],
  references:[reference],durationMs:14000,fadeOthers:true,
});

export const lowerLimbBoneTour:RegionalTour={
  id:'right-lower-limb-bone-orientation',title:'Right lower limb: hip to heel',region:'whole-body',
  revision:'right-lower-limb-bone-orientation-v1',status:'draft',
  description:'Seven original right-sided whole-bone surfaces from hip to heel. Every stop retains the same assembled source frame.',
  limitations:'Whole-bone source surfaces only; ilium, ischium, pubis and individual bone landmarks are not separate selections. Cartilage, menisci, ligaments and tendons are not shown. No weight-bearing or validated joint-space measurement, fracture diagnosis, acquired scan, patient registration or clinical approval. Fading changes visibility, not anatomy. Draft pending revision-bound radiologist review.',
  contextIds:[],
  scopeRegions:['pelvis','thigh','leg','foot'],
  requiredDisplayBundles:Object.fromEntries(bones.map(([,boneId,bundle])=>[boneId,bundle])),
  steps:[
    stop('hip','Right hip bone · Acetabulum','anterior',
      'Begin at the hip bone. Ilium, ischium and pubis meet around its acetabulum.'),
    stop('femur','Femur · Thigh','posterior',
      'The femoral head meets the acetabulum; below, its condyles meet the tibia.'),
    stop('patella','Patella · Front of knee','anterior',
      'Turn forward to the patella, set before the distal femur within the quadriceps tendon.'),
    stop('tibia','Tibia · Medial leg','anterior',
      'Follow the medial leg bone from the knee toward its medial ankle prominence.'),
    stop('fibula','Fibula · Lateral leg','right',
      'Beside the tibia, the fibular head meets it proximally; the distal end forms the lateral malleolus.'),
    stop('talus','Talus · Ankle','right',
      'Between the medial and lateral malleoli, the talus rests above the calcaneus.'),
    stop('calcaneus','Calcaneus · Heel','posterior',
      'Finish at the calcaneus beneath the talus, forming the bony heel.'),
  ],
};
