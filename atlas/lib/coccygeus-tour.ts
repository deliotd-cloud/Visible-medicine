import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/coccygeus-tour-pins.json' with {type:'json'};

const identities=[
  ['FMA46443','vm:anatomy:body:pelvis:right:muscle:right-coccygeus','pelvis-muscles','right'],
  ['FMA46444','vm:anatomy:body:pelvis:left:muscle:left-coccygeus','pelvis-muscles','left'],
  ['FMA16586','vm:anatomy:body:pelvis:right:bone:right-hip-bone','pelvis-skeleton','right'],
  ['FMA16587','vm:anatomy:body:pelvis:left:bone:left-hip-bone','pelvis-skeleton','left'],
  ['FMA16202','vm:anatomy:body:spine:midline:bone:sacrum','spine-skeleton','midline'],
] as const;
if(pins.schemaVersion!==1||pins.baseline!=='6ce2153ec403e2abdd41a1cce897dc08f5caf338'||
  pins.catalogSha256!=='109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7'||
  pins.tourRevision!=='coccygeus-pelvic-landmarks-20261027-r1'||
  pins.entries.length!==2||pins.contextEntries.length!==3||pins.bundles.length!==3||
  [...pins.entries,...pins.contextEntries].some((entry,i)=>
    entry.fmaId!==identities[i][0]||entry.id!==identities[i][1]||
    entry.bundle!==identities[i][2]||entry.laterality!==identities[i][3])||
  sourceCanonical(pins.bundles.map(bundle=>bundle.id))!==sourceCanonical(['pelvis-muscles','pelvis-skeleton','spine-skeleton']))
  throw Error('Unexpected coccygeus tour source pins.');

const [right,left]=pins.entries,[rightHip,leftHip,sacrum]=pins.contextEntries;
const anatomy='https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html';
const stop=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],frameIds:string[],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,frameIds,caption,references:[anatomy],durationMs:14000,fadeOthers:true,
});

/** Source-bound exterior surfaces in one assembled root-body frame. */
export const coccygeusTour:RegionalTour={
  id:'coccygeus-pelvic-landmarks',title:'Coccygeus & pelvic landmarks',region:'pelvis',
  revision:pins.tourRevision,status:'draft',
  description:'Four stops compare the right and left coccygeus with paired hip bones and the sacrum. Bones fade to keep the smaller muscle surfaces visible.',
  contextIds:[rightHip.id,leftHip.id,sacrum.id],
  requiredDisplayBundles:Object.fromEntries([...pins.entries,...pins.contextEntries].map(entry=>[entry.id,entry.bundle])),
  limitations:'Two labelled coccygeus representations and three whole bones from one assembled source provide orientation only. The ischial spine and muscle attachment footprints are not separately selected or measured. Coccyx, sacrospinous ligament, levator ani and the rest of the pelvic floor are not included; no complete pelvic diaphragm or procedural plane is demonstrated. Fading is visual emphasis, not tissue removal. No acquired scan mapping, patient registration, function simulation or clinical approval. Source validation is unvalidated; revision-bound radiologist review remains pending.',
  steps:[
    stop('right-hip','Right hip bone · Anterior',rightHip.id,'anterior',[rightHip.id,sacrum.id],
      'Orient on the right hip bone beside the sacrum. Coccygeus usually begins near the right ischial spine, but this whole-bone surface does not mark a measured origin.'),
    stop('right-coccygeus','Right coccygeus · Superior',right.id,'superior',[right.id],
      'Move above the separate right coccygeus surface. In usual anatomy it runs from the ischial spine toward the side of the lower sacrum and coccyx; this source does not trace either attachment.'),
    stop('left-coccygeus','Left coccygeus · Paired',left.id,'superior',[right.id,left.id],
      'Compare the labelled left coccygeus with the faded right representation. Both labelled sides retain their supplied source positions. This comparison does not establish symmetry or a complete pelvic floor.'),
    stop('sacrum-back','Sacrum · Posterior',sacrum.id,'posterior',[sacrum.id,right.id,left.id],
      'Turn behind the sacrum and compare both coccygeus surfaces toward its lower side. The sacrum is a whole-bone landmark; the coccyx and ligament are not separately rendered.'),
  ],
};

const admittedTour=sourceCanonical(coccygeusTour);
const records=new Map([...pins.entries,...pins.contextEntries].map(entry=>[entry.id,sourceCanonical(entry)]));
const fmas=new Set<string>(identities.map(entry=>entry[0]));
/** Reject any changed tour, source record, duplicate FMA or bundle identity. */
export function coccygeusTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==admittedTour||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||
    sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(entry=>records.has(entry.id)||fmas.has(entry.fmaId));
  if(found.length!==records.size||new Set(found.map(entry=>entry.id)).size!==records.size||
    !found.every(entry=>sourceCanonical(entry)===records.get(entry.id)))return false;
  return pins.bundles.every(bundle=>{
    const matches=catalog.bundles.filter(actual=>actual.id===bundle.id);
    return matches.length===1&&sourceCanonical(matches[0])===sourceCanonical(bundle);
  });
}
