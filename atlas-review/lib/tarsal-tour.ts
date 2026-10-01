import type {RegionalTour} from './regional-tours';

const names=['talus','calcaneus','navicular','cuboid','medial-cuneiform','intermediate-cuneiform','lateral-cuneiform'] as const;
const catalogNames={
  talus:'right-talus',
  calcaneus:'right-calcaneus',
  navicular:'navicular-bone-of-right-foot',
  cuboid:'right-cuboid-bone',
  'medial-cuneiform':'right-medial-cuneiform-bone',
  'intermediate-cuneiform':'right-intermediate-cuneiform-bone',
  'lateral-cuneiform':'right-lateral-cuneiform-bone',
} as const;
const bone=(name:typeof names[number])=>`vm:anatomy:body:foot:right:bone:${catalogNames[name]}`;
const frame=names.map(bone);
const reference='https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const stop=(name:typeof names[number],title:string,view:RegionalTour['steps'][number]['view'],caption:string):RegionalTour['steps'][number]=>({
  id:name,title,selectedId:bone(name),view,caption,frameIds:[...frame],
  references:[reference],durationMs:14000,fadeOthers:true,
});

export const tarsalTour:RegionalTour={
  id:'right-tarsal-bone-orientation',title:'Right foot: hindfoot & midfoot',region:'foot',
  revision:'right-tarsal-bone-orientation-v1',status:'draft',
  description:'Seven assembled right tarsal bones, viewed from above, the side and beneath the foot. Each stop highlights one bone within the same source frame.',
  limitations:'Selected right-sided bony source surfaces only. Tibia, fibula and metatarsals are outside this focused tour; cartilage, ligaments and tendons are not shown. No weight-bearing simulation or validated joint-space measurement. Camera turns are viewing aids, not acquired projections. No CT/MRI registration or patient-specific alignment. Draft pending revision-bound radiologist review.',
  contextIds:[],
  requiredDisplayBundles:Object.fromEntries(frame.map(id=>[id,'foot-skeleton'])),
  steps:[
    stop('talus','Talus · Proximal tarsal','superior',
      'Begin above the foot. The talus sits above the calcaneus; its forward head meets the navicular.'),
    stop('calcaneus','Calcaneus · Heel','inferior',
      'Turn beneath the foot to locate the heel bone behind the cuboid, with the talus above.'),
    stop('navicular','Navicular · Medial bridge','superior',
      'Return above the medial midfoot. Navicular lies between the talus and the three cuneiforms.'),
    stop('cuboid','Cuboid · Lateral column','right',
      'Look along the outer side. Cuboid continues forward from calcaneus toward the fourth and fifth metatarsals, which are omitted.'),
    stop('medial-cuneiform','Medial cuneiform · First ray','superior',
      'Start the cuneiform trio on the inner side, beyond navicular and toward the first metatarsal.'),
    stop('intermediate-cuneiform','Intermediate cuneiform · Second ray','superior',
      'Move centrally to the middle cuneiform, between its neighbours and toward the second metatarsal.'),
    stop('lateral-cuneiform','Lateral cuneiform · Third ray','superior',
      'Finish beside cuboid at the outer cuneiform, beyond navicular and toward the third metatarsal.'),
  ],
};
