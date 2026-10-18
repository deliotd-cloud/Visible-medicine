import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/urinary-tract-tour-pins.json' with {type:'json'};

const fmas=['FMA7204','FMA15571','FMA7205','FMA15572','FMA15900'];
if(pins.entries.length!==fmas.length||pins.entries.some((entry,i)=>entry.fmaId!==fmas[i])||
  pins.contextEntries.length!==0||pins.bundles.length!==3||
  pins.tourRevision!=='urinary-tract-tour-20261010-r1')
  throw Error('Unexpected urinary-tract tour source pins.');
const entries=pins.entries;
const kidneyTable='https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_tables.html';
const rightFrame=[entries[0].id,entries[1].id,entries[4].id];
const leftFrame=[entries[2].id,entries[3].id,entries[4].id];
const wholeFrame=entries.map(entry=>entry.id);
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string,frameIds:string[]):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,references:[kidneyTable],
  frameIds,durationMs:14000,fadeOthers:true,
});

/** Exterior source surfaces in their common frame; the tour does not reconstruct urine flow. */
export const urinaryTractTour:RegionalTour={
  id:'urinary-tract-orientation',
  title:'Urinary tract: kidneys to bladder',
  region:'whole-body',scopeRegions:['abdomen','pelvis'],revision:pins.tourRevision,status:'draft',
  description:'Five stops orient both kidney and ureter surfaces with the urinary bladder in the original shared source frame.',
  limitations:'Draft external source surfaces only. Both ureters are recovered source surfaces; no lumen, collecting system, ureteric orifices, patency or urine flow is depicted or established. No acquired scan, patient-space registration or clinical validation. The source has a male root and is not a female-generalised model. Radiologist sign-off remains pending for this exact source and tour revision.',
  contextIds:[],
  requiredDisplayBundles:Object.fromEntries(entries.map(entry=>[entry.id,entry.bundle])),
  steps:[
    stop(0,'right-kidney','Right kidney','posterior',
      'Begin at the right kidney on the posterior abdominal wall. Kidneys are retroperitoneal; the right usually lies lower than the left.',rightFrame),
    stop(1,'right-ureter','Right ureter','right',
      'Follow the right ureter towards the pelvis. A ureter carries urine from a kidney to the bladder; this surface does not show its lumen.',rightFrame),
    stop(2,'left-kidney','Left kidney','posterior',
      'Compare the left kidney with the right. The left usually sits higher; both are retroperitoneal on the posterior abdominal wall.',leftFrame),
    stop(3,'left-ureter','Left ureter','left',
      'Trace the left ureter towards the pelvic brim and bladder. The source surfaces orient its passage without demonstrating an open channel.',leftFrame),
    stop(4,'urinary-bladder','Urinary bladder','anterior',
      'Finish at the bladder, with both kidneys and ureters in view. In usual anatomy, the ureters enter its posterior wall.',wholeFrame),
  ],
};

const tourIdentity=sourceCanonical(urinaryTractTour);
const records=new Map(entries.map(entry=>[entry.id,sourceCanonical(entry)]));
const identities=new Set(entries.map(entry=>entry.fmaId));
export function urinaryTractTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
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
