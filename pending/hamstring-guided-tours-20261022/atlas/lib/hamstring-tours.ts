import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/hamstring-tour-pins.json' with {type:'json'};

const sides=['right','left'] as const;
const expectedFmas={right:['FMA45888','FMA45891','FMA22358','FMA22448'],left:['FMA45889','FMA45892','FMA22359','FMA22449']};
const femurFmas={right:'FMA24474',left:'FMA24475'};
if(pins.schemaVersion!==1||pins.baseline!=='2381efe43b75f8a7fb768a069eecd7268c508dac'||
  pins.revision!=='bilateral-hamstring-orientation-20261022-r1'||pins.entries.length!==8||pins.contextEntries.length!==2||
  sides.some((side,si)=>pins.entries.slice(si*4,si*4+4).some((entry,i)=>entry.fmaId!==expectedFmas[side][i]||entry.laterality!==side||entry.bundle!==(i<2?'thigh-muscles-dissection':'thigh-muscles'))||
    pins.contextEntries[si].fmaId!==femurFmas[side]||pins.contextEntries[si].laterality!==side||pins.contextEntries[si].bundle!=='thigh-skeleton')||
  pins.bundles.length!==3||new Set(pins.bundles.map(b=>b.id)).size!==3||
  !pins.bundles.some(b=>b.id==='thigh-muscles')||!pins.bundles.some(b=>b.id==='thigh-muscles-dissection')||!pins.bundles.some(b=>b.id==='thigh-skeleton'))
  throw Error('Unexpected hamstring tour source pins.');

const anatomy='https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const cadaver='https://pubmed.ncbi.nlm.nih.gov/17200309/';
const imaging='https://pubs.rsna.org/doi/10.1148/rg.240061';
const captions=[
  'Begin with the long head of biceps femoris, a lateral posterior-thigh muscle. In usual anatomy it arises at the ischial tuberosity with semitendinosus through a common proximal tendon. Their shared origin is described here, not reconstructed on these exterior surfaces.',
  'Compare the separately supplied short head alongside the long head. The short head starts on the femur, including the lateral linea aspera, rather than at the shared ischial origin. This distinction belongs to anatomy, not a measured footprint in this model.',
  'Turn to semitendinosus on the medial posterior thigh. It shares the usual proximal tendon with the biceps long head, then follows a separate course toward the medial tibia. No independently labelled distal tendon or attachment footprint is added.',
  'Finish with semimembranosus, the deeper medial hamstring. Cadaveric anatomy describes its own proximal ischial attachment, separate from the long-head/semitendinosus origin. Compare whole-muscle surfaces only; MRI correlation is semantic orientation, without an aligned thigh scan.',
];
const names=['Biceps femoris · Long head','Biceps femoris · Short head','Semitendinosus','Semimembranosus'];
const slugs=['biceps-long-head','biceps-short-head','semitendinosus','semimembranosus'];
const views:Record<(typeof sides)[number],RegionalTour['steps'][number]['view'][]>={right:['posterior','right','posterior','posterior'],left:['posterior','left','posterior','posterior']};
const makeTour=(side:(typeof sides)[number],index:number):RegionalTour=>{
  const muscles=pins.entries.slice(index*4,index*4+4),femur=pins.contextEntries[index];
  return {
    id:`${side}-hamstring-orientation`,title:`${side==='right'?'Right':'Left'} thigh: posterior muscles`,region:'thigh',
    revision:pins.revision,status:'draft',
    description:'Four focused stops distinguish the biceps femoris heads, semitendinosus and semimembranosus with the same-side femur faded for context.',
    limitations:'Whole source exteriors only. Tendons, attachment footprints and internal architecture are not independently segmented or validated by this tour. The sciatic nerve is absent from this tour. MRI correlation is semantic orientation only: no thigh scan is supplied, and no registration or patient matching is established. Independent lecture access and revision-bound radiologist approval are not granted.',
    contextIds:[femur.id],
    requiredDisplayBundles:Object.fromEntries([...muscles,femur].map(entry=>[entry.id,entry.bundle])),
    steps:muscles.map((entry,i)=>({id:slugs[i],title:names[i],selectedId:entry.id,view:views[side][i],
      caption:captions[i],references:i===3?[anatomy,cadaver,imaging]:i===0||i===2?[anatomy,cadaver]:[anatomy],
      frameIds:[entry.id],durationMs:14000,fadeOthers:true})),
  };
};

export const hamstringTours:RegionalTour[]=sides.map(makeTour);
const admitted=new Map(hamstringTours.map(t=>[t.id,sourceCanonical(t)]));
const all=[...pins.entries,...pins.contextEntries];
const records=new Map(all.map(entry=>[entry.id,sourceCanonical(entry)]));
const fmas=new Set(all.map(entry=>entry.fmaId));
export function hamstringTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==admitted.get(tour.id)||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||
    sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
  if(found.length!==all.length||new Set(found.map(s=>s.id)).size!==all.length||
    !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{const matches=catalog.bundles.filter(actual=>actual.id===bundle.id);return matches.length===1&&sourceCanonical(matches[0])===sourceCanonical(bundle);});
}
