import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {parseNeonatalInboxReply} from './neonatal-inbox-contexts.mjs';

const ids=Array.from({length:10},(_,n)=>`vm:anatomy:body:head-neck:left:organ:test-${n}`);
const input={source:'a'.repeat(40),sourceTree:'b'.repeat(40),parent:'c'.repeat(40),
 parentTree:'d'.repeat(40),pinHash:'e'.repeat(64),ids,currentRenderer:'4'.repeat(64),priorRenderer:'7'.repeat(64)};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const context=id=>{const value={catalogScope:'body-display-catalog',structureId:id,checklistVersion:'body-review-1',
 structureName:'Synthetic test structure',materialHash:'1'.repeat(64),sourceHash:'2'.repeat(64),
 teachingHash:'3'.repeat(64),rendererHash:'4'.repeat(64),
 checklists:{geometry:[],teaching:[],imaging:[]},
 blockers:{geometry:[],teaching:[],imaging:['No imaging approval']},
 teachingTabs:['anatomy'],revisions:{geometry:'',teaching:'',imaging:null}};
 const scope={catalogScope:value.catalogScope,structureId:id,checklistVersion:value.checklistVersion};
 value.revisions.geometry=hash({...scope,source:value.sourceHash,renderer:value.rendererHash,checks:value.checklists.geometry});
 value.revisions.teaching=hash({...scope,source:value.sourceHash,teaching:value.teachingHash,checks:value.checklists.teaching});
 return value;};
const reply=()=>({phase:'current',input:structuredClone(input),
 contexts:Object.fromEntries(ids.map(id=>[id,context(id)]))});
const parse=value=>parseNeonatalInboxReply(JSON.stringify(value),'current',input);

test('accepts only the complete exact synthetic review-context map',()=>{
 const result=parse(reply());assert.deepEqual(Object.keys(result),ids);
});
test('rejects missing, extra and foreign IDs',()=>{
 const missing=reply();delete missing.contexts[ids[0]];
 assert.throws(()=>parse(missing),/Missing or extra context/);
 const extra=reply();extra.contexts['foreign-id']=context('foreign-id');
 assert.throws(()=>parse(extra),/Missing or extra context/);
 const foreign=reply();foreign.contexts[ids[0]].structureId=ids[1];
 assert.throws(()=>parse(foreign),/Foreign review context/);
});
test('rejects changed source, parent, pin, phase and revisions',()=>{
 for(const key of ['source','sourceTree','parent','parentTree','pinHash','currentRenderer','priorRenderer']){
  const changed=reply();changed.input[key]='f'.repeat(changed.input[key].length);
  assert.throws(()=>parse(changed),/Source identity changed/);
 }
 const phase=reply();phase.phase='prior';assert.throws(()=>parse(phase));
 const revision=reply();revision.contexts[ids[0]].revisions.teaching='f'.repeat(64);
 assert.throws(()=>parse(revision),/Teaching revision changed/);
 const geometry=reply();geometry.contexts[ids[0]].revisions.geometry='f'.repeat(64);
 assert.throws(()=>parse(geometry),/Geometry revision changed/);
 const renderer=reply();renderer.contexts[ids[0]].rendererHash='f'.repeat(64);
 assert.throws(()=>parse(renderer),/Renderer revision changed/);
});
test('rejects malformed or approval-bearing replies',()=>{
 const approval=reply();approval.contexts[ids[0]].approval={status:'approved'};
 assert.throws(()=>parse(approval));
 const imaging=reply();imaging.contexts[ids[0]].revisions.imaging='7'.repeat(64);
 assert.throws(()=>parse(imaging),/No imaging approval/);
 const unblocked=reply();unblocked.contexts[ids[0]].blockers.imaging=[];
 assert.throws(()=>parse(unblocked),/remains blocked/);
 assert.throws(()=>parseNeonatalInboxReply('{','current',input));
});
