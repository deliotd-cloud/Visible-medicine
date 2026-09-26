import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
const result=await build({stdin:{contents:"export * from './lib/didanix-atlas-adapter'; export * from './lib/imaging-sync'; export * from './lib/learning-resources'; export * from './lib/learning-entitlements'; export * from './integration/shoulder/education-api';",resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
let checks=0;const check=(v,message)=>{checks++;assert(v,message);};const same=(a,b)=>{checks++;assert.deepEqual(a,b);};
const hash='a'.repeat(64), id='vm:anatomy:test:right:bone', anatomy={scope:'shoulder-pilot',structureId:id,sources:[{file:'TEST',sha256:hash}]};
const sourceEntry={id,name:'Synthetic structure',sources:anatomy.sources,reference:{frame:'synthetic-not-a-patient-frame',kind:'surface-bounds-centre',point:[0,0,0]}};
const kinds={ct:{type:'volume',id:'test-anchor',seriesId:'test-series',frameId:'test-frame',annotationId:'test-label',geometry:'partial-mask'},mri:{type:'volume',id:'test-anchor',seriesId:'test-series',frameId:'test-frame',annotationId:'test-label',geometry:'point'},xray:{type:'projection',id:'test-anchor',imageId:'test-image',annotationId:'test-label',projectionId:'test-projection'},ultrasound:{type:'ultrasound',id:'test-anchor',clipId:'test-clip',annotationId:'test-label',viewId:'test-view',frameIndex:3,timeMs:null},lecture:{type:'slide',id:'test-anchor',courseId:'test-course',lessonId:'test-lesson',slideId:'test-slide',buildId:null}};
function fixture(kind='ct',relation='exact',count=1){
 let access=true,navigate=true,study={resourceId:'vm:resource:synthetic',revision:1,materialSha256:hash};
 let incoming,context,disposed=0,pending=null;
 const selected=[],revealed=[],guards=[],status=[];
 const resource={id:study.resourceId,revision:1,kind,title:'Synthetic fixture only',ageGroup:'adult',laterality:'right',regionIds:['shoulder-arm'],material:{sha256:hash,origin:'synthetic'},anchors:Array.from({length:count},(_,i)=>({...kinds[kind],id:'test-anchor-'+i}))};
 const links=resource.anchors.map((anchor,i)=>({id:'vm:link:test-'+i,revision:1,anatomy,resourceId:resource.id,resourceRevision:1,materialSha256:hash,anchorId:anchor.id,relation}));
 const policy={canNavigate:()=>navigate,canAccessAnatomy:()=>true,canAccess:()=>access,resourceCleared:()=>true,correspondenceCleared:()=>true};
 const registry=api.createLearningRegistry({schemaVersion:1,resources:[resource],links},[anatomy],policy);
 const bridge=api.createImagingBridge();const receiver=request=>{selected.push(request.structureId);return {messageId:request.messageId,status:'selected'};};
 const detach=bridge.attachAtlas(receiver);
 const viewer={getStudy:()=>study,canNavigate:()=>navigate,
  async reveal(match,guard){guards.push(guard);if(pending)await pending.promise;if(guard.isCurrent())revealed.push({match,signal:guard.signal});},
  subscribeSelection:fn=>{incoming=fn;return()=>{disposed++;};},subscribeContext:fn=>{context=fn;return()=>{disposed++;};}};
 const adapter=api.connectDidanixEducation({bridge,registry,viewer,scope:'shoulder-pilot',onStatus:s=>status.push(s)});
 const locator={version:1,linkId:links[0].id,linkRevision:1,resourceId:resource.id,resourceRevision:1,anchorId:resource.anchors[0].id};
 return {adapter,bridge,registry,locator,selected,revealed,guards,status,detach,reattach:()=>bridge.attachAtlas(receiver),send:(messageId='event-1',value=locator)=>incoming({messageId,locator:value}),context:()=>context(),access:v=>{access=v;},navigate:v=>{navigate=v;},study:v=>{study=v;},getDisposed:()=>disposed,wait:()=>{let done;const promise=new Promise(r=>{done=r;});pending={promise,done};return done;}};
}
const tick=()=>new Promise(r=>setTimeout(r,0));
// Closing/replacing the source Atlas must cancel in-flight reveals even when
// the Education study, entitlement and resource revisions remain unchanged.
for(const kind of ['ct','mri','xray','ultrasound']) {
 for(const reattach of [false,true]) {
  const f=fixture(kind);f.adapter.setEnabled(true);const done=f.wait();
  f.bridge.publish(sourceEntry);f.detach();
  same(f.guards.length,1);same(f.guards[0].signal.aborted,true);same(f.guards[0].isCurrent(),false);
  const detachNext=reattach?f.reattach():()=>{};
  done();await tick();same(f.revealed.length,0);same(f.status.at(-1),'paused');
  same(f.send('after-detach').status,'paused');same(f.adapter.choices(),[]);
  if(reattach){
   f.adapter.setEnabled(true);f.detach(); // Old cleanup cannot pause the new attachment.
   same(f.guards[0].isCurrent(),false);
   f.bridge.publish(sourceEntry);await tick();same(f.revealed.length,1);
  }
  detachNext();f.adapter.dispose();
 }
 for(const relation of ['component','broader','related']) {
  const f=fixture(kind,relation);f.adapter.setEnabled(true);f.bridge.publish(sourceEntry);
  same(f.adapter.choices().length,1);f.detach();const detachNext=f.reattach();
  same(f.adapter.choices(),[]);same(await f.adapter.choose(f.locator),false);
  same(f.revealed.length,0);detachNext();f.adapter.dispose();
 }
}
for(const kind of ['ct','mri','xray','ultrasound']) {
 const f=fixture(kind);f.bridge.publish(sourceEntry);await tick();same(f.revealed.length,0);
 f.adapter.setEnabled(true);f.bridge.publish(sourceEntry);await tick();same(f.revealed.length,1);same(f.revealed[0].match.anchor.type,kinds[kind].type);
 check(!('reference' in f.revealed[0].match),'No donor point sent as patient coordinate');
 same(f.send().status,'selected');same(f.selected,[id]);same(f.send().status,'duplicate');
 f.access(false);same(f.send('revoked').status,'paused');f.bridge.publish(sourceEntry);await tick();same(f.revealed.length,1);
 f.adapter.dispose();f.adapter.dispose();same(f.getDisposed(),2);same(f.bridge.getAdapter(),null);
}
{
 const f=fixture('lecture');f.adapter.setEnabled(true);f.bridge.publish(sourceEntry);await tick();same(f.revealed.length,0);same(f.send().status,'paused');f.adapter.dispose();
}
for(const relation of ['component','broader','related']) {
 const f=fixture('ct',relation);f.adapter.setEnabled(true);f.bridge.publish(sourceEntry);await tick();same(f.revealed.length,0);same(f.adapter.choices()[0].destination,'viewer');check(await f.adapter.choose(f.locator));same(f.revealed.length,1);
 same(f.send().status,'choice-required');same(f.selected.length,0);same(f.adapter.choices()[0].destination,'atlas');check(await f.adapter.choose(f.locator));same(f.selected,[id]);f.adapter.dispose();
}
{
 const f=fixture('ct','exact',2);f.adapter.setEnabled(true);f.bridge.publish(sourceEntry);await tick();same(f.revealed.length,0);same(f.adapter.choices().length,2);
 f.access(false);same(f.adapter.choices(),[]);same(await f.adapter.choose(f.locator),false);f.adapter.dispose();
}
for(const action of ['switch','revoke','practice','dispose','new-selection']) {
 const f=fixture();f.adapter.setEnabled(true);const done=f.wait();f.bridge.publish(sourceEntry);
 if(action==='switch'){f.study({resourceId:'vm:resource:other',revision:1,materialSha256:hash});f.context();}
 if(action==='revoke')f.access(false);
 if(action==='practice'){f.navigate(false);f.context();}
 if(action==='dispose')f.adapter.dispose();
 if(action==='new-selection')f.send();
 done();await tick();same(f.revealed.length,0);f.adapter.dispose();
}
{
 const f=fixture();f.adapter.setEnabled(true);same(f.send('bad event id').status,'invalid');same(f.send('stale',{...f.locator,resourceRevision:2}).status,'paused');
 f.study({resourceId:'vm:resource:synthetic',revision:1,materialSha256:'b'.repeat(64)});same(f.send('wrong-source').status,'paused');f.adapter.dispose();
}
// Independent server-owned product rules: an atlas grant never admits a paid lecture.
const grant={subjectId:'test-user',productId:'atlas',status:'active',validFrom:0,validUntil:null};
same(api.hasLearningEntitlement({kind:'products',anyOf:['lecture-neuro']},'test-user',[grant],10),false);
{
 const f=fixture();f.adapter.setEnabled(true);f.bridge.publish({...sourceEntry,sources:[{file:'TEST',sha256:'b'.repeat(64)}]});await tick();same(f.revealed.length,0);
 let pauses=0;const unsubscribe=f.bridge.subscribe(()=>pauses++);f.context();same(pauses,1);unsubscribe();f.adapter.dispose();
}
const xr=api.createImagingBridge().registerAdapter({id:'xray',label:'X-ray',modality:'X-ray',onAtlasSelection(){}});xr.dispose();
{
 const target={},uninstall=api.installShoulderEducationApi(target),facade=target.visibleMedicineShoulderEducation;
 check(Object.isFrozen(facade));same(facade.version,1);
 const policy={canNavigate:()=>false,canAccessAnatomy:()=>false,canAccess:()=>false,resourceCleared:()=>false,correspondenceCleared:()=>false};
 const options={document:{schemaVersion:1,resources:[],links:[]},policy,viewer:{getStudy:()=>null,canNavigate:()=>false,async reveal(){throw Error('Must not open');},subscribeSelection:()=>()=>{},subscribeContext:()=>()=>{}}};
 const link=facade.connect(options);same(link.choices(),[]);
 assert.throws(()=>facade.connect(options));checks++;
 link.dispose();uninstall();check(!Object.hasOwn(target,'visibleMedicineShoulderEducation'));same(api.imagingBridge.getAdapter(),null);
 const reinstall=api.installShoulderEducationApi(target);reinstall();
}
// A cached host facade must never resurrect an uninstalled interface, including
// synchronous callbacks during connection setup and back/forward restoration.
const emptyDocument={schemaVersion:1,resources:[],links:[]};
const deniedPolicy={canNavigate:()=>false,canAccessAnatomy:()=>false,canAccess:()=>false,resourceCleared:()=>false,correspondenceCleared:()=>false};
const idleViewer=()=>({getStudy:()=>null,canNavigate:()=>false,async reveal(){throw Error('Must not open');},subscribeSelection:()=>()=>{},subscribeContext:()=>()=>{}});
const idleOptions=()=>({document:emptyDocument,policy:deniedPolicy,viewer:idleViewer()});
{
 const bridge=api.createImagingBridge(), close=bridge.attachAtlas(request=>({messageId:request.messageId,status:'selected'}));
 const stop=bridge.subscribe(close); // Simulate unmount during registration notification.
 const registry=api.createLearningRegistry(emptyDocument,[],deniedPolicy);
 const adapter=api.connectDidanixEducation({bridge,registry,viewer:idleViewer(),scope:'body'});
 same(bridge.getAdapter()?.id,'vm-didanix-education');same(adapter.choices(),[]);
 adapter.dispose();stop();same(bridge.getAdapter(),null);
}
{
 const foreign=runInNewContext('({schemaVersion:1,resources:[],links:[]})');
 const target={},uninstall=api.installShoulderEducationApi(target),facade=target.visibleMedicineShoulderEducation;
 const link=facade.connect({...idleOptions(),document:foreign});same(link.choices(),[]);link.dispose();
 const custom=runInNewContext('(new (class Document {schemaVersion=1;resources=[];links=[];})())');
 assert.throws(()=>facade.connect({...idleOptions(),document:custom}),/Invalid/);checks++;
 let invoked=false;const accessor={schemaVersion:1,resources:[],get links(){invoked=true;return [];}};
 assert.throws(()=>facade.connect({...idleOptions(),document:accessor}),/Invalid/);checks++;same(invoked,false);
 assert.throws(()=>facade.connect({...idleOptions(),document:{...foreign,extra:true}}),/Invalid/);checks++;
 uninstall();
 const f=fixture('mri');f.adapter.setEnabled(true);
 const locator=runInNewContext('('+JSON.stringify(f.locator)+')');same(f.send('cross-realm',locator).status,'selected');f.adapter.dispose();
}
{
 const target={},uninstall=api.installShoulderEducationApi(target),old=target.visibleMedicineShoulderEducation;
 uninstall();assert.throws(()=>old.connect(idleOptions()),/removed/);checks++;
 const removeNew=api.installShoulderEducationApi(target),current=target.visibleMedicineShoulderEducation;
 uninstall();same(target.visibleMedicineShoulderEducation,current);
 assert.throws(()=>old.connect(idleOptions()),/removed/);checks++;
 const link=current.connect(idleOptions());link.dispose();removeNew();same(api.imagingBridge.getAdapter(),null);
}
{
 const target={},uninstall=api.installShoulderEducationApi(target),facade=target.visibleMedicineShoulderEducation;
 let cleaned=0;const viewer={...idleViewer(),subscribeSelection:()=>()=>{cleaned++;},subscribeContext:()=>()=>{cleaned++;}};
 assert.throws(()=>facade.connect({...idleOptions(),viewer,onStatus:s=>{if(s==='paused')uninstall();}}),/removed/);checks++;
 same(cleaned,2);same(api.imagingBridge.getAdapter(),null);check(!Object.hasOwn(target,'visibleMedicineShoulderEducation'));
 assert.throws(()=>facade.connect(idleOptions()),/removed/);checks++;
}
{
 const target={},uninstall=api.installShoulderEducationApi(target),facade=target.visibleMedicineShoulderEducation;
 let cleaned=0;const viewer={...idleViewer(),subscribeSelection:()=>()=>{cleaned++;},subscribeContext:()=>{throw Error('Context setup failed');}};
 assert.throws(()=>facade.connect({...idleOptions(),viewer}),/Context setup failed/);checks++;
 same(cleaned,1);same(api.imagingBridge.getAdapter(),null);
 const link=facade.connect(idleOptions());link.dispose();uninstall();
}
{
 const target={},uninstall=api.installShoulderEducationApi(target),facade=target.visibleMedicineShoulderEducation;
 let rejected=false;const link=facade.connect({...idleOptions(),onStatus:()=>{try{facade.connect(idleOptions());}catch(e){rejected=/attaching|Disconnect/.test(e.message);}}});
 check(rejected,'Reentrant connection cannot acquire a second adapter');link.dispose();uninstall();
}
{
 const target={},uninstall=api.installShoulderEducationApi(target),facade=target.visibleMedicineShoulderEducation;
 const viewer={...idleViewer(),subscribeSelection:()=>()=>{throw Error('Cleanup failed');}};
 facade.connect({...idleOptions(),viewer});assert.throws(uninstall,/Cleanup failed/);checks++;
 same(api.imagingBridge.getAdapter(),null);check(!Object.hasOwn(target,'visibleMedicineShoulderEducation'));
 assert.throws(()=>facade.connect(idleOptions()),/removed/);checks++;
 const next=api.installShoulderEducationApi(target);uninstall();check(Object.hasOwn(target,'visibleMedicineShoulderEducation'));next();
}
console.log(JSON.stringify({passed:true,checks,syntheticOnly:true,browserTested:false,clinicalApproved:false}));
