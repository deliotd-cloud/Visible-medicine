import test from 'node:test';
import assert from 'node:assert/strict';
import {A,B,storageKey,formFixture,protocol} from './studio-mutation-context-fixture.mjs';
const postRequests=h=>h.requests.filter(r=>r.options.method==='POST');
test('client context: stale mounted A props cannot restore A bytes under B or another organization',async()=>{
 for(const current of [B,{...A,organizationId:'org-b'},null]){
  const raw='{"title":"Synthetic A retained draft"}',h=formFixture({current,initial:{[storageKey(A)]:raw}});
  try{await h.settle();assert.equal(h.reads.length,0);assert.equal(h.controls[0].value,'');assert.equal(h.values.get(storageKey(A)),raw);assert.equal(postRequests(h).length,0);assert.equal(h.removes.length,0);assert.match(h.text(),/signed-in context/);assert.equal(h.find(n=>n.type==='fieldset').props.disabled,true);}finally{h.dispose();}
 }
});
test('client context: exact context restores then binds the POST and confirms before navigation/cleanup',async()=>{
 const h=formFixture({initial:{[storageKey(A)]:'{"title":"Synthetic recovered title"}'}});
 try{await h.settle();assert.equal(h.controls[0].value,'Synthetic recovered title');h.change('Synthetic saved title');await h.settle();await h.submit();await h.settle();const posts=postRequests(h);assert.equal(posts.length,1);assert.deepEqual(JSON.parse(posts[0].options.body).expectedStudioContext,A);assert.deepEqual(h.routes,['/studio/courses/course%3Aaccepted']);assert.equal(h.values.has(storageKey(A)),false);assert.match(h.text(),/Saved successfully/);assert(h.requests.filter(r=>r.options.method==='GET').length>=3);}finally{h.dispose();}
});
test('client context: A to B before submit prevents sending A form data',async()=>{
 const h=formFixture();try{await h.settle();h.change('Synthetic A unsent');await h.settle();const bytes=h.values.get(storageKey(A));h.current=B;await h.submit();await h.settle();assert.equal(postRequests(h).length,0);assert.equal(h.values.get(storageKey(A)),bytes);assert.equal(h.routes.length,0);assert.equal(h.removes.length,0);assert.match(h.text(),/signed-in context/);}finally{h.dispose();}
});
for(const outcome of ['accepted','error'])test(`client context: session changes during ${outcome} response retire stale outcome without navigation or cleanup`,async()=>{
 const h=formFixture({deferPost:true});try{await h.settle();h.change('Synthetic submitted A');await h.settle();const bytes=h.values.get(storageKey(A)),pending=h.submit();await h.settle();assert.equal(postRequests(h).length,1);h.current=B;h.finishPost(outcome==='accepted'?{ok:true,action:'create-course',courseId:'course:accepted'}:{error:'PRIVATE_STALE_A_ERROR'},outcome==='accepted'?200:409);await pending;await h.settle();assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);assert.equal(h.removes.length,0);assert.equal(h.values.get(storageKey(A)),bytes);assert.doesNotMatch(h.text(),/Saved successfully|PRIVATE_STALE/);assert.match(h.text(),/signed-in context/);assert.equal(h.find(n=>n.type==='fieldset').props.hidden,true);}finally{h.dispose();}
});
for(const event of ['focus','pageshow','visibility'])test(`client context: ${event} retires queued A writes and recovery notices on changed session`,async()=>{
 const h=formFixture({initial:{[storageKey(A)]:'{"title":"Synthetic A retained"}'}});try{await h.settle();h.locks.held=true;h.change('Queued A text');assert.equal(h.queued.length,1);h.current=B;if(event==='visibility')h.visibility();else h.emit(event);await h.settle();h.releaseLock();h.runTimers();assert.equal(h.values.get(storageKey(A)),'{"title":"Synthetic A retained"}');assert.equal(h.writes.length,0);assert.equal(h.removes.length,0);assert.match(h.text(),/signed-in context/);assert.doesNotMatch(h.text(),/Recovered an unsent/);}finally{h.dispose();}
});
test('client context: unavailable recheck after a possible commit retains uncertainty and bytes',async()=>{
 const h=formFixture({deferPost:true});try{await h.settle();h.change('Synthetic A input');await h.settle();const bytes=h.values.get(storageKey(A)),pending=h.submit();await h.settle();h.current='network-error';h.finishPost();await pending;await h.settle();assert.equal(h.values.get(storageKey(A)),bytes);assert.equal(h.removes.length,0);assert.equal(h.routes.length,0);assert.match(h.text(),/Check the saved item before retrying/);assert.doesNotMatch(h.text(),/PRIVATE_TRANSPORT/);}finally{h.dispose();}
});
test('client context: parser rejects missing malformed overlong and extra-key contexts without inventing an actor',()=>{for(const value of [undefined,null,{},[],{...A,extra:true},{...A,actorId:'actor-a'},{...A,organizationId:'x'.repeat(257)},{...A,actorId:'edu:\n'}])assert.equal(protocol.parseStudioMutationContext(value),null);assert.deepEqual(protocol.parseStudioMutationContext(A),A);});

test('client context: recovered comparison callback receives enabled committed FormData only after verification',async()=>{
 const observed=[],h=formFixture({initial:{[storageKey(A)]:'{"title":"Synthetic recovered binding"}'},onValuesChange:(form,saved)=>observed.push({title:form.get('title'),saved})});
 try{assert.deepEqual(observed,[]);assert.equal(h.reads.length,0);await h.settle();assert.deepEqual(observed,[{title:'Synthetic recovered binding',saved:{title:'Synthetic recovered binding'}}]);for(const request of h.requests){assert.equal(request.url,'/api/studio?mutationContext=1');assert.equal(request.options.cache,'no-store');assert.equal(request.options.credentials,'same-origin');assert.deepEqual(JSON.parse(request.options.headers['X-Studio-Mutation-Context']),A);}}finally{h.dispose();}
});
test('client context: missing or malformed server props cannot submit recover or persist',async()=>{
 for(const scope of [null,{actorId:'edu:',organizationId:'org-a'}]){const h=formFixture({scope,initial:{[storageKey(A)]:'{"title":"Synthetic retained"}'}});try{await h.settle();await h.submit();await h.settle();assert.equal(h.requests.length,0);assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);assert.equal(h.removes.length,0);assert.equal(h.controls[0].value,'');assert.equal(h.find(n=>n.type==='fieldset').props.disabled,true);}finally{h.dispose();}}
});
test('client context: late positive comparison cannot revive a newer failed context boundary',async()=>{
 const h=formFixture({initial:{[storageKey(A)]:'{"title":"Synthetic retained"}'}});
 try{await h.settle();h.pauseProbe();h.emit('focus');h.current=B;h.emit('focus');await h.settle();assert.match(h.text(),/signed-in context/);h.finishProbe();await h.settle();h.change('Retired input cannot persist');assert.equal(h.values.get(storageKey(A)),'{"title":"Synthetic retained"}');assert.equal(h.writes.length,0);assert.equal(h.removes.length,0);assert.equal(h.find(n=>n.type==='fieldset').props.disabled,true);assert.equal(h.find(n=>n.type==='fieldset').props.hidden,true);assert.equal(h.routes.length,0);}finally{h.dispose();}
});
