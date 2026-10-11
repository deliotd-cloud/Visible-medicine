import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/pulmonary-venous-tour-pins.json' with {type:'json'};

const targetFmas=['FMA49914','FMA49911','FMA49916','FMA49913'];
const contextFmas=['FMA7395','FMA50872','FMA7396','FMA50873'];
if(pins.baseline!=='74a9c14258969ae33324d3f680be0f364e270463'||
  pins.tourRevision!=='pulmonary-venous-hilar-relationships-20261011-r1'||
  sourceCanonical(pins.entries.map(s=>s.fmaId))!==sourceCanonical(targetFmas)||
  sourceCanonical(pins.contextEntries.map(s=>s.fmaId))!==sourceCanonical(contextFmas))
  throw Error('Unexpected pulmonary venous tour source pins.');

const entries=pins.entries,context=pins.contextEntries;
const reference='https://anatomy.ttuhscep.edu/schemes/lungs_ans.html';
const frame=(side:number)=>[entries[side*2].id,entries[side*2+1].id,context[side*2].id,context[side*2+1].id];
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,frameIds:frame(Math.floor(i/2)),
  references:[reference],durationMs:14000,fadeOthers:true,
});

/** Existing donor surfaces stay assembled; proximity does not demonstrate a connection. */
export const pulmonaryVenousTour:RegionalTour={
  id:'pulmonary-venous-hilar-relationships',title:'Pulmonary veins: paired hilar relationships',
  region:'thorax',revision:pins.tourRevision,status:'draft',
  description:'Four stops compare the paired pulmonary vein source segments with the main bronchus and pulmonary artery on each anatomical side.',
  contextIds:context.map(s=>s.id),
  requiredDisplayBundles:Object.fromEntries([...entries,...context].map(s=>[s.id,s.bundle])),
  limitations:'Selected exterior donor segments only, not complete pulmonary venous anatomy. Grouped file counts do not identify named tributaries or atrial ostia. These meshes demonstrate neither atrial connection, ostial count, validated branches, full drainage territory nor flow. Laterality names refer to anatomy, not screen side. Fading and framing retain stable assembled source geometry; they are not dissection or CT/MRI image planes. No patient registration or clinical approval is inferred. Clinical draft pending revision-bound radiologist sign-off for these exact source records and tour revision.',
  steps:[
    stop(0,'right-superior','Right superior pulmonary vein','anterior',
      'Begin with the right superior pulmonary vein segment. Compare it with the faded right inferior vein, main bronchus and pulmonary artery. Usual hilar veins lie anteriorly and inferiorly; the bronchus lies posteriorly.'),
    stop(1,'right-inferior','Right inferior pulmonary vein','right',
      'Turn to the anatomical right and highlight the right inferior vein segment. Compare the faded superior vein and bronchus; the right pulmonary artery is usually anterior to the bronchus. Right names anatomy, not screen side.'),
    stop(2,'left-superior','Left superior pulmonary vein','anterior',
      'Cross to the left superior pulmonary vein segment. Keep the faded left inferior vein, main bronchus and artery in view. The left pulmonary artery is usually superior to the bronchus.'),
    stop(3,'left-inferior','Left inferior pulmonary vein','left',
      'Finish at the left inferior vein segment from the anatomical left. Compare the faded superior vein, posterior bronchus and superior artery within this assembled source frame. Surface proximity does not prove an atrial connection.'),
  ],
};

const tourIdentity=sourceCanonical(pulmonaryVenousTour);
const records=new Map([...entries,...context].map(s=>[s.id,sourceCanonical(s)]));
const fmas=new Set([...entries,...context].map(s=>s.fmaId));
export function pulmonaryVenousTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||
    catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
  if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||
    !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{
    const found=catalog.bundles.filter(b=>b.id===bundle.id||b.url===bundle.url||b.sha256===bundle.sha256);
    return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
  });
}
