import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/cranial-vault-tour-pins.json' with {type:'json'};

const targetFmas=['FMA52734','FMA52788','FMA52738','FMA52735','FMA52739','FMA52789'];
if(pins.baseline!=='4624f82b6c517767238da9c31daf5d8c7fbe7d8b'||
  pins.tourRevision!=='cranial-vault-tour-20261011-r1'||
  pins.entries.length!==targetFmas.length||
  pins.entries.some((entry,i)=>entry.fmaId!==targetFmas[i])||
  pins.contextEntries.length!==0)
  throw Error('Unexpected cranial vault tour source pins.');

const entries=pins.entries;
const frameIds=entries.map(entry=>entry.id);
const anatomy='https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull';
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,frameIds:[...frameIds],
  references:[anatomy],durationMs:14000,fadeOthers:true,
});

/** The six exterior source surfaces remain in their shared frame. */
export const cranialVaultTour:RegionalTour={
  id:'cranial-vault-orientation',title:'Cranial vault: exterior orientation',
  region:'head-neck',revision:pins.tourRevision,status:'draft',
  description:'Six views orient the frontal, paired parietal and temporal, and occipital bones on assembled exterior source surfaces.',
  contextIds:[],
  requiredDisplayBundles:Object.fromEntries(entries.map(entry=>[entry.id,entry.bundle])),
  limitations:'Draft exterior source surfaces only, not a complete skull base, sutures, foramina or bone subparts. Bone laterality names refer to anatomy, not the current viewing side. No lesion, acquired imaging, patient spatial registration or clinical approval is inferred. Radiologist sign-off remains pending for these exact source records and this tour revision.',
  steps:[
    stop(0,'frontal','Frontal bone','anterior',
      'Begin at the forehead. The frontal bone forms the front of the cranial vault; the other five selected bones stay in their assembled source positions.'),
    stop(1,'right-parietal','Right parietal bone','right',
      'Turn to the anatomical right parietal bone on the upper side of the vault. Right names the bone, independent of the viewing direction.'),
    stop(2,'right-temporal','Right temporal bone','right',
      'Below the right parietal bone, find the right temporal bone along the lower side of the skull. This view shows its exterior source surface.'),
    stop(3,'occipital','Occipital bone','posterior',
      'Turn behind the skull to find the occipital bone at the back. Compare it with the paired parietal bones above.'),
    stop(4,'left-temporal','Left temporal bone','left',
      'On the anatomical left lower side, locate the left temporal bone. Its name describes the bone, not where the viewer stands.'),
    stop(5,'left-parietal','Left parietal bone','left',
      'Finish at the left parietal bone on the upper side of the vault. Compare it with the matching right parietal bone across the assembled skull.'),
  ],
};

const tourIdentity=sourceCanonical(cranialVaultTour);
const records=new Map(entries.map(entry=>[entry.id,sourceCanonical(entry)]));
const fmas=new Set(entries.map(entry=>entry.fmaId));
export function cranialVaultTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||
    catalog.license!==pins.license||
    sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
  if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||
    !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{
    const found=catalog.bundles.filter(b=>b.id===bundle.id);
    return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
  });
}
