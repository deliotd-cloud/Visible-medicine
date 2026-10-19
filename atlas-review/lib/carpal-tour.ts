import type {RegionalTour} from './regional-tours';

const names=['scaphoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate'] as const;
const bone=(name:typeof names[number])=>`vm:anatomy:body:hand:right:bone:right-${name}`;
const frame=names.map(bone);
const reference='https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html';
const stop=(name:typeof names[number],title:string,view:RegionalTour['steps'][number]['view'],caption:string):RegionalTour['steps'][number]=>({
  id:name,title,selectedId:bone(name),view,caption,frameIds:[...frame],
  references:[reference],durationMs:14000,fadeOthers:true,
});

export const carpalTour:RegionalTour={
  id:'right-carpal-row-orientation',title:'Right wrist: the eight carpal bones',region:'hand',
  revision:'right-carpal-row-orientation-v1',status:'draft',
  description:'Follow both carpal rows, with palmar turns for the pisiform, trapezium and hamate. All eight bones remain assembled.',
  limitations:'Right-sided source bone surfaces only. Radius, ulna and metacarpals are outside this focused tour; cartilage, ligaments, tendons and nerves are not shown. No validated joint-space measurement, instability, fracture, healing, motion or patient registration is demonstrated. The hamate hook is not separately segmented. Camera turns are viewing aids, not acquired radiographic projections. Existing CT/MRI/X-ray notes are draft orientation teaching, not linked scans. Draft pending revision-bound radiologist review.',
  contextIds:[],
  requiredDisplayBundles:Object.fromEntries(frame.map(id=>[id,'hand-skeleton'])),
  steps:[
    stop('scaphoid','Scaphoid · Radial proximal row','posterior',
      'Begin on the thumb side of the proximal row. The scaphoid stays assembled with the other seven bones.'),
    stop('lunate','Lunate · Central proximal row','posterior',
      'Move to the lunate between scaphoid and triquetrum. Compare its proximal-row position with the capitate distally.'),
    stop('triquetral','Triquetrum · Ulnar proximal row','posterior',
      'Continue towards the little-finger side. Triquetral is the source label for this triquetrum, not another bone.'),
    stop('pisiform','Pisiform · Palmar landmark','anterior',
      'Turn towards the palm to find pisiform in front of triquetrum. The flexor carpi ulnaris tendon is absent here.'),
    stop('trapezium','Trapezium · Radial distal row','anterior',
      'Start the distal row on the thumb side. Trapezium normally meets the thumb metacarpal, which this tour omits.'),
    stop('trapezoid','Trapezoid · Distal-row neighbour','posterior',
      'Return dorsally and distinguish trapezoid from trapezium. It lies between trapezium and capitate.'),
    stop('capitate','Capitate · Central distal row','posterior',
      'Identify the large central capitate. Its proximal head relates to the lunate; these meshes do not measure cartilage.'),
    stop('hamate','Hamate · Palmar hook','anterior',
      'Finish on the ulnar distal row. Inspect the palmar hook as part of the hamate, not a separate selection.'),
  ],
};
