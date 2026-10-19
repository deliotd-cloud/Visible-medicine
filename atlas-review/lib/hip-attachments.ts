import pins from '../content/hip-attachment-pins.json' with {type:'json'};
import {hipAttachments,hipAttachmentPartners} from '../content/hip-attachments';
import {sourceCanonical} from './body-source-additions';
import type {BodyCatalog} from '../app/body-types';
import type {DissectionAction} from '../app/dissection-data';
const records=new Map(pins.entries.map(s=>[s.id,sourceCanonical(s)]));
const inRegion=(s:{regions:string[]},r:string)=>r==='whole-body'||s.regions.includes(r);
function sourceValid(catalog:BodyCatalog){
  if(catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const actual=catalog.structures.filter(s=>records.has(s.id));
  return actual.length===records.size&&new Set(actual.map(s=>s.id)).size===records.size&&actual.every(s=>sourceCanonical(s)===records.get(s.id))&&pins.bundles.every(b=>{
    const matches=catalog.bundles.filter(x=>x.id===b.id);return matches.length===1&&sourceCanonical(matches[0])===sourceCanonical(b);
  });
}
/** Only admitted partners are selected; missing membranes, tendons and levels stay unmapped. */
export function hipAttachmentInfo(catalog:BodyCatalog,region:string,side:string,selectedId:string,exam=false){
  if(exam||!['both','left','right'].includes(side)||!['thigh','pelvis','spine','whole-body'].includes(region))return null;
  const selected=catalog.structures.find(s=>s.id===selectedId);
  const relationship=selected&&hipAttachments.find(a=>a.fmas.includes(selected.fmaId));
  if(!selected||!relationship||!records.has(selected.id)||!inRegion(selected,region)||(selected.laterality!=='midline'&&side!=='both'&&selected.laterality!==side)||!sourceValid(catalog))return null;
  const targetSide=selected.laterality==='midline'?side:selected.laterality;
  const rows=relationship.endpoints.map(endpoint=>({...endpoint,structures:endpoint.partners.flatMap(key=>{
    const fmas:readonly string[]=hipAttachmentPartners[key];
    return catalog.structures.filter(s=>records.has(s.id)&&fmas.includes(s.fmaId)&&(targetSide==='both'||s.laterality==='midline'||s.laterality===targetSide))
      .map(structure=>({structure,availableHere:inRegion(structure,region)}));
  })}));
  return {selected,relationship,rows,completeHere:rows.every(r=>r.structures.every(s=>s.availableHere)),reference:relationship.reference,references:relationship.references,note:relationship.note};
}
export function hipAttachmentPlan(...args:Parameters<typeof hipAttachmentInfo>):{action:DissectionAction;selectedId:string;completeHere:boolean;hasAttachmentPartners:boolean;usesConnective:boolean;unresolved:boolean}|null{
  const info=hipAttachmentInfo(...args);if(!info)return null;
  const [catalog,region]=args;
  const keepFmas=new Set<string>([...info.relationship.fmas,...info.relationship.endpoints.flatMap(e=>e.partners.flatMap(p=>[...hipAttachmentPartners[p]]))]);
  const keep=new Set(pins.entries.filter(s=>keepFmas.has(s.fmaId)).map(s=>s.id));
  return {action:{type:'load-view',hiddenIds:catalog.structures.filter(s=>inRegion(s,region)&&!keep.has(s.id)).map(s=>s.id)},selectedId:info.selected.id,completeHere:info.completeHere,
    hasAttachmentPartners:info.rows.some(r=>r.structures.length>0),usesConnective:info.rows.some(r=>r.structures.some(p=>p.structure.system==='connective')),
    unresolved:info.relationship.mappingStatus==='partial'};
}
