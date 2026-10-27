import assert from 'node:assert/strict';
import test from 'node:test';
import {draftKey,fixture} from './studio-release-session-action-fixture.mjs';

const currentKey=draftKey('release:one');
function old(overrides={}){return{expectedCourseId:'course:one',expectedReleaseId:'release:one',expectedVersion:'2',title:'Earlier tab-only edit',slug:'earlier-edit',summary:'Earlier unsent description',level:'Intermediate',duration:'Self-paced',outcomes:'Identify structures\nCompare views',publisherName:'School',publisherKind:'institution',visibility:'private',accessModel:'invitation',enrolmentOpen:'on',workbookIds:['workbook:one'],price:'0',currency:'GBP',...overrides};}
async function mounted(options){const h=fixture(options);await h.settle();return h;}
const offer=h=>h.find(node=>node.type==='button'&&node.props.children==='Recover earlier tab-only release edits');
async function accept(h){h.setConfirm(true);offer(h)?.props.onClick();await h.settle();}

test('matching earlier tab copy is offered but never applied without confirmation',async()=>{
  const h=await mounted({oldSession:old()});
  try{const entry=h.oldSession;assert(entry);assert(offer(h));assert.equal(h.fields.get('title'),'Original release');assert.equal(h.stored.has(currentKey),false);offer(h).props.onClick();await h.settle();assert.equal(h.confirmCalls,1);assert.equal(h.fields.get('title'),'Original release');assert.equal(h.oldSession,entry);assert.equal(h.stored.has(currentKey),false);}
  finally{h.dispose();}
});

test('explicit confirmed recovery restores form and keeps predecessor tab copy',async()=>{
  const h=await mounted({oldSession:old()});
  try{const entry=h.oldSession;await accept(h);assert.equal(h.fields.get('title'),'Earlier tab-only edit');assert.equal(h.oldSession,entry);assert.equal(h.stored.has(currentKey),false);assert.equal(offer(h),null);}
  finally{h.dispose();}
});

test('workbook selection change caused by recovery does not write to disk',async()=>{
  const h=await mounted({oldSession:old({workbookIds:[]})});
  try{await accept(h);assert.equal(h.fields.has('workbookIds'),false);assert.equal(h.stored.has(currentKey),false);await h.settle();assert.equal(h.stored.has(currentKey),false);}
  finally{h.dispose();}
});

for(const[name,options]of[
  ['durable current', {primary:old({title:'Current durable edit'})}],
  ['durable predecessor', {old:old({title:'Older device edit'})}],
  ['current session', {currentSession:old({title:'Current tab copy'})}],
])test(`${name} takes precedence over earlier tab-only offer`,async()=>{
  const h=await mounted({oldSession:old(),...options});
  try{assert.equal(offer(h),null);assert.equal(h.oldSession?.raw,JSON.stringify(old()));}
  finally{h.dispose();}
});

test('DOM-only input changed after offer refuses the earlier copy',async()=>{
  const h=await mounted({oldSession:old()});
  try{h.setConfirm(true);h.fields.set('title','Typed without change event');offer(h).props.onClick();await h.settle();assert.equal(h.fields.get('title'),'Typed without change event');assert.equal(h.oldSession?.raw,JSON.stringify(old()));assert.equal(h.stored.has(currentKey),false);}
  finally{h.dispose();}
});

test('dirty form refuses the earlier copy',async()=>{
  const h=await mounted({oldSession:old()});
  try{h.change('title','New live edit');await h.settle();const button=offer(h);assert(button?.props.disabled);h.setConfirm(true);button.props.onClick();await h.settle();assert.equal(h.fields.get('title'),'New live edit');assert(h.oldSession);}
  finally{h.dispose();}
});

test('context changes during opt-in leave both form and tab copy untouched',async()=>{
  const h=await mounted({oldSession:old()});
  try{h.setConfirm(true);h.setContext('changed');offer(h).props.onClick();await h.settle();assert.equal(h.fields.get('title'),'Original release');assert(h.oldSession);assert.equal(h.stored.has(currentKey),false);}
  finally{h.dispose();}
});

test('scope change while verification is queued cannot admit the earlier copy',async()=>{
  const h=await mounted({oldSession:old()});
  try{h.setConfirm(true);h.setContext('defer');offer(h).props.onClick();await h.settle();h.props.recoveryScope={actorId:'edu:other-author',organizationId:'org:synthetic'};h.render();h.finishVerification();await h.settle();assert.equal(h.fields.get('title'),'Original release');assert(h.oldSession);assert.equal(h.stored.has(currentKey),false);}
  finally{h.dispose();}
});

test('queued recovery lock rechecks a current key before restoring',async()=>{
  const h=await mounted({oldSession:old()});
  try{h.setConfirm(true);h.setLock('queued');offer(h).props.onClick();await h.settle();assert.equal(h.queuedLocks.length,1);h.stored.set(currentKey,JSON.stringify(old({title:'Other tab current'})));h.releaseLock();await h.settle();assert.equal(h.fields.get('title'),'Original release');assert(h.oldSession);}
  finally{h.dispose();}
});

test('confirmed same-revision save drops only the exact old session object',async()=>{
  const h=await mounted({oldSession:old()});
  try{const entry=h.oldSession;await accept(h);await h.submit();assert.equal(h.payloads.length,1);assert.equal(h.oldSession,null);assert.equal(h.stored.has(currentKey),false);assert(entry);}
  finally{h.dispose();}
});

test('changed earlier tab copy survives a confirmed save',async()=>{
  const h=await mounted({oldSession:old()});
  try{await accept(h);const later=h.replaceOldSession(old({title:'Newer tab-only edit'}));assert(later);await h.submit();assert.equal(h.oldSession,later);}
  finally{h.dispose();}
});

for(const[name,reply]of[
  ['rejected',{ok:false,status:409,body:{error:'Release changed'}}],
  ['uncertain',{ok:false,status:503,body:{error:'Service unavailable'}}],
])test(`${name} save keeps earlier tab-only copy`,async()=>{
  const h=await mounted({oldSession:old()});
  try{await accept(h);const entry=h.oldSession;h.setReply(reply);await h.submit();assert.equal(h.oldSession,entry);}
  finally{h.dispose();}
});

test('new edits while save is in flight preserve the earlier copy',async()=>{
  const h=await mounted({oldSession:old()});
  try{await accept(h);let finish;h.setFetch(()=>new Promise(resolve=>{finish=resolve;}));const pending=h.submit();for(let i=0;i<8&&!finish;i++)await Promise.resolve();assert(finish);h.change('title','Newer edit');await h.settle();finish({ok:true,status:200,json:async()=>({ok:true,action:'save-release',releaseId:'release:one'})});await pending;await h.settle();assert(h.oldSession);assert.equal(JSON.parse(h.stored.get(currentKey)).title,'Newer edit');}
  finally{h.dispose();}
});

test('unmount during deferred save preserves earlier tab-only copy',async()=>{
  const h=await mounted({oldSession:old()});
  try{await accept(h);let finish;h.setFetch(()=>new Promise(resolve=>{finish=resolve;}));const pending=h.submit();for(let i=0;i<8&&!finish;i++)await Promise.resolve();assert(finish);h.unmount();finish({ok:true,status:200,json:async()=>({ok:true,action:'save-release',releaseId:'release:one'})});await pending;assert(h.oldSession);}
  finally{h.dispose();}
});
