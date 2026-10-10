// Test-only exact editorial replay. This never migrates a clinical decision.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/cardiac-cavity-depth-pins.json' with {type:'json'};
export const cardiacCavityDepthIds=pins.entries.map(e=>e.id);
export const cardiacCavityDepthReferenceKeys=[
 'cardiacCavityBloodFlow','cardiacCavityHeartbeat','cardiacCavityRightAtrialWall',
 'cardiacCavityLeftAtrium','cardiacCavityPulmonaryVeinOstia',
 'cardiacCavityRightVentricularOutflow','cardiacCavityRightVentricle','cardiacCavityLeftVentricle',
];
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function cardiacBeforeCavityDepth(api){
 assert.equal(hash(pins),'88272f65d33121607eb8978ea408ac1251856611e7640e125ad63b37e9aaf0c1');
 const entries=pins.entries.map(e=>{
  const concept=api.nestedConcepts.find(c=>c.id===e.id);assert(concept,'Missing cardiac cavity '+e.id);
  return [e.id,{anatomy:concept.sections.anatomy,function:concept.sections.function}];
 });
 const sections=Object.fromEntries(entries);
 const refs=Object.fromEntries(cardiacCavityDepthReferenceKeys.map(k=>[k,api.nestedTeachingReferences[k]]));
 if(Object.values(refs).every(r=>r===undefined)){
  for(const e of pins.entries)assert.deepEqual(sections[e.id],{anatomy:e.previous.sections.anatomy,function:e.previous.sections.function});
  return api;
 }
 assert(Object.values(refs).every(r=>r!==undefined),'Partial cardiac cavity reference addition');
 assert.equal(hash(sections),'7e546b30639bda7e620f9b6d49faad6a150549358f5d3ad21f93a2eba9ce9bb6','Unrecorded cavity teaching change');
 assert.equal(hash(refs),'c26a45865a951864ed1d7c09752cf48d41f30b3bfab1f5002c0d7b2887935879','Unrecorded cavity reference change');
 const previous=new Map(pins.entries.map(e=>[e.id,e.previous]));
 return {...api,
  nestedConcepts:api.nestedConcepts.map(c=>previous.has(c.id)?{...c,sections:{...c.sections,
   anatomy:previous.get(c.id).sections.anatomy,function:previous.get(c.id).sections.function}}:c),
  nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([k])=>!cardiacCavityDepthReferenceKeys.includes(k))),
 };
}
