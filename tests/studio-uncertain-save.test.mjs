import test from 'node:test';
import assert from 'node:assert/strict';
import {revalidationFixture} from './studio-context-revalidation-fixture.mjs';

const posts=h=>h.requests.filter(request=>request.options.method==='POST');
const submitButton=h=>h.button('Create course and add content');

for(const outcome of ['transport rejection','malformed success','wrong-action success','malformed JSON success','HTTP 500','HTTP 502','HTTP 408'])test(`same-scope ${outcome} requires manual outcome reconciliation`,async()=>{
 const h=revalidationFixture({setFails:true});
 try{
  await h.settle();h.change('Synthetic unsent course');await h.settle();
  if(outcome==='transport rejection')h.postError=Error('PRIVATE_TRANSPORT_DIAGNOSTIC');
  else if(outcome==='malformed JSON success')h.postMalformedJson=true;
  else if(outcome.startsWith('HTTP ')){h.postStatus=Number(outcome.slice(5));h.postResult={error:'PRIVATE_SERVER_DIAGNOSTIC'};}
  else h.postResult=outcome==='malformed success'?{ok:true,action:'create-course'}:{ok:true,action:'update-course',courseId:'course:other'};
  await h.submit();await h.settle();
  assert.equal(posts(h).length,1);assert.equal(h.routes.length,0);assert.equal(h.controls[0].value,'Synthetic unsent course');
  assert.equal(h.removes.length,0);assert.equal(h.unloadWarns(),true);assert.equal(h.clickLeaving(),true);
  assert.equal(submitButton(h).props.disabled,true,'a successful identity comparison is not a save receipt');
  assert(h.button('I checked the saved item'));assert.doesNotMatch(h.text(),/signed-in context|PRIVATE_TRANSPORT_DIAGNOSTIC|PRIVATE_SERVER_DIAGNOSTIC|PRIVATE_MALFORMED_JSON/);
  await h.submit();assert.equal(posts(h).length,1);
  h.confirmResult=false;await h.clickButton('I checked the saved item');assert.equal(submitButton(h).props.disabled,true);
  h.confirmResult=true;await h.clickButton('I checked the saved item');assert.equal(submitButton(h).props.disabled,false);
  assert.doesNotMatch(h.text(),/could not confirm whether this save completed/i,'accepted acknowledgement clears the stale failure text, not just the lock');
  assert.equal(posts(h).length,1,'acknowledgement must not replay POST');
 }finally{h.dispose();}
});

test('explicit unavailable context code on HTTP 503 keeps context retry semantics',async()=>{
 const h=revalidationFixture({setFails:true});try{
  await h.settle();h.change('Synthetic unsent course');await h.settle();
  h.postStatus=503;h.postResult={code:'STUDIO_CONTEXT_UNAVAILABLE',error:'Retry context'};
  await h.submit();await h.settle();
  assert.equal(posts(h).length,1);assert(h.button('Retry context check'));
  assert.equal(h.button('I checked the saved item'),undefined);
  assert.equal(h.controls[0].value,'Synthetic unsent course');
  assert.equal(h.unloadWarns(),true);assert.equal(h.clickLeaving(),true);
 }finally{h.dispose();}
});

test('scoped invitation HTTP 500 requires reconciliation before any repeat',async()=>{
 const h=revalidationFixture({formKind:'invitation'});try{
  await h.settle();h.change('Synthetic invitation label');await h.settle();h.postStatus=500;h.postResult={error:'PRIVATE_INVITATION_FAILURE'};
  await h.submit();await h.settle();
  assert.equal(posts(h).length,1);assert(h.requests.filter(request=>request.options.method==='GET').length>=3);
  assert.equal(h.button('Retry context check'),undefined);assert(h.button('I checked the saved item'));
  assert.equal(h.button('Create invitation').props.disabled,true);assert.doesNotMatch(h.text(),/PRIVATE_INVITATION_FAILURE/);
  await h.submit();await h.settle();assert.equal(posts(h).length,1);
  h.confirmResult=false;await h.clickButton('I checked the saved item');assert.equal(posts(h).length,1);
  h.confirmResult=true;await h.clickButton('I checked the saved item');assert.equal(posts(h).length,1);assert.equal(h.button('Create invitation').props.disabled,false);
 }finally{h.dispose();}
});

test('known domain refusal remains an ordinary explicit retry',async()=>{
 const h=revalidationFixture({setFails:true});
 try{
  await h.settle();h.change('Synthetic rejected course');await h.settle();
  h.postResult={error:'Synthetic domain refusal'};h.postStatus=409;
  await h.submit();await h.settle();
  assert.equal(posts(h).length,1);assert.equal(submitButton(h).props.disabled,false);
  assert.equal(h.button('I checked the saved item'),undefined);
  assert.match(h.text(),/Synthetic domain refusal/);
  h.postStatus=200;h.postResult={ok:true,action:'create-course',courseId:'course:accepted'};
  await h.submit();await h.settle();assert.equal(posts(h).length,2);
 }finally{h.dispose();}
});
