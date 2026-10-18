import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/forearm-arterial-tour-pins.json' with {type:'json'};

const fmas=['FMA22733','FMA22797','FMA22807','FMA22812'];
const contextFmas=['FMA23464','FMA23467'];
if(pins.entries.length!==fmas.length||pins.entries.some((entry,i)=>entry.fmaId!==fmas[i])||
  pins.contextEntries.length!==contextFmas.length||pins.contextEntries.some((entry,i)=>entry.fmaId!==contextFmas[i])||
  pins.tourRevision!=='right-forearm-arterial-orientation-v1')
  throw Error('Unexpected forearm arterial tour source pins.');
const entries=pins.entries,admitted=[...entries,...pins.contextEntries];
const forearm='https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html';
const arteries='https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const stop=(i:number,id:string,title:string,frame:number[],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view:'anterior',caption,references:[forearm,arteries],
  frameIds:frame.map(index=>admitted[index].id),durationMs:14000,fadeOthers:true,
});

/** Source exterior surfaces retain their original positions; stop order is a teaching sequence. */
export const forearmArterialTour:RegionalTour={
  id:'right-forearm-arterial-orientation',title:'Right forearm: arterial routes',
  region:'forearm',revision:pins.tourRevision,status:'draft',
  description:'Four right-sided arterial stops compare radial and ulnar routes with the common and anterior interosseous branches. Radius and ulna remain faded landmarks.',
  limitations:'Selected exterior source surfaces only, not a complete arterial tree. Radial and ulnar source meshes extend into the hand, so their whole-surface camera bounds exceed the forearm; framing is not a local branch map. The posterior interosseous artery, brachial bifurcation and nerve geometry are absent from this sequence. Stop order is a teaching sequence, not a continuous vessel route; these surfaces do not demonstrate connected lumens, patency or blood flow. No simulated dissection plane, procedural path, acquired scan or patient-space registration. All selected source surfaces remain anatomically unvalidated. Draft pending exact-revision radiologist review.',
  contextIds:pins.contextEntries.map(entry=>entry.id),
  requiredDisplayBundles:Object.fromEntries(admitted.map(entry=>[entry.id,entry.bundle])),
  steps:[
    stop(0,'radial','Radial artery · Thumb side',[0],
      'Begin beside the radius on the thumb side. The radial artery normally arises from the brachial artery near the elbow and continues toward the hand. This whole source surface does not show the brachial division.'),
    stop(1,'ulnar','Ulnar artery · Little-finger side',[1],
      'Compare the ulnar artery beside the ulna. It is the other usual terminal branch of the brachial artery and continues into the hand. These separate meshes do not verify the proximal bifurcation or a connected flow path.'),
    stop(2,'common-interosseous','Common interosseous · Ulnar branch',[2],
      'Focus on the short common interosseous artery. In usual anatomy it branches from the ulnar artery and divides into anterior and posterior interosseous arteries. Only the common branch and the next anterior surface are selected here.'),
    stop(3,'anterior-interosseous','Anterior interosseous · Deep route',[3],
      'Finish with the anterior interosseous artery between the forearm bones. It normally branches from the common interosseous artery and supplies deep forearm structures. The absent posterior branch and unshown membrane or nerves cannot be inferred from the faded view.'),
  ],
};

const tourIdentity=sourceCanonical(forearmArterialTour);
const records=new Map(admitted.map(entry=>[entry.id,sourceCanonical(entry)]));
const identities=new Set(admitted.map(entry=>entry.fmaId));
export function forearmArterialTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||
    catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||identities.has(s.fmaId));
  if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||
    !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{
    const found=catalog.bundles.filter(b=>b.id===bundle.id);
    return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
  });
}
