import type {BodyCatalog,BodyStructure} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import pins from '../content/hand-venous-imaging-pins.json' with {type:'json'};
import {sourceCanonical} from './body-source-additions';
import {handVenousImagingReferences as references} from '../content/hand-venous-imaging';

const orderedFmas={
 right:['FMA62506','FMA22915','FMA22912','FMA22920','FMA85096','FMA85098','FMA85100'],
 left:['FMA62507','FMA22916','FMA22913','FMA22921','FMA85097','FMA85099','FMA85101'],
} as const;
const titles=['Dorsal venous network','Superficial palmar venous arch','Deep palmar venous arch','Palmar metacarpal veins · Group','Index digital veins · Group','Middle digital veins · Group','Ring digital veins · Group'];
const captions=[
 'Begin with the dorsal network in its assembled position. This is one supplied network selection, not a complete tributary map. CT and MRI notes describe acquisition-dependent visibility.',
 'Turn towards the palmar sources. Compare the superficial-labelled arch with the deep-labelled arch. The names alone do not validate their relative depth, continuity or anastomoses.',
 'Select the deep-labelled arch without moving either surface. Use the adjacent arch for orientation; model colour and apparent contacts do not establish a venous junction or flow.',
 'Move to the palmar metacarpal group. Its three recorded components remain one identity, not three named or independently validated scan contours. Compare its assembled position with the arches.',
 'Focus on the index-finger group. Both unnamed components stay selected together. Use the named digit for CT/MRI orientation without assigning radial or ulnar branch identities.',
 'Compare the middle-finger group with the index group. Each selection retains its own recorded components and side; a camera transition is not a demonstrated drainage pathway.',
 'Finish on the ring-finger group. Thumb detail is absent and little-finger vein groups remain withheld. The CT/MRI notes do not establish patency, flow, compressibility or registration.',
];

export const handVenousTours:RegionalTour[]=(['right','left'] as const).map(side=>{
 const sources=orderedFmas[side].map(fma=>{
  const entry=pins.entries.find(e=>e.identity.fmaId===fma&&e.identity.laterality===side);
  if(!entry)throw Error('Pinned hand venous tour source missing.');
  return entry.identity;
 });
 const ids=sources.map(s=>s.id),tourId=`${side}-hand-venous-orientation`;
 const frames=[[0],[1,2],[2,1],[3,1,2],[4,5],[5,4,6],[6,5]];
 return{
  id:tourId,title:`${side==='right'?'Right':'Left'} hand: venous networks & digits`,region:'hand',
  revision:tourId+'-v1',status:'draft',contextIds:[],
  description:'Seven source-bound stops through the dorsal network, palmar arches and grouped digital veins. Read the existing CT/MRI notes at each stop.',
  limitations:'Separate source surfaces, not a complete drainage pathway, continuous lumen or validated relative depth. Metacarpal selections retain three components; each digital group retains two unnamed components. Thumb detail is absent; little-finger vein groups remain withheld. No nerve, valve, flow, patency, compressibility, diagnostic protocol, patient scan or registration. Fading and camera framing do not dissect tissue or move structures. Each side uses its own original surfaces, never mirrored geometry. Imaging/lecture links require separately cleared resources and independent access. Camera views and anatomical relationships require revision-bound radiologist sign-off; draft, no clinical approval.',
  requiredDisplayBundles:Object.fromEntries(sources.map(s=>[s.id,s.bundle])),
  steps:sources.map((s,i)=>({id:`stop-${i+1}`,title:titles[i],selectedId:s.id,
   view:i===0?'posterior':'anterior',frameIds:frames[i].map(j=>ids[j]),
   caption:captions[i],references:[references.anatomy,references.imaging,references.mri],
   durationMs:14000,fadeOthers:true,
  })),
 };
});

/** This added sequence admits the complete exact original source, not an ID alias. */
export function handVenousTourSourceMatches(catalog:BodyCatalog,s:BodyStructure):boolean{
 const pinned=pins.entries.find(e=>e.identity.id===s.id);
 if(!pinned||sourceCanonical(s)!==sourceCanonical(pinned.identity)||
   catalog.sourceVersion!==pins.sourceVersion||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
 const bundles=catalog.bundles.filter(b=>b.id===s.bundle),original=pins.bundles.find(b=>b.id===s.bundle);
 return bundles.length===1&&!!original&&sourceCanonical(bundles[0])===sourceCanonical(original);
}
