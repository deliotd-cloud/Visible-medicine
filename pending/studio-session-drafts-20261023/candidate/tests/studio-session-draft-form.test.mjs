import assert from 'node:assert/strict';
import test from 'node:test';
import {A,B,storageKey,formFixture,sessionDrafts} from './studio-session-draft-fixture.mjs';
const key=scope=>JSON.stringify(['v1',scope.actorId,scope.organizationId,'new-course']);
const recover=h=>h.find(n=>n.type==='button'&&n.props.children==='Recover tab-only edits');
const gets=h=>h.requests.filter(r=>r.options.method==='GET');
const posts=h=>h.requests.filter(r=>r.options.method==='POST');

test('blocked storage retains a document-only copy before unmount; remount requires explicit recovery and keeps warnings',async()=>{
 const first=formFixture({storageBlocked:true});let owner;
 try{await first.settle();owner=first.document;first.change('Unsent anatomy course');await first.settle();
  assert.equal(JSON.parse(sessionDrafts.readStudioSessionDraft(owner,key(A)).raw).title,'Unsent anatomy course');
  assert.match(first.text(),/temporary copy.*website session/i);assert.equal(posts(first).length,0);
 }finally{first.dispose();}
 const second=formFixture({ownerDocument:owner,storageBlocked:true});
 try{assert.equal(second.controls[0].value,'');await second.settle();assert(gets(second).length>0);assert(recover(second));
  assert.equal(second.controls[0].value,'','no automatic input replacement');
  const focus=[];second.controls[0].focus=options=>focus.push(options);
  recover(second).props.onClick();await second.settle();
  assert.equal(second.controls[0].value,'Unsent anatomy course');
  assert.deepEqual(focus,[{preventScroll:true}],'explicit recovery hands focus to the restored form');
  assert.match(second.text(),/not saved on this device/);assert.match(second.text(),/Recovered tab-only edits/);
  assert.equal(posts(second).length,0);assert.equal(second.routes.length,0);
 }finally{second.dispose();}
});

test('same-document Back-style remount survives unavailable locks and quota failure without claiming a durable save',async()=>{
 for(const failure of [{locksUnavailable:true},{writesBlocked:true}]){
  const first=formFixture(failure);let owner;
  try{await first.settle();owner=first.document;first.change('Private unsent title');await first.settle();assert(sessionDrafts.readStudioSessionDraft(owner,key(A)));}finally{first.dispose();}
  const second=formFixture({...failure,ownerDocument:owner});
  try{await second.settle();assert(recover(second));recover(second).props.onClick();await second.settle();assert.equal(second.controls[0].value,'Private unsent title');assert.match(second.text(),/not saved on this device/);}finally{second.dispose();}
 }
});

test('foreign document, actor, institution and failed server context cannot reveal the retained copy',async()=>{
 const owner={},raw=JSON.stringify({title:'Retained for actor A'});
 assert(sessionDrafts.retainStudioSessionDraft(owner,key(A),null,raw,{known:false,raw:null}));
 for(const options of [{scope:A,current:A,ownerDocument:{}},{scope:B,current:B,ownerDocument:owner},
  {scope:{...A,organizationId:'org-other'},current:{...A,organizationId:'org-other'},ownerDocument:owner},
  {scope:A,current:B,ownerDocument:owner},{scope:A,current:'network-error',ownerDocument:owner}]){
  const h=formFixture({...options,storageBlocked:true});try{await h.settle();assert.equal(recover(h),undefined);assert.equal(h.controls[0].value,'');assert.equal(posts(h).length,0);}finally{h.dispose();}
 }
});

test('cancelled or retired-context recovery keeps both the form and retained bytes unchanged',async()=>{
 for(const mode of ['cancel','unmount','changed-context']){
  const owner={},raw=JSON.stringify({title:'Held draft'}),retained=sessionDrafts.retainStudioSessionDraft(owner,key(A),null,raw,{known:false,raw:null});
  const h=formFixture({ownerDocument:owner,storageBlocked:true});
  try{await h.settle();const button=recover(h);assert(button);
   if(mode==='cancel')h.confirmResult=false;
   else if(mode==='unmount')h.onConfirm=()=>h.dispose();
   else h.onConfirm=()=>{h.current=B;h.emit('focus');};
   button.props.onClick();await h.settle();assert.equal(h.controls[0].value,'');
   assert.equal(sessionDrafts.readStudioSessionDraft(owner,key(A)),retained);assert.equal(posts(h).length,0);
  }finally{if(mode!=='unmount')h.dispose();}
 }
});

