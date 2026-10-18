import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/pancreatic-arterial-tour-pins.json' with {type:'json'};

const targetFmas=['FMA14782','FMA14784','FMA14805','FMA70479','FMA70480','FMA14787','FMA14790','FMA14792','FMA14793'];
const contextFmas=['FMA7198','FMA7196','FMA14749','FMA14773','FMA76574'];
if(pins.baseline!=='1604303bb9377dd2390e840c079652eb59c47fb0'||
 pins.tourRevision!=='pancreatic-arterial-relationships-20261012-r1'||
 sourceCanonical(pins.entries.map(s=>s.fmaId))!==sourceCanonical(targetFmas)||
 sourceCanonical(pins.contextEntries.map(s=>s.fmaId))!==sourceCanonical(contextFmas))
 throw Error('Unexpected pancreatic arterial tour source pins.');

const entries=pins.entries,context=pins.contextEntries,all=[...entries,...context];
const reference='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
const variationReference='https://link.springer.com/article/10.1186/s13244-022-01157-z';
const stop=(index:number,id:string,view:RegionalTour['steps'][number]['view'],frame:number[],caption:string):RegionalTour['steps'][number]=>({
 id,title:entries[index].name,selectedId:entries[index].id,view,caption,frameIds:frame.map(i=>all[i].id),
 references:[reference,...(index===5?[variationReference]:[])],durationMs:14000,fadeOthers:true,
});

/** Compare existing assembled surfaces; a visual gap is not an occlusion. */
export const pancreaticArterialTour:RegionalTour={
 id:'pancreatic-arterial-relationships',title:'Pancreatic arteries: head arcades to tail',
 region:'abdomen',revision:pins.tourRevision,status:'draft',
 description:'Nine stops compare anterior and posterior head vessels, then body and tail branches. The pancreas and proximal vessels remain faded landmarks.',
 contextIds:context.map(s=>s.id),
 requiredDisplayBundles:Object.fromEntries(all.map(s=>[s.id,s.bundle])),
 limitations:'Exterior source surfaces only. The pancreas is an aggregate corrected parent surface, not separately validated head, neck, body or tail compartments. Duodenum, ducts, veins and complete small branches are not supplied by this tour. Usual named arterial relationships are teaching context, not proof that these surfaces form complete anterior or posterior arcades, connected lumina or a universal branching pattern. No patency, perfusion, flow, procedural route or surgical safety plane is established. Source laterality stays unspecified for these nine arteries; screen side and camera direction do not relabel them. Stable assembled geometry and fading are not a validated dissection plane or CT/MRI image plane. No acquired imaging or patient-space registration is added. Draft pending revision-bound radiologist sign-off for the exact source records and sequence.',
 steps:[
  stop(0,'anterior-superior','anterior',[0,3,2,13],
   'Compare the anterior superior branch with the faded gastroduodenal trunk. It usually meets the anterior inferior branch around the head.'),
  stop(3,'anterior-inferior','anterior',[0,3,2,13],
   'Highlight the anterior inferior counterpart. The named pair contributes to the anterior arcade; separate surfaces do not prove continuous lumen.'),
  stop(1,'posterior-superior','posterior',[1,4,2,13],
   'Move smoothly behind the head vessels. The posterior superior branch usually arises from the gastroduodenal artery.'),
  stop(4,'posterior-inferior','posterior',[1,4,2,13],
   'Compare the posterior inferior branch with its superior counterpart. Usual posterior arcade anatomy is not a validated source connection.'),
  stop(2,'inferior-trunk','right',[2,3,4,11],
   'Find the inferior pancreaticoduodenal trunk beside the superior mesenteric artery. Its anterior and posterior branches serve the lower head and duodenum.'),
  stop(5,'dorsal','posterior',[5,6,7],
   'Compare the dorsal pancreatic surface near the pancreatic neck. Its branching arrangement varies; this is not another head arcade segment.'),
  stop(6,'inferior-body','anterior',[5,6,7],
   'Follow the inferior pancreatic body vessel, usually a dorsal pancreatic branch. Do not confuse it with the inferior pancreaticoduodenal trunk.'),
  stop(7,'great','anterior',[6,7,8],
   'Compare the great pancreatic artery, a splenic branch serving the body. Great is its name, not a mesh-size measurement.'),
  stop(8,'caudal','left',[7,8],
   'Finish at the caudal branch near the splenic hilum and pancreatic tail. Its origin can vary; no distal perfusion is shown.'),
 ],
};

const tourIdentity=sourceCanonical(pancreaticArterialTour);
const records=new Map(all.map(s=>[s.id,sourceCanonical(s)])),fmas=new Set(all.map(s=>s.fmaId));
export function pancreaticArterialTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
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
