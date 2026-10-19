import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/portal-hepatic-tour-pins.json' with {type:'json'};

const fmas=['FMA14332','FMA14331','FMA15391','FMA50735','FMA14338','FMA14340','FMA14339','FMA10951'];
if(pins.baseline!=='b9269c83867fbcae73e0de19ae6ca818fefb713a'||pins.tourRevision!=='portal-hepatic-venous-relationships-20261014-r1'
 ||sourceCanonical(pins.entries.map(s=>s.fmaId))!==sourceCanonical(fmas)
 ||sourceCanonical(pins.contextEntries.map(s=>s.fmaId))!==sourceCanonical(['FMA7197','FMA7198','FMA7196']))throw Error('Unexpected portal/hepatic tour pins.');
const entries=pins.entries,context=pins.contextEntries,all=[...entries,...context];
const anatomy='https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html';
const portalVariants='https://pubmed.ncbi.nlm.nih.gov/21986867/';
const hepaticVariants='https://pubmed.ncbi.nlm.nih.gov/21976007/';
const stop=(index:number,id:string,view:RegionalTour['steps'][number]['view'],frame:number[],caption:string,references=[anatomy]):RegionalTour['steps'][number]=>({
 id,title:entries[index].name,selectedId:entries[index].id,view,frameIds:frame.map(i=>all[i].id),caption,references,durationMs:14000,fadeOthers:true,
});

/** Two systems compared in an assembled donor frame; not a continuous flow route. */
export const portalHepaticTour:RegionalTour={
 id:'portal-hepatic-venous-relationships',title:'Portal inflow and hepatic venous outflow',region:'abdomen',revision:pins.tourRevision,status:'draft',
 description:'Eight stops compare mesenteric/splenic portal tributaries with the portal trunk, then contrast the main hepatic veins and inferior vena cava. Liver, pancreas and spleen provide faded context.',
 contextIds:context.map(s=>s.id),requiredDisplayBundles:Object.fromEntries(all.map(s=>[s.id,s.bundle])),
 limitations:'Selected exterior source surfaces only, not a continuous blood-flow route. Portal inflow and hepatic venous outflow are separated by liver microcirculation that is not supplied here. Intrahepatic portal branches, sinusoids, complete hepatic tributaries and accessory veins are omitted. Original disconnected parts remain unbridged; gaps do not establish obstruction and adjacency does not establish a collecting junction. The corrected pancreas and liver are aggregate parent surfaces, not independently validated compartments or drainage territories. Inferior mesenteric termination and hepatic-vein collecting patterns vary; this donor is not a universal variant map. No flow, oxygenation, pressure, patency, perfusion, portal hypertension, venous congestion, procedural route or surgical safety plane is established. Source laterality names anatomy, not screen side. Stable assembled framing and fading are not dissection or CT/MRI image planes. No acquired imaging, patient-space registration or clinical approval is added. Draft pending revision-bound radiologist sign-off for these exact records and sequence.',
 steps:[
  stop(0,'superior-mesenteric','anterior',[0,1,3,9],
   'Start at the superior mesenteric vein. Compare its source segment with the splenic vein and portal trunk. Usual portal formation joins the two tributaries; these surfaces do not verify the junction.'),
  stop(1,'splenic','posterior',[0,1,3,9],
   'Turn behind the pancreatic reference and identify the splenic vein. It contributes splenic return to the portal system. The faded pancreas is an aggregate surface, not a validated neck landmark.'),
  stop(2,'inferior-mesenteric','left',[1,2,3],
   'Find the inferior mesenteric vein. CT studies describe termination into the splenic vein, the confluence or the superior mesenteric vein, among other variants. Do not infer its termination from this surface gap.',[anatomy,portalVariants]),
  stop(3,'portal-trunk','anterior',[0,1,3,9],
   'Return to the hepatic portal vein, an inflow vessel towards the liver. It is not a hepatic outflow vein. The next stops compare another system; intervening sinusoids are not segmented.'),
  stop(4,'right-hepatic','right',[4,5,6],
   'Highlight the right hepatic vein. Hepatic veins carry liver outflow towards the inferior vena cava. Compare the retained surfaces without assigning a complete drainage territory or confirming an ostium.'),
  stop(5,'middle-hepatic','anterior',[4,5,6],
   'Compare the middle hepatic vein with its neighbours. CT research describes shared middle/left collecting trunks as well as independent drainage. These disconnected source parts do not validate either arrangement.',[anatomy,hepaticVariants]),
  stop(6,'left-hepatic','left',[4,5,6],
   'Turn to the left hepatic vein. Keep it distinct from the previously highlighted portal trunk. Named hepatic veins do not account for every accessory channel, and left denotes anatomy rather than screen position.',[anatomy,hepaticVariants]),
  stop(7,'inferior-cava','posterior',[4,5,6,7],
   'Finish at the supplied inferior vena cava segment. Usual hepatic return enters this systemic vessel, while portal inflow reaches the liver first. No uninterrupted lumen, right-atrial connection or measured flow is shown.'),
 ],
};
const identity=sourceCanonical(portalHepaticTour),records=new Map(all.map(s=>[s.id,sourceCanonical(s)])),identities=new Set(all.map(s=>s.fmaId));
export function portalHepaticTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
 if(sourceCanonical(tour)!==identity||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
 const found=catalog.structures.filter(s=>records.has(s.id)||identities.has(s.fmaId));
 if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||!found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
 return pins.bundles.every(bundle=>{const found=catalog.bundles.filter(b=>b.id===bundle.id||b.url===bundle.url||b.sha256===bundle.sha256);return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);});
}
