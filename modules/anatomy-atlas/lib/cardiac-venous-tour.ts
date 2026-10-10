import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/cardiac-venous-tour-pins.json' with {type:'json'};

const ids=['anterior-cardiac-vein','great-cardiac-vein','middle-cardiac-vein'].map(name=>`vm:anatomy:body:thorax:unspecified:vessel:${name}`);
const heart='vm:anatomy:body:thorax:unpaired:organ:heart';
if(sourceCanonical(pins.entries.map(s=>s.id))!==sourceCanonical([...ids,heart]))throw Error('Unexpected cardiac venous tour identities.');
const [anterior,great,middle]=ids;
const reference='https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html';
const stop=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],caption:string,frameIds=[selectedId]):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,caption,frameIds,references:[reference],durationMs:14000,fadeOthers:true,
});

/** Original spatial teaching over already admitted surfaces, never an inferred venous tree. */
export const cardiacVenousTour:RegionalTour={
  id:'cardiac-venous-surface-orientation',title:'Cardiac veins: around the heart',
  region:'thorax',revision:'cardiac-venous-surface-orientation-v1',status:'draft',
  description:'Four guided views compare three existing cardiac vein selections with the faded heart. Anterior and posterior views retain one source frame.',
  contextIds:[heart],requiredDisplayBundles:Object.fromEntries(pins.entries.map(s=>[s.id,s.bundle])),
  limitations:'Three source-defined exterior selections and one heart aggregate, not a complete drainage tree. The anterior cardiac selection groups two source files; the middle cardiac selection groups fourteen. File pieces are not clinically identified tributaries. Coronary sinus, small cardiac vein, chamber openings and smallest cardiac veins are not selected in this root tour. Do not infer a visible junction, continuous lumen, drainage territory, flow, catheter route or patient registration. The heart supplies exterior context, not separately delineated chambers. Teaching views are not CT/MRI projections. No new imaging or access entitlement. Draft pending revision-bound radiologist review.',
  steps:[
    stop('anterior-group','Anterior cardiac vein group',anterior,'anterior',
      'Start at the front of the heart. In usual anatomy, anterior cardiac veins drain towards the right atrium rather than through the coronary sinus. The highlighted source group does not demonstrate an atrial opening.'),
    stop('great-vein','Great cardiac vein',great,'left',
      'Turn left to inspect the great cardiac vein. Its usual course relates to the anterior interventricular groove and continues towards the coronary sinus. Compare the surface extent; a visible connection is not established here.'),
    stop('middle-vein','Middle cardiac vein',middle,'posterior',
      'Move behind the heart. The middle cardiac vein usually follows the posterior interventricular groove and drains into the coronary sinus. Its fourteen source pieces remain one selection, not fourteen named veins.'),
    stop('compare-routes','Compare the surface routes',anterior,'anterior',
      'Return to the front and distinguish direct anterior cardiac drainage from the coronary-sinus system associated with the great and middle veins. Rotate freely to compare the supplied surfaces; this is orientation, not a flow simulation.',[...ids,heart]),
  ],
};
const tourIdentity=sourceCanonical(cardiacVenousTour);
const records=new Map(pins.entries.map(s=>[s.id,sourceCanonical(s)]));
const fmas=new Set(pins.entries.map(s=>s.fmaId));
export function cardiacVenousTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const entries=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
  if(entries.length!==records.size||new Set(entries.map(s=>s.id)).size!==records.size||!entries.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(b=>{const matches=catalog.bundles.filter(candidate=>candidate.id===b.id);return matches.length===1&&sourceCanonical(matches[0])===sourceCanonical(b);});
}
