// Copy into website/tests before running. This checks the admitted website
// delivery against the real, clean Atlas source and its message channel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headInlineDestination,headInlineMatches} from '../lib/head-inline-comparison.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {HEAD_FOCUS_PROTOCOL,headFocusResult} from '../lib/head-guided-focus.ts';

for(const modality of ['CT','MRI'])test(`admitted ${modality} model access recovers through a fresh Atlas session and exact selection`,async()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
  assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
  assert.equal(pin.reviewIntegration,'c0f6629f7796c7238f0773bc7527b6c44896c6be5e7b6e1eede7f1ca913a93d0');
  const previousPin=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-before-head-access-20261022.json',import.meta.url)));
  assert.throws(()=>validateCurrentAtlasDelivery({pin:previousPin}),'prior source cannot admit the new delivery');
  const previousAtlas=process.env.VM_ATLAS_SOURCE_REPO;
  if(!previousAtlas)process.env.VM_ATLAS_SOURCE_REPO=fileURLToPath(new URL('../../atlas/',import.meta.url));
  let atlas;
  try{atlas=currentAtlasDeliveryRoot();} // checks clean HEAD and exact tree
  finally{
    if(previousAtlas===undefined)delete process.env.VM_ATLAS_SOURCE_REPO;
    else process.env.VM_ATLAS_SOURCE_REPO=previousAtlas;
  }
  const channelPath='lib/head-selection-channel.ts';
  const committed=execFileSync('git',['show',`${pin.source}:${channelPath}`],
    {cwd:atlas,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.deepEqual(readFileSync(join(atlas,channelPath)),committed,'exercise committed Atlas channel bytes');
  const {build}=await import(pathToFileURL(join(atlas,'scripts/workspace-test-build.mjs')).href);
  const built=await build({stdin:{contents:"export * from './lib/head-selection-channel';",resolveDir:atlas,loader:'ts'},
    bundle:true,write:false,platform:'node',format:'esm'});
  const channelApi=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
  assert.equal(channelApi.HEAD_SELECTION_PROTOCOL,HEAD_SELECTION_PROTOCOL);
  const pons=headInlineDestination('brainstem-pons',HEAD_LINK_REVISION,modality);
  const midbrain=headInlineDestination('brainstem-midbrain',HEAD_LINK_REVISION,modality);
  assert(pons&&midbrain,'both targets resolve through the current imported head manifest');
  assert.equal(pons.sourceRevision,pin.source);
  assert.equal(midbrain.sourceRevision,pin.source);
  assert.equal(pons.scope,midbrain.scope,'the current two concepts share a reusable source frame');
  assert.notDeepEqual(pons.target,midbrain.target);

  const origin='https://visible-medicine.example.test',sent=[],listeners=new Set();
  const parent={postMessage(message,target){assert.equal(target,origin);sent.push(message);}};
  const win={parent,location:{origin},addEventListener(name,fn){assert.equal(name,'message');listeners.add(fn);},
    removeEventListener(name,fn){assert.equal(name,'message');listeners.delete(fn);}};
  const emit=(data,source=parent,where=origin)=>{
    for(const listener of [...listeners])listener({data,source,origin:where});
  };
  const microtask=()=>Promise.resolve();
  const oldSession='old-head-session-12345678',deniedSession='denied-head-session-12345678',freshSession='fresh-head-session-12345678';
  const request=session=>({type:HEAD_SELECTION_PROTOCOL+'-request',version:1,session});
  let snapshot={status:'blocked',reason:'sign-in'},focuses=0;
  const channel=channelApi.connectHeadSelectionChannel(win,pin.source,()=>snapshot,target=>{
    assert.deepEqual(target,midbrain.target,'Atlas receives the exact authored target');
    focuses++;return true;
  });
  try{
    assert.deepEqual(sent.pop(),{type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision:pin.source});
    emit(request(oldSession));await microtask();
    const blocked=sent.at(-1);
    assert.equal(parseHeadSelection(blocked,pin.source,oldSession,0)?.reason,'sign-in');
    assert.equal(parseHeadSelection({...blocked,patientId:'private'},pin.source,oldSession,0),null);
    const blockedCount=sent.length;
    channel.publish();await microtask();assert.equal(sent.length,blockedCount,'same blocked cause is silent');
    const oldCommand={type:HEAD_FOCUS_PROTOCOL,version:1,revision:pin.source,
      session:oldSession,command:1,target:midbrain.target};
    emit(oldCommand);await microtask();
    assert.equal(focuses,0);
    assert.equal(sent.length,blockedCount,'resource-blocked session cannot acknowledge a command');

    snapshot={status:'blocked',reason:'access-denied'};
    channel.publish();await microtask();
    assert.deepEqual(sent.at(-1),{type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision:pin.source},'changed access cause requires a new handshake');
    const changedCount=sent.length;emit(oldCommand);assert.equal(sent.length,changedCount);
    emit(request(deniedSession));await microtask();
    const denied=sent.at(-1);
    assert.equal(parseHeadSelection(denied,pin.source,deniedSession,0)?.reason,'access-denied');
    assert.equal(parseHeadSelection({...denied,url:'/private-model'},pin.source,deniedSession,0),null);
    emit({...oldCommand,session:deniedSession});assert.equal(focuses,0);assert.equal(sent.at(-1),denied);

    snapshot={status:'selected',selection:pons.target};
    channel.publish();await microtask();
    assert.deepEqual(sent.at(-1),{type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision:pin.source},
      'source recovery announces readiness without leaking an old selection');
    const retiredCount=sent.length;
    emit({...oldCommand,command:2});
    emit(request(oldSession),{},origin);
    emit(request(oldSession),parent,'https://foreign.invalid');
    assert.equal(sent.length,retiredCount,'retired command and untrusted requests cannot restart focus');
    emit({...request(freshSession),patientId:'private'});
    assert.equal(sent.length,retiredCount,'unknown/private request fields are refused');

    emit(request(freshSession));await microtask();
    const initial=parseHeadSelection(sent.at(-1),pin.source,freshSession,0);
    assert.equal(initial?.concept?.conceptId,'brainstem-pons');
    assert.equal(headInlineMatches(initial,'brainstem-midbrain'),false);
    assert.equal(parseHeadSelection({...sent.at(-1),accessToken:'private'},pin.source,freshSession,0),null);
    assert.equal(parseHeadSelection({...sent.at(-1),selection:{...pons.target,patientId:'private'}},pin.source,freshSession,0),null);
    assert.equal(parseHeadSelection(sent.at(-1),pin.source,oldSession,0),null);

    const command={...oldCommand,session:freshSession};
    const beforeInvalid=sent.length;
    emit({...command,patientId:'private'});
    emit({...command,target:{...midbrain.target,coordinates:[1,2,3]}});
    assert.equal(sent.length,beforeInvalid,'unknown/private command fields are refused');
    assert.equal(focuses,0);
    emit(command);await microtask();
    assert.equal(focuses,1);
    const ack=sent.findLast(m=>m.type===HEAD_FOCUS_PROTOCOL+'-result');
    assert.equal(headFocusResult(ack,pin.source,freshSession,1),'accepted');
    assert.equal(headFocusResult(ack,pin.source,oldSession,1),null);
    assert.equal(headFocusResult({...ack,patientId:'private'},pin.source,freshSession,1),null);
    const beforeSelection=parseHeadSelection(sent.at(-1),pin.source,freshSession,initial.sequence);
    assert.equal(beforeSelection?.concept?.conceptId,'brainstem-pons');
    assert.equal(headInlineMatches(beforeSelection,'brainstem-midbrain'),false,'ACK alone is not confirmation');
    emit(command);assert.equal(focuses,1,'a consumed command cannot replay');

    snapshot={status:'selected',selection:midbrain.target};
    channel.publish();await microtask();
    const confirmed=parseHeadSelection(sent.at(-1),pin.source,freshSession,beforeSelection.sequence);
    assert.equal(confirmed?.concept?.conceptId,'brainstem-midbrain');
    assert.equal(headInlineMatches(confirmed,'brainstem-midbrain'),true);
    assert.equal(parseHeadSelection(sent.at(-1),pin.source,freshSession,confirmed.sequence),null,
      'selection replay is stale');
    assert.equal(headInlineMatches(parseHeadSelection(sent.at(-1),pin.source,oldSession,0),'brainstem-midbrain'),false);
  }finally{
    channel.close();assert.equal(listeners.size,0);
  }
});
