import pins from '../content/neck-attachment-pins.json' with {type:'json'};
import {neckAttachments,neckAttachmentBones,neckAttachmentReferences} from '../content/neck-attachments';
import {sourceCanonical} from './body-source-additions';
import type {BodyCatalog} from '../app/body-types';
import type {DissectionAction} from '../app/dissection-data';
const records=new Map(pins.entries.map(s=>[s.id,sourceCanonical(s)]));
const canonical=sourceCanonical;
const inRegion=(s:{regions:string[]},r:string)=>r==='whole-body'||s.regions.includes(r);
function sourceValid(catalog:BodyCatalog){
  if(catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||canonical(catalog.coordinateSystem)!==canonical(pins.coordinateSystem))return false;
  const actual=catalog.structures.filter(s=>records.has(s.id));
  return actual.length===records.size&&new Set(actual.map(s=>s.id)).size===records.size&&actual.every(s=>sourceCanonical(s)===records.get(s.id))&&pins.bundles.every(b=>{
    const matches=catalog.bundles.filter(x=>x.id===b.id);return matches.length===1&&canonical(matches[0])===canonical(b);
  });
}
/** Shared midline partners and sided scapulae; no inferred mirror or attachment point. */
export function neckAttachmentInfo(catalog:BodyCatalog,region:string,side:string,selectedId:string,exam=false){
  if(exam||!['both','left','right'].includes(side)||!['spine','shoulder-arm','whole-body'].includes(region))return null;
  const selected=catalog.structures.find(s=>s.id===selectedId);
  const relationship=selected&&neckAttachments.find(a=>a.fmas.includes(selected.fmaId));
  if(!selected||!relationship||!records.has(selected.id)||!inRegion(selected,region)||(side!=='both'&&selected.laterality!==side)||!sourceValid(catalog))return null;
  const sideIndex=selected.laterality==='right'?0:1;
  const rows=relationship.endpoints.map(endpoint=>({...endpoint,structures:endpoint.bones.map(bone=>{
    const candidates:readonly string[]=neckAttachmentBones[bone],fma=candidates[candidates.length===1?0:sideIndex];
    const structure=catalog.structures.find(s=>records.has(s.id)&&s.fmaId===fma)!;
    return {structure,availableHere:inRegion(structure,region)};
  })}));
  return {selected,relationship,rows,completeHere:rows.every(r=>r.structures.every(s=>s.availableHere)),reference:neckAttachmentReferences[relationship.reference],note:relationship.note};
}
export function neckAttachmentPlan(...args:Parameters<typeof neckAttachmentInfo>):{action:DissectionAction;selectedId:string;completeHere:boolean}|null{
  const info=neckAttachmentInfo(...args);if(!info)return null;
  const [catalog,region]=args;
  // Both muscle homologues and paired bones remain available to the side switch;
  // midline bones are kept once. Never import outside-region partners on Show.
  const keepFmas=new Set<string>([...info.relationship.fmas,...info.relationship.endpoints.flatMap(e=>e.bones.flatMap(b=>[...neckAttachmentBones[b]]))]);
  const keep=new Set(pins.entries.filter(s=>keepFmas.has(s.fmaId)).map(s=>s.id));
  return {action:{type:'load-view',hiddenIds:catalog.structures.filter(s=>inRegion(s,region)&&!keep.has(s.id)).map(s=>s.id)},selectedId:info.selected.id,completeHere:info.completeHere};
}
