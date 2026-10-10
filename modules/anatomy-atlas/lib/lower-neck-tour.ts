import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/lower-neck-tour-pins.json' with {type:'json'};

const fmas=['FMA13392','FMA13390','FMA3953','FMA4755','FMA3941','FMA4754'];
const contextFmas=['FMA13408','FMA13348'];
if(pins.entries.length!==fmas.length||pins.entries.some((entry,i)=>entry.fmaId!==fmas[i])||
  pins.contextEntries.length!==contextFmas.length||pins.contextEntries.some((entry,i)=>entry.fmaId!==contextFmas[i])||
  pins.tourRevision!=='right-lower-neck-vessel-scalene-orientation-v1')
  throw Error('Unexpected lower-neck tour source pins.');
const entries=pins.entries,admitted=[...entries,...pins.contextEntries];
const posterior='https://anatomy.ttuhscep.edu/nervous_system/postneck_ans.html';
const anterior='https://anatomy.ttuhscep.edu/nervous_system/antneck_tables.html';
const larynx='https://anatomy.ttuhscep.edu/schemes/larynx_ans.html';
const veins='https://anatomy.ttuhscep.edu/anatomytables/veins_head_neck.html';
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],frame:number[],caption:string,references:string[]):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,references,
  frameIds:frame.map(index=>admitted[index].id),durationMs:14000,fadeOthers:true,
});

/** Existing source surfaces in one frame; visibility is not a tissue-plane model. */
export const lowerNeckTour:RegionalTour={
  id:'right-lower-neck-vessel-scalene-orientation',
  title:'Right lower neck: scalenes & vessels',
  region:'head-neck',revision:pins.tourRevision,status:'draft',
  description:'Six stops compare two scalenes and four major vessels in their original right-sided source frame. Sternocleidomastoid and omohyoid remain faded landmarks.',
  limitations:'Selected right-sided exterior surfaces only. The first rib, clavicle, carotid sheath, brachial plexus, phrenic nerve, other branches and complete junctions are not shown in this tour. No source gap proves an interscalene or operative plane. The subclavian surfaces extend beyond the local neck focus; whole-source framing cannot certify the local vessel relationship. No connected lumen, patency, flow, compression, needle path, acquired scan or patient-space registration is established. All selected source surfaces remain anatomically unvalidated. Draft pending exact-revision radiologist review.',
  contextIds:pins.contextEntries.map(entry=>entry.id),
  requiredDisplayBundles:Object.fromEntries(admitted.map(entry=>[entry.id,entry.bundle])),
  steps:[
    stop(0,'anterior-scalene','Anterior scalene · Reference muscle','right',[0,1],
      'Begin with anterior scalene. In usual anatomy it separates the subclavian vein in front from the artery behind. The faded neck muscles orient this surface; nerves and a verified tissue gap are absent.',[posterior]),
    stop(1,'middle-scalene','Middle scalene · Posterior comparison','right',[0,1],
      'Compare middle scalene behind the anterior muscle. Their usual interval carries the subclavian artery and brachial plexus. Only the two selected muscle surfaces are framed here; no safe passage is established.',[posterior]),
    stop(2,'subclavian-artery','Subclavian artery · Behind anterior scalene','right',[0,2],
      'Select the right subclavian artery and compare it with anterior scalene. Its usual course passes behind that muscle. The supplied exterior vessel extends beyond this neck view and does not show individual branch lumens.',[posterior]),
    stop(3,'subclavian-vein','Subclavian vein · In front of anterior scalene','anterior',[0,3],
      'Now select the subclavian vein on the other side of anterior scalene. The vein usually passes in front of the muscle. It is a separate venous route, not the next segment of the artery.',[posterior,veins]),
    stop(4,'common-carotid','Common carotid · Medial vessel','anterior',[4,5],
      'Move medially to the common carotid artery. In usual anatomy it ascends beside the internal jugular vein. Fading compares the two labelled surfaces without proving a complete carotid sheath or bifurcation.',[anterior,larynx]),
    stop(5,'internal-jugular','Internal jugular · Lateral comparison','anterior',[4,5],
      'Finish on the internal jugular vein beside the common carotid. It normally joins the subclavian vein to form the brachiocephalic vein; these separate meshes do not verify that junction or a catheter route.',[posterior,larynx,veins]),
  ],
};

const tourIdentity=sourceCanonical(lowerNeckTour);
const records=new Map(admitted.map(entry=>[entry.id,sourceCanonical(entry)]));
const identities=new Set(admitted.map(entry=>entry.fmaId));
export function lowerNeckTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
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
