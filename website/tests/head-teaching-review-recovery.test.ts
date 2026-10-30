import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {blankHeadTeachingDraft,headTeachingDraftContext} from '../lib/head-teaching-review-contract.ts';
import {claimRecoveryRecord,clearRecoveryRecord,createRecoveryRecord,detachRecoveryRecord,exactRecoveryContext,reattachRecoveryRecord,updateRecoveryRecord,recoveryCapacityRemaining} from '../lib/head-teaching-review-recovery.ts';

test('raw invalid edits survive a detached same-document instance only for exact identity and source',async()=>{
  const source=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const baseline=blankHeadTeachingDraft(source);
  const raw={...baseline,reviewer:'  unfinished ',notes:'  <unfinished correction>  '};
  const initial=createRecoveryRecord(source,'account-A',{draft:raw,baseline,baseVersion:7,dirty:true,uncertain:false,reloadRequired:false,writeInFlight:false});
  assert(initial);
  const detached=detachRecoveryRecord(initial.id,initial.generation,false);
  assert(detached);
  assert.equal(claimRecoveryRecord(source,'account-B'),null);
  const different={...source,checklist:[...source.checklist].reverse()};
  assert.notEqual(exactRecoveryContext(source),exactRecoveryContext(different));
  assert.equal(claimRecoveryRecord(different,'account-A'),null);
  const claimed=claimRecoveryRecord(source,'account-A');
  assert(claimed);
  assert.deepEqual(claimed.snapshot.draft,raw);
  assert.equal(claimed.snapshot.baseVersion,7);
  assert.equal(claimRecoveryRecord(source,'account-A'),null,'claimed record cannot be exposed twice');
  assert(clearRecoveryRecord(claimed.id,claimed.generation));
});

test('uncertain in-flight unmount and generation-aware clearing protect newer edits',async()=>{
  const source=await headTeachingDraftContext(HEAD_LINK_REVISION),baseline=blankHeadTeachingDraft(source);
  const snapshot={draft:{...baseline,notes:'first'},baseline,baseVersion:3,dirty:true,uncertain:false,reloadRequired:false,writeInFlight:true};
  const initial=createRecoveryRecord(source,'account-C',snapshot);assert(initial);
  const stale=initial.generation;
  const changed=updateRecoveryRecord(initial.id,stale,{...snapshot,draft:{...baseline,notes:'newer'}});assert(changed);
  assert.equal(clearRecoveryRecord(initial.id,stale),false);
  const detached=detachRecoveryRecord(initial.id,changed,true);assert(detached);
  const claimed=claimRecoveryRecord(source,'account-C');assert(claimed);
  assert.equal(claimed.snapshot.uncertain,true);
  assert.equal(claimed.snapshot.writeInFlight,true);
  assert.equal(claimed.snapshot.draft.notes,'newer');
  const detachedAgain=detachRecoveryRecord(claimed.id,claimed.generation,false);assert(detachedAgain);
  const reattached=reattachRecoveryRecord(claimed.id,detachedAgain);assert(reattached);
  assert.equal(clearRecoveryRecord(claimed.id,detachedAgain),false);
  assert(clearRecoveryRecord(claimed.id,reattached));
});

test('bounded memory refuses another private draft without evicting existing work',async()=>{
  const source=await headTeachingDraftContext(HEAD_LINK_REVISION),baseline=blankHeadTeachingDraft(source);
  const snapshot={draft:baseline,baseline,baseVersion:0,dirty:true,uncertain:false,reloadRequired:false,writeInFlight:false};
  const handles=[];
  for(let index=0;index<32;index++){
    const entry=createRecoveryRecord(source,'account-cap-'+index,snapshot);assert(entry);handles.push(entry);
  }
  assert.equal(recoveryCapacityRemaining(),false);
  assert.equal(createRecoveryRecord(source,'extra-account',snapshot),null);
  const first=handles[0];const detached=detachRecoveryRecord(first.id,first.generation,false);assert(detached);
  const preserved=claimRecoveryRecord(source,'account-cap-0');assert(preserved);
  assert(clearRecoveryRecord(preserved.id,preserved.generation));
  for(const entry of handles.slice(1))assert(clearRecoveryRecord(entry.id,entry.generation));
  assert.equal(recoveryCapacityRemaining(),true);
});

test('two same-context form copies retain distinct generations and cannot clear each other',async()=>{
  const source=await headTeachingDraftContext(HEAD_LINK_REVISION),baseline=blankHeadTeachingDraft(source);
  const snapshot=(notes:string)=>({draft:{...baseline,notes},baseline,baseVersion:0,dirty:true,uncertain:false,reloadRequired:false,writeInFlight:false});
  const a=createRecoveryRecord(source,'account-shared',snapshot('copy A'));
  const b=createRecoveryRecord(source,'account-shared',snapshot('copy B'));
  assert(a&&b&&a.id!==b.id);
  const detachedA=detachRecoveryRecord(a.id,a.generation,false),detachedB=detachRecoveryRecord(b.id,b.generation,false);
  assert(detachedA&&detachedB);
  const newest=claimRecoveryRecord(source,'account-shared');assert(newest);
  assert.equal(newest.snapshot.draft.notes,'copy B');
  assert.equal(clearRecoveryRecord(a.id,detachedA),true);
  assert.equal(claimRecoveryRecord(source,'account-shared'),null,'clearing A never reclaims or removes B');
  assert.equal(clearRecoveryRecord(newest.id,newest.generation),true);
});
