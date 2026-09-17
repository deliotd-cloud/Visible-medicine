import pins from '../content/bowel-component-pins.json' with {type:'json'};
import type {BodyCatalog} from '../app/body-types';
import type {DissectionAction} from '../app/dissection-data';
import {sourceCanonical} from './body-source-additions';
const expected=new Map(pins.entries.map(s=>[s.id,sourceCanonical(s)]));
const expectedFmas=new Set(pins.entries.map(s=>s.fmaId));
const inRegion=(s:{regions:string[]},r:string)=>r==='whole-body'||s.regions.includes(r);
function sourceValid(catalog:BodyCatalog){
 if(catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
 const found=catalog.structures.filter(s=>expected.has(s.id)||expectedFmas.has(s.fmaId));
 return found.length===expected.size&&new Set(found.map(s=>s.id)).size===expected.size&&found.every(s=>sourceCanonical(s)===expected.get(s.id))&&pins.bundles.every(b=>{
  const actual=catalog.bundles.filter(x=>x.id===b.id);return actual.length===1&&sourceCanonical(actual[0])===sourceCanonical(b);
 });
}
/** Source ownership navigation only: no duplicate meshes or bowel continuity claim. */
export function bowelComponentInfo(catalog:BodyCatalog,region:string,side:string,selectedId:string,exam=false){
 if(exam||!['both','left','right'].includes(side)||!['abdomen','pelvis','whole-body'].includes(region))return null;
 const selected=catalog.structures.find(s=>s.id===selectedId);
 if(!selected||!expected.has(selected.id)||!inRegion(selected,region)||!sourceValid(catalog))return null;
 const groups=pins.definitions.filter(d=>d.fmas.includes(selected.fmaId)).map(d=>({key:d.key,title:d.title,rows:d.fmas.map(fma=>{
  const structure=catalog.structures.find(s=>expected.has(s.id)&&s.fmaId===fma)!;
  return {structure,availableHere:inRegion(structure,region),aggregate:fma===d.parentFma};
 })}));
 return {selected,groups:groups.map(g=>({...g,completeHere:g.rows.every(r=>r.availableHere)}))};
}
export function bowelComponentPlan(catalog:BodyCatalog,region:string,side:string,selectedId:string,key:string,exam=false){
 const info=bowelComponentInfo(catalog,region,side,selectedId,exam),group=info?.groups.find(g=>g.key===key);
 if(!info||!group)return null;
 const keep=new Set(group.rows.filter(r=>r.availableHere).map(r=>r.structure.id));
 return {selectedId:info.selected.id,completeHere:group.completeHere,title:group.title,action:{type:'load-view',hiddenIds:catalog.structures.filter(s=>inRegion(s,region)&&!keep.has(s.id)).map(s=>s.id)} satisfies DissectionAction};
}
