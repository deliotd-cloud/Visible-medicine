import test from 'node:test';
import assert from 'node:assert/strict';
import {A,B,revalidationFixture} from './studio-context-revalidation-fixture.mjs';

const kinds=[['invitation','Create invitation','create-invitation'],['cohort','Create cohort','create-cohort'],['assignment','Assign workbook','assign-cohort-workbook']];
const posts=h=>h.requests.filter(request=>request.options.method==='POST');
const probes=h=>h.requests.filter(request=>request.options.method==='GET');

for(const [formKind,label,action] of kinds){
 test(`${formKind}: scoped admission, exact POST, and no invitation or group local persistence`,async()=>{
  const h=revalidationFixture({formKind});try{
   await h.settle();assert(probes(h).length>=1);assert.equal(posts(h).length,0);
   h.change('Synthetic unsent value');await h.settle();
   assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);assert.equal(h.removes.length,0);
   await h.submit();await h.settle();
   assert.equal(posts(h).length,1);const payload=JSON.parse(posts(h)[0].options.body);
   assert.equal(payload.action,action);assert.deepEqual(payload.expectedStudioContext,A);
   assert(probes(h).length>=3);assert.equal(h.button(label).props.disabled,false);
   assert.equal(h.writes.length,0);assert.equal(h.removes.length,0);
   if(formKind==='invitation')assert.match(h.text(),/ELV-ABCDEF123456/);
  }finally{h.dispose();}
 });
 test(`${formKind}: changed actor retires the form before POST and cannot revive on return`,async()=>{
  const h=revalidationFixture({formKind});try{
   await h.settle();h.change('Synthetic unsent value');await h.settle();h.current=B;h.emit('focus');await h.settle();
   assert.equal(h.find(node=>node.type==='fieldset').props.hidden,true);assert.equal(h.button(label),undefined);
   h.current=A;h.emit('focus');await h.settle();await h.submit();await h.settle();
   assert.equal(posts(h).length,0);assert.equal(h.writes.length,0);assert.equal(h.controls[0].value,'Synthetic unsent value');
  }finally{h.dispose();}
 });
 test(`${formKind}: unavailable comparison requires explicit retry and sends no POST`,async()=>{
  const h=revalidationFixture({formKind,current:'unavailable-503'});try{
   await h.settle();assert.equal(h.button(label).props.disabled,true);assert(h.button('Retry context check'));
   h.current=A;h.emit('focus');await h.settle();assert.equal(h.button(label).props.disabled,true);
   await h.clickButton('Retry context check');await h.settle();assert.equal(h.button(label).props.disabled,false);
   assert.equal(posts(h).length,0);assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);
  }finally{h.dispose();}
 });
 test(`${formKind}: changed organization after POST ignores stale acknowledgement`,async()=>{
  const h=revalidationFixture({formKind,deferPost:true});try{
   await h.settle();h.change('Synthetic pending value');await h.settle();const pending=h.submit();await h.settle();
   h.current={...A,organizationId:'org-b'};h.finishPost();await pending;await h.settle();
   assert.equal(posts(h).length,1);assert.equal(h.refreshes,0);assert.equal(h.routes.length,0);
   assert.equal(h.find(node=>node.type==='fieldset').props.hidden,true);
   if(formKind==='invitation')assert.doesNotMatch(h.text(),/ELV-ABCDEF123456/);
   assert.equal(h.controls[0].value,'Synthetic pending value');assert.equal(h.removes.length,0);
  }finally{h.dispose();}
 });
 test(`${formKind}: uncertain response blocks repeat until cancellable manual reconciliation`,async()=>{
  const h=revalidationFixture({formKind});try{
   await h.settle();h.change('Synthetic unsent value');await h.settle();h.postStatus=408;h.postResult={error:'PRIVATE_DIAGNOSTIC'};
   await h.submit();await h.settle();assert.equal(posts(h).length,1);assert.equal(h.button(label).props.disabled,true);
   assert.equal(h.find(node=>node.type==='a'&&node.props.children==='Review saved items').props.href,formKind==='invitation'?'/studio/publishing':'/studio/cohorts');
   h.confirmResult=false;await h.clickButton('I checked the saved item');assert.equal(posts(h).length,1);assert.equal(h.button(label).props.disabled,true);
   h.confirmResult=true;await h.clickButton('I checked the saved item');assert.equal(posts(h).length,1);assert.equal(h.button(label).props.disabled,false);
  }finally{h.dispose();}
 });
 test(`${formKind}: unmount ignores a delayed accepted POST`,async()=>{
  const h=revalidationFixture({formKind,deferPost:true});try{
   await h.settle();const pending=h.submit();await h.settle();assert.equal(posts(h).length,1);
   h.dispose();h.finishPost();await pending;
   assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);assert.equal(h.writesAfterUnmount,0);
  }finally{h.dispose();}
 });
}
