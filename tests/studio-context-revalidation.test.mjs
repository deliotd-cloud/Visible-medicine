import test from 'node:test';import assert from 'node:assert/strict';
import {A,B,storageKey,revalidationFixture} from './studio-context-revalidation-fixture.mjs';
const posts=h=>h.requests.filter(r=>r.options.method==='POST');
const submitButton=h=>h.button('Create course and add content');

for(const unavailable of ['network-error','unavailable-503','malformed-receipt','opaque-409'])test(`unavailable context preserves DOM-only dirty input and guards, then explicitly revalidates: ${unavailable}`,async()=>{
 const h=revalidationFixture({setFails:true});try{
  await h.settle();h.change('Synthetic DOM-only teaching text');await h.settle();
  assert.equal(h.writes.length,0);assert.equal(h.clickLeaving(),true);assert.equal(h.unloadWarns(),true);
  h.current=unavailable;h.emit('focus');await h.settle();
  assert.equal(h.controls[0].value,'Synthetic DOM-only teaching text');assert.equal(h.unloadWarns(),true,'a failed lookup must not remove the dirty unload warning');
  assert.equal(h.clickLeaving(),true,'a failed lookup must not release navigation protection for unstored input');
  assert.equal(h.find(n=>n.type==='fieldset').props.disabled,true);assert.equal(h.find(n=>n.type==='fieldset').props.hidden,false);
  assert(h.button('Retry context check'));assert.equal(posts(h).length,0);assert.equal(h.removes.length,0);assert.doesNotMatch(h.text(),/PRIVATE/);
  h.current=A;h.emit('focus');await h.settle();assert.equal(submitButton(h).props.disabled,true,'a background success does not replace an explicit retry after unavailability');
  await h.clickButton('Retry context check');await h.settle();
  assert.equal(h.controls[0].value,'Synthetic DOM-only teaching text');assert.equal(h.find(n=>n.type==='fieldset').props.disabled,false);
  assert.equal(submitButton(h).props.disabled,false);assert.equal(h.clickLeaving(),true);assert.equal(h.unloadWarns(),true);assert.equal(posts(h).length,0);assert.equal(h.writes.length,0);
 }finally{h.dispose();}
});
test('initial unavailable context admits no retained bytes until retry and never reapplies recovery over newer input',async()=>{
 const raw='{"title":"Synthetic retained source"}',h=revalidationFixture({current:'unavailable-503',initial:{[storageKey(A)]:raw}});
 try{await h.settle();assert.equal(h.reads.length,0);assert.equal(h.controls[0].value,'');h.current=A;await h.clickButton('Retry context check');await h.settle();assert.equal(h.controls[0].value,'Synthetic retained source');const reads=h.reads.length;
  h.storageFails=true;h.change('Newer synthetic DOM-only edit');await h.settle();h.current='unavailable-503';h.visibility();await h.settle();h.current=A;await h.clickButton('Retry context check');await h.settle();
  assert.equal(h.controls[0].value,'Newer synthetic DOM-only edit');assert.equal(h.values.get(storageKey(A)),raw);assert.equal(h.reads.length,reads+1,'only the attempted failed write reads its CAS value; retry does not restore again');assert.equal(h.removes.length,0);assert.equal(h.clickLeaving(),true);
 }finally{h.dispose();}
});
test('pre-POST unavailability sends no mutation and same-scope retry preserves an ordinary explicit save',async()=>{
 const h=revalidationFixture({setFails:true});try{await h.settle();h.change('Synthetic unsent input');await h.settle();h.current='unavailable-503';await h.submit();await h.settle();assert.equal(posts(h).length,0);assert(h.button('Retry context check'));h.current=A;await h.clickButton('Retry context check');await h.settle();assert.equal(submitButton(h).props.disabled,false);assert.equal(h.controls[0].value,'Synthetic unsent input');assert.equal(posts(h).length,0);await h.submit();await h.settle();assert.equal(posts(h).length,1);assert.match(h.text(),/Saved successfully/);}finally{h.dispose();}
});
for(const outcome of ['accepted','rejected'])test(`after-write context uncertainty requires explicit reconciliation, cancellation keeps input: ${outcome}`,async()=>{
 const h=revalidationFixture({setFails:true,deferPost:true});try{await h.settle();h.change('Synthetic pending input');await h.settle();const pending=h.submit();await h.settle();assert.equal(posts(h).length,1);h.current='unavailable-503';h.finishPost(outcome==='accepted'?{ok:true,action:'create-course',courseId:'course:accepted'}:{error:'Synthetic domain refusal'},outcome==='accepted'?200:409);await pending;await h.settle();
  assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);assert.equal(h.removes.length,0);assert.equal(h.clickLeaving(),true);assert.equal(h.unloadWarns(),true);assert.equal(h.controls[0].value,'Synthetic pending input');
  h.current=A;await h.clickButton('Retry context check');await h.settle();assert.equal(submitButton(h).props.disabled,true,'identity revalidation is not a save receipt');await h.submit();await h.settle();assert.equal(posts(h).length,1);
  assert.equal(h.find(n=>n.type==='a'&&n.props.children==='Review saved items').props.target,'_blank');
  h.confirmResult=false;await h.clickButton('I checked the saved item');assert.equal(submitButton(h).props.disabled,true);assert.equal(h.controls[0].value,'Synthetic pending input');assert.equal(h.clickLeaving(),true);
  h.confirmResult=true;await h.clickButton('I checked the saved item');assert.equal(submitButton(h).props.disabled,false);assert.equal(posts(h).length,1,'acknowledgement never replays the previous mutation');assert.equal(h.removes.length,0);assert.doesNotMatch(h.text(),/Saved successfully/);
 }finally{h.dispose();}
});
test('confirmed B after an unavailable check stays closed and still warns before discarding DOM-only A input',async()=>{
 const h=revalidationFixture({setFails:true,initial:{[storageKey(B)]:'{"title":"Synthetic B retained"}'}});try{await h.settle();h.change('Synthetic A DOM only');await h.settle();h.current='network-error';h.emit('pageshow');await h.settle();h.current=B;await h.clickButton('Retry context check');await h.settle();assert.equal(h.find(n=>n.type==='fieldset').props.hidden,true);assert.equal(posts(h).length,0);assert.equal(h.removes.length,0);assert.equal(h.values.get(storageKey(B)),'{"title":"Synthetic B retained"}');assert.equal(h.controls[0].value,'Synthetic A DOM only');assert.equal(h.clickLeaving(),true);assert.equal(h.unloadWarns(),true);h.current=A;h.emit('focus');await h.settle();assert.equal(h.find(n=>n.type==='fieldset').props.disabled,true,'confirmed retirement is not undone by a background signal');}finally{h.dispose();}
});
test('a late retry comparison cannot revive a newer confirmed B refusal',async()=>{
 const h=revalidationFixture({setFails:true});try{await h.settle();h.change('Synthetic A input');await h.settle();h.current='network-error';h.emit('focus');await h.settle();h.current=A;h.pauseProbe();await h.clickButton('Retry context check');h.current=B;h.emit('focus');await h.settle();h.finishProbe();await h.settle();assert.equal(h.find(n=>n.type==='fieldset').props.disabled,true);assert.equal(h.find(n=>n.type==='fieldset').props.hidden,true);assert.equal(posts(h).length,0);assert.equal(h.writes.length,0);assert.equal(h.unloadWarns(),true);}finally{h.dispose();}
});
test('unmount cancels pending retry effects without touching old-scope bytes or writing state',async()=>{
 const raw='{"title":"Synthetic retained"}',h=revalidationFixture({initial:{[storageKey(A)]:raw}});try{await h.settle();h.current='network-error';h.emit('focus');await h.settle();h.current=A;h.pauseProbe();await h.clickButton('Retry context check');h.dispose();h.finishProbe();await h.settle();assert.equal(h.writesAfterUnmount,0);assert.equal(h.values.get(storageKey(A)),raw);assert.equal(h.removes.length,0);}finally{h.dispose();}
});
test('unavailable context while cleanup waits cannot publish an old success or clear retained bytes',async()=>{
 const h=revalidationFixture();try{await h.settle();h.change('Synthetic submitted input');await h.settle();const raw=h.values.get(storageKey(A));h.locks.held=true;const pending=h.submit();for(let i=0;i<8&&!h.queued.length;i++)await h.settle();assert.equal(h.queued.length,1,'exercise the actual pending cleanup after the response comparisons');h.current='unavailable-503';h.emit('focus');await h.settle();h.releaseLock();await pending;await h.settle();assert.equal(h.values.get(storageKey(A)),raw);assert.equal(h.removes.length,0);assert.doesNotMatch(h.text(),/Saved successfully|submitted version was saved/);assert.equal(h.unloadWarns(),true);assert(h.button('Retry context check'));h.current=A;await h.clickButton('Retry context check');await h.settle();assert.equal(submitButton(h).props.disabled,true);}finally{h.dispose();}
});
test('revalidation cannot admit a new save or acknowledge reconciliation while the original POST is pending',async()=>{
 const h=revalidationFixture({setFails:true,deferPost:true});try{await h.settle();h.change('Synthetic in-flight input');await h.settle();const pending=h.submit();await h.settle();assert.equal(posts(h).length,1);h.current='unavailable-503';h.emit('focus');await h.settle();h.current=A;await h.clickButton('Retry context check');await h.settle();assert.equal(h.button('I checked the saved item').props.disabled,true);h.confirmResult=true;await h.clickButton('I checked the saved item');assert.equal(h.confirms,0,'a still-pending save cannot be reconciled by this form');await h.submit();assert.equal(posts(h).length,1);h.finishPost();await pending;await h.settle();assert.equal(h.routes.length,0);assert.equal(h.removes.length,0);assert.equal(h.controls[0].value,'Synthetic in-flight input');await h.clickButton('Retry context check');await h.settle();assert.equal(submitButton(h).props.disabled,true);assert.equal(h.unloadWarns(),true);assert.equal(posts(h).length,1);}finally{h.dispose();}
});
