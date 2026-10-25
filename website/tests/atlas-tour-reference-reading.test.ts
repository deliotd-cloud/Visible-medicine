import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sourceRepo=currentAtlasDeliveryRoot();
const current=CURRENT_ATLAS_REVISION;
const oldSource='a10496da94d9d054306bbc48e5ae9c98239d82b5';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const git=(repo:string,revision:string,path:string)=>execFileSync('git',['--no-replace-objects','-C',repo,'show',`${revision}:${path}`],{maxBuffer:32e6});
const json=(bytes:Buffer)=>JSON.parse(bytes.toString());

test('historical reading-focus delivery is bound to its saved Atlas and website epochs',()=>{
 const prior='c285a387';
 const review=json(git('.',prior,'atlas-review/manifest.json'));
 assert.equal(review.revision,oldSource);
 const earlier=json(git('.','a0df5f3d','atlas-review/manifest.json'));
 const oldEntry=earlier.files.find((f:any)=>f.path==='app/regional-guided-learning.tsx');assert(oldEntry);
 assert.equal(oldEntry.sourceSha256,'74f623f4d0cea33566b40e5278780a31a2618523631dcadbcee86436c35aadeb');
 assert.equal(sha(git('.','a0df5f3d','atlas-review/app/regional-guided-learning.tsx')),oldEntry.importedSha256);
 for(const [module,path,sourceHash,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','0fb1f95ec82c2323b4bc01372fd5e7938c090df8a4b8513f8929c672cfde6740','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','f4c0d9d484a2b4a8ee2e4e258cf20e38b433d188e8123bbd673c5e67c1e40fb3','if(event.currentTarget.open)revokePlayback();'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=json(git('.',prior,base+'manifest.json'));
  const inputs=json(git('.',prior,base+'source-inputs.json'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,oldSource);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sourceHash);
  assert.equal(record.sourceSha256,sourceHash);
  assert.equal(sha(git(sourceRepo,oldSource,path)),sourceHash);
  const imported=git('.',prior,'atlas-review/'+path);
  assert.equal(sha(imported),record.importedSha256);
  assert(imported.toString().includes(handler));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
});

test('current reading-focus handlers reach both learner exports and protected Review',()=>{
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,current);
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const receipt=JSON.parse(readFileSync('atlas-review/integration-inputs.json','utf8'));
 assert.equal(review.revision,current);
 assert.equal(receipt.sourceCommit,current);assert.equal(receipt.sha256,review.websiteIntegrationSha256);
 for(const [module,path,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','if(event.currentTarget.open)revokePlayback();'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,pin.runtimeSources[module]);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sha(git(sourceRepo,pin.runtimeSources[module],path)));
  assert.equal(sha(git(sourceRepo,current,path)),record.sourceSha256);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(sha(imported),record.importedSha256);
  assert.deepEqual(receipt.inputs.filter((f:any)=>f.path==='atlas-review/'+path),[{path:'atlas-review/'+path,sha256:record.importedSha256}]);
  if(module==='head-neck'){
   assert(git(sourceRepo,oldSource,path).toString().includes(handler),'Historical reference handler retained at its exact source epoch');
   assert(imported.toString().includes('<TourReadingNotes'),'Current shared reader is mounted');
   assert(imported.toString().includes('onRead={()=>{'),'Current reader reaches the guarded parent pause callback');
  }else assert(imported.toString().includes(handler));
  for(const f of learner.files){const bytes=readFileSync(base+f.path);assert.equal(bytes.length,f.bytes);assert.equal(sha(bytes),f.sha256);}
  assert(learner.files.some((f:any)=>f.path.endsWith('.js')&&readFileSync(base+f.path,'utf8').includes('Current step explanation')),module+': emitted reading focus region');
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
 const viewer=JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json','utf8'));
 assert.equal(viewer.sourceCommit,current);assert.equal(viewer.websiteIntegrationSha256,receipt.sha256);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 for(const f of viewer.files)assert.equal(sha(readFileSync('public/atlas-review-viewer/'+f.path)),f.sha256);
});

test('actual current shared reader pauses its guarded parent on focus, press and open, while stale callbacks cannot pause a new tour',async()=>{
 const requireSite=createRequire(import.meta.url),ts=requireSite('typescript');
 const readerPath='app/tour-reading-notes.tsx',review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const receipt=JSON.parse(readFileSync('atlas-review/integration-inputs.json','utf8'));
 const readerRow=review.files.find((f:any)=>f.path===readerPath);assert(readerRow);
 const committedReader=git(sourceRepo,current,readerPath),importedReader=readFileSync('atlas-review/'+readerPath);
 assert.equal(readerRow.sourceSha256,sha(committedReader));assert.equal(readerRow.importedSha256,sha(importedReader));
 assert.deepEqual(receipt.inputs.filter((f:any)=>f.path==='atlas-review/'+readerPath),[{path:'atlas-review/'+readerPath,sha256:readerRow.importedSha256}]);
 const learnerInputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.deepEqual(learnerInputs.filter((f:any)=>f.path===readerPath),[{path:readerPath,sha256:sha(committedReader)}]);
 const head=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));
 assert(head.files.some((f:any)=>f.path.endsWith('.js')&&readFileSync('public/atlas-runtime/head-neck/'+f.path,'utf8').includes('Read tour notes')),'Manifested reader reaches learner');
 const viewer=JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json','utf8'));
 assert(viewer.files.some((f:any)=>f.path.endsWith('.js')&&readFileSync('public/atlas-review-viewer/'+f.path,'utf8').includes('Read tour notes')),'Manifested reader reaches protected Review');
 const source=readFileSync('atlas-review/app/regional-guided-learning.tsx','utf8');
 const ast=ts.createSourceFile('regional-guided-learning.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const reader:any[]=[];let revokeDeclaration:any,captionDeclaration:any;
 const visit=(node:any)=>{
  if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='TourReadingNotes')reader.push(node);
  if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='revokePlayback')revokeDeclaration=node;
  if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='revokeIfCurrent')captionDeclaration=node;
  ts.forEachChild(node,visit);
 };visit(ast);
 assert.equal(reader.length,1);assert(revokeDeclaration);assert(captionDeclaration);
 assert(source.includes('onFocus={revokeIfCurrent}'),'Caption focus invokes the current scoped pause');
 const parent=reader[0].parent;assert(ts.isBinaryExpression(parent));assert.equal(parent.left.getText(ast),'!resolved.error');
 const attributes=Object.fromEntries(reader[0].attributes.properties.map((item:any)=>[item.name.getText(ast),item]));
 assert.equal(attributes.key.initializer.expression.getText(ast),'scope.key');
 const compile=(expression:string)=>ts.transpileModule(`(${expression})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const callbackSource=attributes.onRead.initializer.expression.getText(ast);
 const revokeSource=revokeDeclaration.initializer.arguments[0].getText(ast);
 const root=process.cwd();
 const bundled=await build({stdin:{contents:"export {TourReadingNotes} from './atlas-review/app/tour-reading-notes'; export {regionalTours} from './atlas-review/lib/regional-tours';",resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',alias:{'@':root},loader:{'.css':'empty'}});
 const module:{exports:any}={exports:{}};runInNewContext(bundled.outputFiles[0].text,{module,exports:module.exports,require:requireSite,URL});
 const {TourReadingNotes,regionalTours}=module.exports;assert(regionalTours.length>0);
 function mounted(currentAction:()=>boolean){
  const calls:any[]=[],playbackEpoch={current:0};
  const revokePlayback=runInNewContext(compile(revokeSource),{playbackEpoch,setPlaying:(value:boolean)=>calls.push(['playing',value]),setMotionPaused:(value:boolean)=>calls.push(['motion',value])});
  const onRead=runInNewContext(compile(callbackSource),{isCurrentAction(){calls.push('guard');return currentAction();},pausedImaging:{suspend(){calls.push('suspend');}},revokePlayback});
  return {calls,playbackEpoch,element:TourReadingNotes({tour:regionalTours[0],onRead})};
 }
 const active=mounted(()=>true);
 active.element.props.onToggle({currentTarget:{open:false}});assert.deepEqual(active.calls,[]);
 for(const event of [()=>active.element.props.onToggle({currentTarget:{open:true}}),()=>active.element.props.onFocusCapture({}),()=>active.element.props.onPointerDownCapture({})]){
  const before=active.playbackEpoch.current;event();
  assert.deepEqual(active.calls.splice(0),['guard','suspend',['playing',false],['motion',true]]);
  assert.equal(active.playbackEpoch.current,before+1,'Real parent revoked the playing epoch');
 }
 let oldCurrent=false;
 const old=mounted(()=>oldCurrent),next=mounted(()=>true);
 old.element.props.onFocusCapture({});assert.deepEqual(old.calls,['guard']);assert.equal(old.playbackEpoch.current,0);
 next.element.props.onFocusCapture({});assert.deepEqual(next.calls,['guard','suspend',['playing',false],['motion',true]]);assert.equal(next.playbackEpoch.current,1);
 old.element.props.onToggle({currentTarget:{open:true}});assert.deepEqual(old.calls,['guard','guard']);assert.equal(next.playbackEpoch.current,1,'Retained old callback cannot change the new tour');
 const captionCalls:any[]=[],captionEpoch={current:0};
 const captionRevoke=runInNewContext(compile(revokeSource),{playbackEpoch:captionEpoch,setPlaying:(value:boolean)=>captionCalls.push(['playing',value]),setMotionPaused:(value:boolean)=>captionCalls.push(['motion',value])});
 let captionCurrent=true;
 const captionFocus=runInNewContext(compile(captionDeclaration.initializer.getText(ast)),{isCurrentAction(){captionCalls.push('guard');return captionCurrent;},revokePlayback:captionRevoke});
 captionFocus();assert.deepEqual(captionCalls.splice(0),['guard',['playing',false],['motion',true]]);assert.equal(captionEpoch.current,1);
 captionCurrent=false;captionFocus();assert.deepEqual(captionCalls,['guard']);assert.equal(captionEpoch.current,1,'Stale caption focus cannot revoke a later tour');
});
