import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headTeachingDraftContext,blankHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';

const require=createRequire(import.meta.url);
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const at='2026-10-08T12:34:56.000Z';

test('clinical corrections remain separate from anatomy in forms, history and exports',async()=>{
  const anatomy=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const clinical=await headTeachingDraftContext(HEAD_LINK_REVISION,'brainstem-clinical');
  const Component=notesComponent();
  const html=renderToStaticMarkup(React.createElement(React.Fragment,null,
    React.createElement(Component,{context:anatomy}),React.createElement(Component,{context:clinical})));
  assert.equal((html.match(/id="head-review-notes-title"/g)||[]).length,1);
  assert.equal((html.match(/id="brainstem-clinical-notes-title"/g)||[]).length,1);
  assert.match(html,/Private brainstem clinical notes/);
  const draft=blankHeadTeachingDraft(clinical);
  const event={eventSchema:'vm-head-teaching-draft-event-1',context:clinical,version:1,savedAt:at,draft};
  const page={context:clinical,history:[event],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
  assert.equal(client.parseHeadTeachingHistory(page,clinical).history.length,1);
  const foreign={...event,context:anatomy,draft:blankHeadTeachingDraft(anatomy)};
  assert.throws(()=>client.parseHeadTeachingHistory({...page,history:[foreign]},clinical));
  assert.throws(()=>client.confirmHeadTeachingSave({review:foreign},clinical,0,draft));
  const historical=clone(clinical);historical.packetRevision='1'.repeat(64);
  const parsed=client.parseHeadTeachingHistory({...page,history:[{...event,context:historical}]},clinical);
  assert(contract.headTeachingDraftStale(parsed.history[0],clinical));
  const exported=workingCopy.headTeachingWorkingCopy(clinical,draft,
    {baseVersion:0,unsavedChanges:true,saveUncertain:false,reloadRequired:false},at);
  assert.equal(exported.kind,'head-brainstem-clinical');
  assert.deepEqual(exported.context,clinical);
  for(const flag of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(exported[flag],false);
});

function notesComponent(){
  const source=readFileSync(new URL('../components/HeadTeachingReviewNotes.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadTeachingReviewNotes:React.ComponentType<any>}};
  const load=(id:string)=>id==='../lib/head-review-working-copy'?workingCopy:id==='../lib/head-teaching-review-contract'?contract:id==='../lib/head-teaching-review-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch(){throw Error('SSR must not fetch');}}:id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  return mod.exports.HeadTeachingReviewNotes;
}

test('private notes form renders draft-only controls and exact packet revision',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const html=renderToStaticMarkup(React.createElement(notesComponent(),{context}));
  assert.match(html,/Private review notes/);
  assert.match(html,/self-reported, not verified credentials/);
  assert.match(html,/Do not enter patient data/);
  assert.match(html,/These notes do not approve, publish or modify/);
  assert.match(html,/value="draft"/);
  assert.match(html,/value="changes-required"/);
  assert(!/value="approved"|value="rejected"|attest|sign.off button/i.test(html));
  assert.match(html,/Save private draft/);
  assert.match(html,/<button type="button">Download working copy<\/button>/);
  assert(html.indexOf('Download working copy')>html.indexOf('</fieldset>'),'download remains outside disabled editing fields');
  assert(html.includes(context.packetRevision.slice(0,12)));
  assert(!html.includes('Clinical approval granted'));
  for(const check of context.checklist)assert(html.includes(check.label.replaceAll('&','&amp;')));
});

test('history parser requires matching current context, strict ordered versions and cursor',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION),draft=blankHeadTeachingDraft(context);
  const event=(version:number,recordContext=context)=>({eventSchema:'vm-head-teaching-draft-event-1',context:recordContext,version,savedAt:at,draft});
  const page={context,history:[event(22),event(21)],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
  assert.deepEqual(client.parseHeadTeachingHistory(page,context).history.map(record=>record.version),[22,21]);
  const prior=clone(context);prior.packetRevision='1'.repeat(64);prior.checklistVersion='head-teaching-draft-review-old';
  const historical={...page,history:[event(22),event(21,prior)]};
  const parsed=client.parseHeadTeachingHistory(historical,context);
  assert.equal(parsed.history.length,2);
  assert.equal(contract.headTeachingDraftStale(parsed.history[1],context),true);
  for(const changed of [
    {...page,context:prior},
    {...page,history:[event(21),event(22)]},
    {...page,history:[event(22),event(22)]},
    {...page,history:[event(22),event(21)],nextBefore:21},
    {...page,history:[event(22),event(21)],scope:'public'},
    {...page,history:[event(22),event(21)],extra:true},
    {...page,history:[{...event(22),draft:{...draft,status:'approved'}}]},
  ])assert.throws(()=>client.parseHeadTeachingHistory(changed,context));
  assert.throws(()=>client.parseHeadTeachingHistory(page,context,22),'exclusive before cursor');
  const twenty=Array.from({length:20},(_,index)=>event(20-index));
  assert.equal(client.parseHeadTeachingHistory({...page,history:twenty,nextBefore:1},context).nextBefore,1);
  assert.throws(()=>client.parseHeadTeachingHistory({...page,history:twenty,nextBefore:null},context));
  assert.throws(()=>client.parseHeadTeachingHistory({...page,history:[...twenty,event(0)],nextBefore:0},context));
});

test('save confirmation binds exact context, next version and normalized draft content',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION),blank=blankHeadTeachingDraft(context);
  const unsaved={...blank,reviewer:'  Synthetic Reader  ',notes:'  Synthetic correction request.  ',status:'changes-required' as const};
  const normalized=contract.validateHeadTeachingDraft(unsaved,context);
  const saved={eventSchema:'vm-head-teaching-draft-event-1',context,version:8,savedAt:at,draft:normalized};
  assert.deepEqual(client.confirmHeadTeachingSave({review:saved},context,7,unsaved),saved);
  const prior=clone(context);prior.packetRevision='1'.repeat(64);
  for(const response of [
    {review:{...saved,version:9}},
    {review:{...saved,context:prior}},
    {review:{...saved,draft:{...normalized,notes:'Different server text.'}}},
    {review:{...saved,draft:{...normalized,status:'approved'}}},
    {review:saved,clinicalApproval:true},
    {error:'unconfirmed'},
  ])assert.throws(()=>client.confirmHeadTeachingSave(response,context,7,unsaved));
  assert.throws(()=>client.confirmHeadTeachingSave({review:saved},context,8,unsaved));
});
