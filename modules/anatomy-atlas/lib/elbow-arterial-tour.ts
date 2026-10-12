import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/elbow-arterial-tour-pins.json' with {type:'json'};

const targetFmas=['FMA22712','FMA22801','FMA22707','FMA22804','FMA23126','FMA22764','FMA23124','FMA268667'];
const contextFmas=['FMA23130','FMA23464','FMA23467'];
if(pins.baseline!=='a70b6f640c5511330f250882f525b63a4a21117b'||
 pins.tourRevision!=='right-elbow-arterial-pairs-20261012-r1'||
 sourceCanonical(pins.entries.map(s=>s.fmaId))!==sourceCanonical(targetFmas)||
 sourceCanonical(pins.contextEntries.map(s=>s.fmaId))!==sourceCanonical(contextFmas))
 throw Error('Unexpected elbow arterial tour source pins.');
const entries=pins.entries,context=pins.contextEntries,all=[...entries,...context];
const table='https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const dissection='https://profiles.wustl.edu/en/publications/the-extraosseous-and-intraosseous-arterial-anatomy-of-the-adult-e/';
const stop=(i:number,id:string,view:RegionalTour['steps'][number]['view'],frame:number[],caption:string):RegionalTour['steps'][number]=>({
 id,title:entries[i].name,selectedId:entries[i].id,view,caption,frameIds:frame.map(n=>entries[n].id),
 references:[table,dissection],durationMs:14000,fadeOthers:true,
});

/** Paired anatomical comparisons, not a connected flow path or probe trajectory. */
export const elbowArterialTour:RegionalTour={
 id:'right-elbow-arterial-pairs',title:'Right elbow: collateral & recurrent arteries',
 region:'forearm',revision:pins.tourRevision,status:'draft',
 description:'Eight stops compare four named arterial pairs around the right elbow. Faded humerus, radius and ulna remain in their assembled source positions.',
 contextIds:context.map(s=>s.id),
 requiredDisplayBundles:Object.fromEntries(all.map(s=>[s.id,s.bundle])),
 limitations:'Usual named anatomy, not measured donor-specific communications. Eight exterior arterial surfaces and three whole-bone landmarks are included; brachial, deep brachial, radial, ulnar and posterior interosseous parent trunks, nerves, soft-tissue tunnels and the complete vascular network are not part of this sequence. Gaps or apparent contact do not demonstrate a connected lumen, occlusion, collateral adequacy, flow or perfusion. Whole-bone landmarks can extend outside the local paired-vessel camera frame. All source geometry remains anatomically unvalidated; no source junction or missing segment is reconstructed. The primary dissection abstract describes injected cadaveric anatomy, not clinical ultrasound detection. Existing modality teaching retains its own evidence and pending limits; the tour supplies no acquired CT, MRI or ultrasound, probe plane, Doppler signal, procedural route or patient-space registration. Stop order is comparison, not blood-flow direction. Original right-sided labels are retained during rotation. Assembled fading is not a dissection plane. Draft pending revision-bound radiologist sign-off of the exact surfaces, sequence and camera presentation; Atlas, imaging-case and paid-lecture access remain independent.',
 steps:[
  stop(0,'inferior-ulnar-collateral','anterior',[0,1],
   'Begin with the inferior ulnar collateral branch, usually from the brachial artery. Compare it with the anterior ulnar recurrent surface; their usual communication is not a measured mesh junction.'),
  stop(1,'anterior-ulnar-recurrent','anterior',[0,1],
   'Highlight the anterior ulnar recurrent branch from the ulnar artery. It is distinct from the posterior recurrent branch, although a shared origin can occur.'),
  stop(2,'superior-ulnar-collateral','posterior',[2,3],
   'Compare the superior ulnar collateral branch with its posterior recurrent counterpart. Its usual ulnar-nerve relationship is anatomical context only: no nerve surface is supplied here.'),
  stop(3,'posterior-ulnar-recurrent','posterior',[2,3],
   'Highlight the posterior ulnar recurrent artery at the medial elbow. Keep this pair separate from the inferior collateral and anterior recurrent pair.'),
  stop(4,'radial-collateral','right',[4,5],
   'Move to the lateral pair. The radial collateral selection is a deep brachial branch, not the radial recurrent artery; compare their retained surfaces without inferring continuity.'),
  stop(5,'radial-recurrent','right',[4,5],
   'The radial recurrent branch returns toward the lateral elbow from the radial artery. The named collateral and recurrent branches have different usual parents.'),
  stop(6,'middle-collateral','posterior',[6,7],
   'Compare the middle collateral branch of the deep brachial artery with the recurrent interosseous surface. Middle describes this arterial name, not a screen position.'),
  stop(7,'recurrent-interosseous','posterior',[6,7],
   'Finish with the recurrent interosseous artery, usually from the posterior interosseous artery. Its usual communication with the middle collateral branch does not prove that these separate source segments connect.'),
 ],
};

const tourIdentity=sourceCanonical(elbowArterialTour);
const records=new Map(all.map(s=>[s.id,sourceCanonical(s)])),fmas=new Set(all.map(s=>s.fmaId));
export function elbowArterialTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
 if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||
  sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
 const found=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
 if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||
  !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
 return pins.bundles.every(bundle=>{
  const found=catalog.bundles.filter(b=>b.id===bundle.id||b.url===bundle.url||b.sha256===bundle.sha256);
  return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
 });
}
