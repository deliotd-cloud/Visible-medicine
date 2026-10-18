// Immutable delivery58 evidence; latest source admission has its own live tests.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('./fixtures/head-retry-delivery-58/',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const indexBytes=readFileSync(new URL('index.json',root));
assert.equal(sha(indexBytes),'ddf36f5d934e9895cd5e3c419ad796b8db6b904da595e941f389643a23914ca5');
const index=JSON.parse(indexBytes),files=new Map(index.files.map(row=>[row.file,row]));
function raw(name){const row=files.get(name);assert(row,name);const bytes=readFileSync(new URL(name,root));assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256,name);return bytes;}
const json=name=>JSON.parse(raw(name));

test('delivery58 originals and new engineering artifacts remain exact and independently scoped',()=>{
 assert.equal(index.parent,'446d3d75eca72c36a16efe387440c4a93ca4b480');
 assert.equal(index.atlasSource,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
 assert.equal(files.size,15);for(const name of files.keys())raw(name);
 assert(!index.scope.includes('clinical approval granted'));
});

test('delivery58 changes only the native viewer among1661 protected inputs',()=>{
 const before=json('inputs-before.json'),after=json('inputs-after.json');
 for(const [doc,digest]of [[before,index.beforeReview],[after,index.afterReview]]){
  assert.equal(doc.sourceCommit,index.atlasSource);assert.equal(doc.inputs.length,1661);
  assert.equal(new Set(doc.inputs.map(row=>row.path)).size,1661);
  assert.equal(doc.sha256,digest);assert.equal(sha(JSON.stringify(doc.inputs)),digest);
 }
 const changed=after.inputs.filter((row,i)=>{assert.equal(row.path,before.inputs[i].path);return row.sha256!==before.inputs[i].sha256;});
 assert.deepEqual(changed.map(row=>row.path),['components/HeadAtlasViewer.tsx']);
 assert.equal(before.inputs.find(row=>row.path===changed[0].path).sha256,sha(raw('head-viewer-before.tsx.txt')));
 assert.equal(changed[0].sha256,sha(raw('head-viewer-after.tsx.txt')));
});

test('delivery58 retains all teaching/source identities, four learners, model inventory and notices',()=>{
 const before=json('review-before.json'),after=json('review-after.json');
 assert.equal(before.revision,index.atlasSource);assert.equal(after.revision,index.atlasSource);
 assert.equal(before.files.length,1531);assert.equal(after.files.length,1531);assert.deepEqual(before.packages,after.packages);
 const changed=after.files.filter((row,i)=>{const old=before.files[i];assert.equal(row.path,old.path);assert.equal(row.sourceSha256,old.sourceSha256);return row.importedSha256!==old.importedSha256;});
 assert.deepEqual(changed.map(row=>row.path),['content/body-renderer-revision.json','content/review-revisions.json']);
 for(const [path,name]of [['content/body-renderer-revision.json','renderer'],['content/review-revisions.json','revisions']])for(const [epoch,manifest]of [['before',before],['after',after]])assert.equal(manifest.files.find(row=>row.path===path).importedSha256,sha(raw(`${name}-${epoch}.json`)));
 const oldRenderer=json('renderer-before.json'),newRenderer=json('renderer-after.json');
 assert.equal(oldRenderer.websiteIntegrationSha256,index.beforeReview);assert.equal(newRenderer.websiteIntegrationSha256,index.afterReview);
 assert.equal(newRenderer.sourceRendererSha256,oldRenderer.sourceRendererSha256);assert.deepEqual(newRenderer.entrypoints,oldRenderer.entrypoints);
 const oldViewer=json('viewer-manifest-before.json'),newViewer=json('viewer-manifest-after.json');
 assert.equal(oldViewer.files.length,46);assert.equal(newViewer.files.length,46);assert.deepEqual(oldViewer.packages,newViewer.packages);
 assert.equal(newViewer.websiteIntegrationSha256,index.afterReview);assert.equal(oldViewer.websiteIntegrationSha256,index.beforeReview);
 assert.deepEqual(newViewer.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt'),oldViewer.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt'));
 const models=json('model-inventory.json');assert.equal(models.models.length,137);assert.equal(models.models.flatMap(row=>row.paths).length,144);assert.equal(models.models.reduce((n,row)=>n+row.bytes,0),199072480);
 assert.deepEqual(new Set(models.sources.map(row=>row.module)),new Set(['head-neck','shoulder','lower-limb','female-pelvis']));
});

test('Register58 retains every71/eight requirement and all earlier change-log statements',()=>{
 const before=json('register-before.json'),after=json('register-after.json');
 assert.equal(before.revision,57);assert.equal(after.revision,58);assert.equal(after.items.length,71);assert.equal(after.items.filter(row=>row.scope==='optional').length,8);
 assert.deepEqual(after.items,before.items);assert.deepEqual(after.rules,before.rules);assert.deepEqual(after.changeLog.slice(1),before.changeLog);assert.equal(after.changeLog[0].revision,58);
 const restored=structuredClone(after);restored.revision=before.revision;restored.baseline.reviewIntegration=before.baseline.reviewIntegration;restored.changeLog=before.changeLog;assert.deepEqual(restored,before);
});

test('the native viewer delta is exactly failure ownership, once-only retry and a synchronous non-scrolling focus handoff',()=>{
 let code=raw('head-viewer-before.tsx.txt').toString().replaceAll('\r\n','\n');
 const changes=[
  ['  const activeEntry=study?.definition.entries.find(entry=>entry.id===activeId);',`  const activeEntry=study?.definition.entries.find(entry=>entry.id===activeId);
  // A retry belongs to the currently rendered failure, not a retained button
  // callback from a prior selection, panel, package, or practice state.
  const structureRetryContext={pkg,study,activeId,failedEntryId,selected,quizActive};
  const structureRetryContextRef=useRef(structureRetryContext);
  structureRetryContextRef.current=structureRetryContext;
  const structureRetryConsumedRef=useRef(false);`],
  [".catch(reason=>{if(!controller.signal.aborted){setStatus('');setFailedEntryId(entry.id);", ".catch(reason=>{if(!controller.signal.aborted&&entryRequestRef.current===controller){structureRetryConsumedRef.current=false;setStatus('');setFailedEntryId(entry.id);"],
  [`  function retryStructure(){
    if(!pkg||!study||quizActive||selected||!activeId||failedEntryId!==activeId)return;
    setError('');setFailedEntryId(null);setEntryLoadAttempt(value=>value+1);
  }`, `  function retryStructure(){
    if(structureRetryContextRef.current!==structureRetryContext||structureRetryConsumedRef.current||!pkg||!study||quizActive||selected||!activeId||failedEntryId!==activeId)return;
    structureRetryConsumedRef.current=true;
    setError('');setFailedEntryId(null);setEntryLoadAttempt(value=>value+1);
    // Both side panels can be hidden in Focus images. The package action stays
    // visible in Structure, Guided learning, and image focus while retry loads.
    openButtonRef.current?.focus({preventScroll:true});
  }`],
 ];
 for(const [before,after]of changes){assert.equal(code.split(before).length,2,before);code=code.replace(before,after);}
 assert.equal(raw('head-viewer-after.tsx.txt').toString().replaceAll('\r\n','\n'),code);
});
