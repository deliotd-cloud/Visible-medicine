import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/digestive-tract-tour-pins.json' with {type:'json'};

const fmas=['FMA7131','FMA7148','FMA7200','FMA7201','FMA14542','FMA14544'];
if(pins.entries.length!==fmas.length||pins.entries.some((entry,i)=>entry.fmaId!==fmas[i])||
  pins.contextEntries.length!==0||pins.bundles.length!==4||
  pins.tourRevision!=='digestive-tract-tour-20261010-r1')
  throw Error('Unexpected digestive-tract tour source pins.');
const entries=pins.entries;
const digestiveReference='https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works';
const frame=(...indices:number[])=>indices.map(i=>entries[i].id);
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string,frameIds:string[]):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,references:[digestiveReference],
  frameIds,durationMs:14000,fadeOthers:true,
});

/** Six exterior source surfaces in a common frame; their cavities and passage are not reconstructed. */
export const digestiveTractTour:RegionalTour={
  id:'digestive-tract-orientation',
  title:'Digestive tract: chest to pelvis',
  region:'whole-body',scopeRegions:['thorax','abdomen','pelvis'],revision:pins.tourRevision,status:'draft',
  description:'Six stops orient source surfaces from the thoracic oesophagus to the rectum, including the appendix as a side pouch.',
  limitations:'Draft external source surfaces only. The small and large intestines are aggregate surfaces, not individually segmented duodenum, jejunum, ileum or colon segments. The rectum is a recovered surface. No lumen continuity, patency, peristalsis, mucosal imaging, acquired CT/MRI registration or clinical validation is depicted or established. The source has a male root and is not a female-generalised model. Radiologist sign-off remains pending for this exact source and tour revision.',
  contextIds:[],
  requiredDisplayBundles:Object.fromEntries(entries.map(entry=>[entry.id,entry.bundle])),
  steps:[
    stop(0,'oesophagus','Oesophagus','anterior',
      'Begin with the oesophagus in the chest. In usual digestion, swallowed material passes down this tube towards the stomach.',frame(0,1)),
    stop(1,'stomach','Stomach','anterior',
      'The stomach receives material from the oesophagus and mixes it with digestive juices before emptying into the small intestine.',frame(0,1,2)),
    stop(2,'small-intestine','Small intestine','anterior',
      'The small intestine includes duodenum, jejunum and ileum. Most digested nutrients are absorbed here; this is one aggregate surface.',frame(1,2,3)),
    stop(3,'large-intestine','Large intestine','anterior',
      'The large intestine absorbs water as digestive waste becomes stool. Its segments are not separate meshes here.',frame(2,3,4)),
    stop(4,'appendix','Appendix','anterior',
      'The appendix is a side pouch attached to the caecum. It is not a mandatory step in the normal passage of digestive contents.',frame(3,4,5)),
    stop(5,'rectum','Rectum','anterior',
      'Finish in the pelvis at the rectum, where stool is stored before a bowel movement. This is a recovered exterior surface.',entries.map(entry=>entry.id)),
  ],
};

const tourIdentity=sourceCanonical(digestiveTractTour);
const records=new Map(entries.map(entry=>[entry.id,sourceCanonical(entry)]));
const identities=new Set(entries.map(entry=>entry.fmaId));
export function digestiveTractTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
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