test('a newer device-local draft is neither overwritten nor cleared by recovering older tab-only edits',async()=>{
 const owner={},raw=JSON.stringify({title:'Tab-only text'}),old=JSON.stringify({title:'Previously owned disk text'}),fresh=JSON.stringify({title:'Different disk text'});
 sessionDrafts.retainStudioSessionDraft(owner,key(A),null,raw,{known:true,raw:old});
 const h=formFixture({ownerDocument:owner,initial:{[storageKey(A)]:fresh}});
 try{await h.settle();assert.equal(h.controls[0].value,'Different disk text');assert(recover(h));
  recover(h).props.onClick();await h.settle();assert.equal(h.controls[0].value,'Tab-only text');assert.equal(h.values.get(storageKey(A)),fresh);
  h.change('New tab-only text');await h.settle();assert.equal(h.values.get(storageKey(A)),fresh);assert.equal(h.removes.length,0);
  assert.equal(sessionDrafts.readStudioSessionDraft(owner,key(A)).baselineKnown,false,'foreign baseline cannot become owned after another edit');
  assert.equal(posts(h).length,0);
 }finally{h.dispose();}
});

test('confirmed durable writes and confirmed saves clear only the owned tab copy; uncertain saves keep it',async()=>{
 const durable=formFixture();try{await durable.settle();durable.change('Durable input');await durable.settle();assert.equal(sessionDrafts.readStudioSessionDraft(durable.document,key(A)),null);assert.match(durable.text(),/saved on this device only/);}finally{durable.dispose();}
 const accepted=formFixture({storageBlocked:true});try{await accepted.settle();accepted.change('Accepted input');await accepted.settle();assert(sessionDrafts.readStudioSessionDraft(accepted.document,key(A)));await accepted.submit();await accepted.settle();assert.equal(posts(accepted).length,1);assert.equal(sessionDrafts.readStudioSessionDraft(accepted.document,key(A)),null);assert.match(accepted.text(),/Saved successfully/);}finally{accepted.dispose();}
 const uncertain=formFixture({storageBlocked:true});try{await uncertain.settle();uncertain.change('Uncertain input');await uncertain.settle();const token=sessionDrafts.readStudioSessionDraft(uncertain.document,key(A));uncertain.postResult={};await uncertain.submit();await uncertain.settle();assert.equal(sessionDrafts.readStudioSessionDraft(uncertain.document,key(A)),token);assert.match(uncertain.text(),/could not confirm/);}finally{uncertain.dispose();}
});

test('incompatible shape, stale recovery token and retention budget failures do not fabricate a recoverable current copy',async()=>{
 const owner={},raw=JSON.stringify({foreignField:'Not this form'}),token=sessionDrafts.retainStudioSessionDraft(owner,key(A),null,raw,{known:false,raw:null});
 const bad=formFixture({ownerDocument:owner,storageBlocked:true});try{await bad.settle();assert(recover(bad));recover(bad).props.onClick();await bad.settle();assert.equal(bad.controls[0].value,'');assert.equal(sessionDrafts.readStudioSessionDraft(owner,key(A)),token);}finally{bad.dispose();}
 const staleOwner={},first=sessionDrafts.retainStudioSessionDraft(staleOwner,key(A),null,JSON.stringify({title:'First'}),{known:false,raw:null});
 const stale=formFixture({ownerDocument:staleOwner,storageBlocked:true});try{await stale.settle();const button=recover(stale);assert(button);sessionDrafts.retainStudioSessionDraft(staleOwner,key(A),first,JSON.stringify({title:'Later'}),{known:false,raw:null});button.props.onClick();await stale.settle();assert.equal(stale.controls[0].value,'');}finally{stale.dispose();}
 const large=formFixture({storageBlocked:true});try{await large.settle();large.change('Small copy');await large.settle();assert.match(large.text(),/temporary copy/i);large.change('x'.repeat(600*1024));await large.settle();assert.doesNotMatch(large.text(),/temporary copy/i);assert.match(large.text(),/not saved on this device/);}finally{large.dispose();}
});
