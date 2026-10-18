import type {RegionalTour} from './regional-tours';

const bones=[
  ['clavicle','vm:anatomy:upper-limb:shoulder:right:bone:clavicle','shoulder-arm-skeleton'],
  ['scapula','vm:anatomy:upper-limb:shoulder:right:bone:scapula','shoulder-arm-skeleton'],
  ['humerus','vm:anatomy:upper-limb:shoulder:right:bone:humerus','shoulder-arm-skeleton'],
  ['radius','vm:anatomy:body:forearm:right:bone:right-radius','forearm-skeleton'],
  ['ulna','vm:anatomy:body:forearm:right:bone:right-ulna','forearm-skeleton'],
  ['scaphoid','vm:anatomy:body:hand:right:bone:right-scaphoid','hand-skeleton'],
  ['first-metacarpal','vm:anatomy:body:hand:right:bone:right-first-metacarpal-bone','hand-skeleton'],
] as const;
type Bone=typeof bones[number][0];
const id=(name:Bone)=>bones.find(item=>item[0]===name)![1];
const lunate='vm:anatomy:body:hand:right:bone:right-lunate';
const trapezium='vm:anatomy:body:hand:right:bone:right-trapezium';
// These are camera windows only: every source mesh remains in its assembled position.
const frames:Record<Bone,string[]>={
  clavicle:[id('clavicle'),id('scapula')],
  scapula:[id('scapula')],
  humerus:[id('humerus')],
  radius:[id('radius'),id('ulna')],
  ulna:[id('radius'),id('ulna')],
  scaphoid:[id('scaphoid'),lunate],
  'first-metacarpal':[id('first-metacarpal'),trapezium],
};
const bonesReference='https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html';
const jointsReference='https://anatomy.ttuhscep.edu/anatomytables/joints_upperlimb.html';
const stop=(name:Bone,title:string,view:RegionalTour['steps'][number]['view'],caption:string,references=[bonesReference]):RegionalTour['steps'][number]=>({
  id:name,title,selectedId:id(name),view,caption,frameIds:frames[name],
  references,durationMs:14000,fadeOthers:true,
});

export const upperLimbBoneTour:RegionalTour={
  id:'right-upper-limb-bone-orientation',title:'Right upper limb: shoulder to thumb',region:'whole-body',
  revision:'right-upper-limb-bone-orientation-v1',status:'draft',
  description:'Seven right-sided whole-bone surfaces from shoulder to thumb, with lunate and trapezium as faded hand context. Close camera frames retain assembled source relationships.',
  limitations:'Selected whole-bone source surfaces only; landmarks are not separate selections. Lunate and trapezium are faded context, not tour stops. The sternum mentioned for orientation is not rendered. Other assembled bones may extend beyond a focused camera window. Cartilage, articular discs, ligaments, tendons, muscles and nerves are not shown as tour anatomy. The distal ulna does not directly meet the carpal bones; its intervening articular disc is unrendered. No simulated motion, validated joint contact or spacing, diagnostic projection, measurements, acquired scan or patient registration. Draft pending revision-bound radiologist review.',
  contextIds:[lunate,trapezium],
  scopeRegions:['shoulder-arm','forearm','hand'],
  requiredDisplayBundles:{...Object.fromEntries(bones.map(([,boneId,bundle])=>[boneId,bundle])),[lunate]:'hand-skeleton',[trapezium]:'hand-skeleton'},
  steps:[
    stop('clavicle','Clavicle · Shoulder girdle','anterior',
      'Begin at the clavicle, running from the sternum toward the scapular acromion. Its lateral end provides a bony link across the shoulder girdle.'),
    stop('scapula','Scapula · Shoulder blade','posterior',
      'Turn behind the shoulder to the scapula. Its spine leads toward the acromion; the lateral glenoid cavity receives the humeral head.'),
    stop('humerus','Humerus · Arm','anterior',
      'Follow the humerus from its rounded head at the shoulder toward the elbow, where its distal surfaces meet the radius and ulna.'),
    stop('radius','Radius · Thumb side','anterior',
      'In anatomical position, the radius lies on the thumb side of the forearm. Its broad distal end faces the scaphoid and lunate.'),
    stop('ulna','Ulna · Medial forearm','anterior',
      'The ulna lies medially in anatomical position. Proximally it meets the humeral trochlea; distally it meets the radius, not the carpal bones directly.',
      [bonesReference,jointsReference]),
    stop('scaphoid','Scaphoid · Thumb-side wrist','anterior',
      'Focus on the scaphoid at the thumb side of the proximal carpal row. The lunate remains faded beside it; both face the distal radius.'),
    stop('first-metacarpal','First metacarpal · Thumb base','anterior',
      'Finish at the first metacarpal of the thumb. The faded trapezium sits between its base and the more proximal carpal row.',
      [bonesReference,jointsReference]),
  ],
};
