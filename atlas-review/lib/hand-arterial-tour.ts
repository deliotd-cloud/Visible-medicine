import type {RegionalTour} from './regional-tours';

const vessel=(name:string)=>`vm:anatomy:body:hand:right:vessel:${name}`;
const superficial=vessel('right-superficial-palmar-arterial-arch');
const deep=vessel('right-deep-palmar-arch');
const metacarpal=vessel('right-palmar-metacarpal-artery');
const princeps=vessel('right-arteria-princeps-pollicis');
const radialis=vessel('right-arteria-radialis-indicis');
const common=vessel('right-first-common-palmar-digital-artery');
const proper=vessel('medial-proper-palmar-digital-artery-of-right-index-finger');
const anatomy='https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const cta='https://pmc.ncbi.nlm.nih.gov/articles/PMC11736060/';
const stop=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],frameIds:string[],caption:string,references=[anatomy]):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,frameIds,caption,references,durationMs:14000,fadeOthers:true,
});

export const handArterialTour:RegionalTour={
  id:'right-hand-arterial-orientation',title:'Right hand: arterial arches & digits',region:'hand',
  revision:'right-hand-arterial-orientation-v1',status:'draft',
  description:'Seven selected right-hand arterial surfaces, from the palmar arches to named thumb and index branches.',
  limitations:'Selected exterior source segments remain separate, not a joined lumen or full branch inventory. The princeps pollicis and radialis indicis each group two source meshes under one selection. “First common” is a historical source label, not a validated branch ordinal; six right and four left proper digital source selections are incomplete. The selected first-common and index-proper surfaces do not establish a direct junction. No flow, patency, calibre, procedural route, patient images or registration. Palmar views require visual review; draft pending revision-bound radiologist sign-off, with no clinical approval.',
  contextIds:[],
  requiredDisplayBundles:{
    [superficial]:'hand-vessels-hand-vascular',
    [deep]:'hand-vessels-recovery',
    [metacarpal]:'hand-vessels-hand-vascular',
    [princeps]:'hand-vessels-hand-vascular',
    [radialis]:'hand-vessels-hand-vascular',
    [common]:'hand-vessels-hand-vascular',
    [proper]:'hand-vessels-hand-vascular',
  },
  steps:[
    stop('superficial-arch','Superficial palmar arch',superficial,'anterior',[superficial,deep],
      'Start at the superficial palmar arch. In typical anatomy it is predominantly ulnar and gives rise to common palmar digital arteries. Arch configuration varies.',[anatomy,cta]),
    stop('deep-arch','Deep palmar arch',deep,'anterior',[deep,superficial],
      'Compare the deeper, more proximal arch. It is predominantly radial in usual anatomy and gives rise to palmar metacarpal arteries. These source surfaces do not establish continuity.'),
    stop('palmar-metacarpal','Palmar metacarpal artery',metacarpal,'anterior',[metacarpal,deep],
      'Focus on one named palmar metacarpal surface. Such arteries usually arise from the deep arch and contribute to digital circulation; this is not a complete branch map.'),
    stop('princeps-pollicis','Arteria princeps pollicis',princeps,'right',[princeps,radialis],
      'Move towards the thumb. The princeps pollicis is a radial-system artery supplying the palmar thumb; two source meshes share this single selection.'),
    stop('radialis-indicis','Arteria radialis indicis',radialis,'right',[radialis,princeps],
      'Compare the radial side of the index finger with the thumb-side artery. Radialis indicis usually supplies that index margin; two meshes share this selection.'),
    stop('first-common-digital','First common palmar digital artery · Source label',common,'anterior',[common,proper],
      'Locate the historically numbered common digital surface. Common palmar digital arteries generally divide into proper digital branches; this label does not verify its branch ordinal.'),
    stop('index-proper-digital','Index finger · Medial proper palmar digital artery',proper,'anterior',[proper,common],
      'Finish on the medial index proper digital surface. Compare it with the common digital selection without inferring a direct junction between these selected meshes.'),
  ],
};
