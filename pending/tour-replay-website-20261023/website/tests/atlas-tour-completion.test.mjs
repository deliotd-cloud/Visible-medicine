import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import test from 'node:test';
import {guidedPlaybackDuration,isGuidedPlaybackRate,GUIDED_PLAYBACK_RATES} from '../atlas-review/lib/guided-playback.ts';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const site=new URL('../',import.meta.url);
const atlasSourceRepo=checkedAtlasSourceRepo(CURRENT_ATLAS_REVISION);
const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,CURRENT_ATLAS_REVISION);
const ts=createRequire(new URL('package.json',site))('typescript');
const originalRevision='408759d57644b05402e98a937e7cf6338b5509cf';
const revision=CURRENT_ATLAS_REVISION,path='app/regional-guided-learning.tsx';
const startHint='      {!active&&<p className="regional-tour-start-hint">Choose Play full tour or Start guided tour to open each stop\'s notes. Imaging links and quick checks appear where available.</p>}\n';
const withoutStartHint=bytes=>{
 const text=bytes.toString('utf8').replaceAll('\r\n','\n');
 assert.equal(Buffer.byteLength(startHint),186,'Exact source190 start-hint addition size');
 assert.equal(text.split(startHint).length,2,'One exact regional start hint');
 return Buffer.from(text.replace(startHint,''));
};
const read=p=>readFileSync(new URL(p,site)),json=p=>JSON.parse(read(p));
const historical=json('tests/fixtures/tour-replay-historical/completion-source.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
const player=read('atlas-review/'+path).toString().replaceAll('\r\n','\n');
const source=ts.createSourceFile(path,player,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const find=predicate=>{const nodes=[];const visit=node=>{if(predicate(node))nodes.push(node);ts.forEachChild(node,visit);};visit(source);assert.equal(nodes.length,1,'One actual production closure is required');return nodes[0];};
const initializer=name=>find(node=>ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text===name).initializer;
const callback=initializer('revokePlayback');assert(ts.isCallExpression(callback));
assert.equal(callback.expression.getText(source),'useCallback');assert(ts.isArrowFunction(callback.arguments[0]));
const body=arrow=>{assert(ts.isArrowFunction(arrow)&&ts.isBlock(arrow.body));return arrow.body.getText(source).slice(1,-1);};
const pauseBody=body(callback.arguments[0]);
const timer=initializer('timer');assert(ts.isCallExpression(timer));
assert.equal(timer.expression.getText(source),'window.setTimeout');assert.equal(timer.arguments.length,2);
assert.equal(timer.arguments[1].getText(source),'stepDuration');
const timerBody=body(timer.arguments[0]);
let effect=timer.parent;
while(effect&&!ts.isArrowFunction(effect))effect=effect.parent;
assert(effect&&ts.isCallExpression(effect.parent)&&effect.parent.expression.getText(source)==='useEffect','The actual timer must be owned by a React effect');
const effectBody=body(effect);
const predicate=find(node=>ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='setStop'&&node.expression.expression.getText(source)==='pausedImaging').arguments[1].getText(source);
const durationExpression=initializer('stepDuration').getText(source);
const speedBody=body(initializer('changePlaybackRate'));

test('closed historical whole-source completion theorem and source190 hint remain exact',()=>{
 assert.equal(historical.schema,'vm-closed-tour-completion-source/1');
 assert.equal(historical.originalRevision,originalRevision);
 assert.equal(historical.source190Revision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(historical.previousCompleteRevision,'e3a901e103e9fb495a18d9bd1622190dfc0d034b');
 const historic=(sourceRevision,sourcePath)=>execFileSync('git',['show',sourceRevision+':'+sourcePath],
  {cwd:atlasSourceRepo,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const oldRegional=historic(originalRevision,path),source190Regional=historic(historical.source190Revision,path),priorRegional=historic(historical.previousCompleteRevision,path);
 assert.equal(sha(oldRegional),historical.regionalOriginalSha256);
 assert.equal(sha(source190Regional),historical.regionalSource190Sha256);
 assert.equal(sha(priorRegional),historical.regionalPreviousSha256);
 assert.deepEqual(withoutStartHint(source190Regional),Buffer.from(oldRegional.toString('utf8').replaceAll('\r\n','\n')),
  'Whole original player recovered after only the source190 hint and identical newline normalization');
 assert.notDeepEqual(priorRegional,source190Regional,'Later tour-reading source is a separate pinned epoch');
 const changed=Buffer.from(source190Regional.toString('utf8').replace('Choose Play full tour','Choose Pause full tour'));
 assert.throws(()=>withoutStartHint(changed),/One exact regional start hint/);
 for(const sourceRevision of [originalRevision,historical.source190Revision,historical.previousCompleteRevision])
  assert.equal(sha(historic(sourceRevision,'lib/guided-playback.ts')),historical.guidedPlaybackSha256);
});

test('learner and protected Review deliver the current completion player and speed policy',()=>{
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
 for(const sourcePath of [path,'lib/guided-playback.ts']){
  const entry=review.files.find(f=>f.path===sourcePath);assert(entry);
  const committed=execFileSync('git',['show',revision+':'+sourcePath],{cwd:atlasSourceRepo,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(sha(committed),entry.sourceSha256);assert.equal(sha(read('atlas-review/'+sourcePath)),entry.importedSha256);
  assert.equal(read('atlas-review/'+sourcePath).toString().replaceAll('\r\n','\n').replaceAll('@/atlas-review/','@/'),committed.toString().replaceAll('\r\n','\n'));
  assert.equal(json('atlas-review/content/body-renderer-revision.json').dependencies.find(f=>f.path===sourcePath).sha256,
   sha(committed.toString('utf8').replaceAll('\r\n','\n')),'Renderer producer pins LF-normalized source text, while Review pins raw committed bytes');
 }
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base='public/atlas-runtime/'+module+'/',manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);
  const input=json(base+'source-inputs.json').find(f=>f.path===path);
  if(module==='head-neck')assert.equal(input?.sha256,review.files.find(f=>f.path===path).sourceSha256);else assert.equal(input,undefined);
  for(const f of manifest.files)assert.equal(sha(read(base+f.path)),f.sha256);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  assert.equal(manifest.imagingConnection,module==='shoulder'?undefined:false,'Separate shoulder pilot has no root imaging connection field');
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
});

// Execute actual imported production closures. This is not a browser/GPU or
// full React lifecycle check; controlled component and imaging-link tests remain.
function execute({index=1,epoch=0,current=0,hidden=false,active=true,scopeActive=true,sameScope=true}={}){
 const state={playing:true,motionPaused:false,next:null},completion={finished:false},playbackEpoch={current},document={hidden};
 const scope={active:scopeActive},currentScope={current:null};currentScope.current=sameScope?scope:{active:true};
 const revokePlayback=new Function('playbackEpoch','setPlaying','setMotionPaused',pauseBody).bind(null,playbackEpoch,v=>{state.playing=v;},v=>{state.motionPaused=v;});
 const run=new Function('active','scope','currentScope','epoch','playbackEpoch','document','index','tour','changeStep','revokePlayback','setFinished',timerBody);
 run(active,scope,currentScope,epoch,playbackEpoch,document,index,{steps:[{},{}]},n=>{state.next=n;},revokePlayback,v=>{completion.finished=v;});
 const eligible=({ready=true,quickCheckOpen=false}={})=>new Function('active','ready','playing','motionPaused','quickCheckOpen','document','return '+predicate)(active,ready,state.playing,state.motionPaused,quickCheckOpen,document);
 return {state,playbackEpoch,eligible,completion,scope};
}
test('natural final stop holds motion and still refuses unready or quiz-open imaging',()=>{
 const r=execute();assert.deepEqual(r.state,{playing:false,motionPaused:true,next:null});assert.equal(r.playbackEpoch.current,1);
 assert.equal(r.completion.finished,true);assert.equal(r.scope.finished,true,'Natural completion belongs to the committed source scope');
 assert.equal(r.eligible(),true);assert.equal(r.eligible({ready:false}),false);assert.equal(r.eligible({quickCheckOpen:true}),false);
});
test('intermediate stop keeps playback and cannot become a paused imaging stop',()=>{
 const r=execute({index:0});assert.deepEqual(r.state,{playing:true,motionPaused:false,next:1});assert.equal(r.playbackEpoch.current,0);assert.equal(r.eligible(),false);
});
for(const [name,options]of [['retired epoch',{current:1}],['hidden page',{hidden:true}],['cleaned-up effect',{active:false}],['inactive renderer scope',{scopeActive:false}],['replaced renderer scope',{sameScope:false}]])test(name+' cannot finish or enable the stop',()=>{
 const r=execute(options);assert.deepEqual(r.state,{playing:true,motionPaused:false,next:null});assert.equal(r.eligible(),false);
});
test('actual step-duration expression uses each admitted speed for continuous and authored playback',()=>{
 const duration=new Function('continuous','guidedPlaybackDuration','step','playbackRate','return '+durationExpression);
 const step={caption:'Source-bound caption.',durationMs:31001};
 for(const rate of GUIDED_PLAYBACK_RATES){
  assert.equal(duration(true,guidedPlaybackDuration,step,rate),guidedPlaybackDuration(step.caption,step.durationMs,rate));
  assert.equal(duration(false,guidedPlaybackDuration,step,rate),Math.ceil(step.durationMs/rate));
 }
});
function effectTimer({playing=true,index=0,ready=true,hidden=false,stepDuration=12345}={}){
 const state={scheduled:0,cleared:[],next:null,completed:0,delay:null},epoch={current:0};
 const scope={active:true},currentScope={current:scope},document={hidden};let queued=null;
 const window={setTimeout:(callback,delay)=>{state.scheduled++;state.delay=delay;queued=callback;return 71;},clearTimeout:id=>{state.cleared.push(id);}};
 const completion={finished:false};
 const cleanup=new Function('playing','index','ready','document','playbackEpoch','scope','currentScope','tour','changeStep','revokePlayback','stepDuration','window','setFinished',effectBody)(playing,index,ready,document,epoch,scope,currentScope,{steps:[{},{}]},n=>{state.next=n;},()=>{state.completed++;},stepDuration,window,v=>{completion.finished=v;});
 return {state,epoch,document,scope,cleanup,completion,fire:()=>{queued?.();}};
}
test('actual timer effect never schedules while unready, paused, hidden or without a selected step',()=>{
 for(const options of [{ready:false},{playing:false},{hidden:true},{index:null}]){
  const r=effectTimer(options);assert.equal(r.state.scheduled,0);assert.equal(r.cleanup,undefined);r.fire();assert.equal(r.state.next,null);assert.equal(r.state.completed,0);
 }
 const ready=effectTimer();assert.equal(ready.state.scheduled,1);assert.equal(ready.state.delay,12345);ready.fire();assert.equal(ready.state.next,1);
});
test('actual effect cleanup clears the timer and revokes a retained callback',()=>{
 const r=effectTimer({index:1});assert.equal(typeof r.cleanup,'function');r.cleanup();assert.deepEqual(r.state.cleared,[71]);
 r.fire();assert.equal(r.state.completed,0);assert.equal(r.state.next,null);
});
function changeRate(next,rate=1,epoch={current:0},current=true){
 const state={rate,suspended:0,setterCalls:0};
 new Function('next','playbackRate','isGuidedPlaybackRate','playbackEpoch','pausedImaging','setPlaybackRate','isCurrentAction',speedBody)(next,rate,isGuidedPlaybackRate,epoch,{suspend:()=>{state.suspended++;}},v=>{state.rate=v;state.setterCalls++;},()=>current);
 return {state,epoch};
}
test('changing speed retires queued old-speed callbacks before effect cleanup',()=>{
 for(const rate of GUIDED_PLAYBACK_RATES.filter(r=>r!==1)){
  const timer=effectTimer(),r=changeRate(rate,1,timer.epoch);assert.deepEqual(r.state,{rate,suspended:1,setterCalls:1});assert.equal(r.epoch.current,1);
  timer.fire();assert.equal(timer.state.next,null);assert.equal(timer.state.completed,0);
 }
});
test('unchanged and invalid rates do not invalidate playback or enable imaging',()=>{
 for(const rate of [1,0,-1,4,NaN,Infinity,'2',null,undefined]){
  const r=changeRate(rate);assert.deepEqual(r.state,{rate:1,suspended:0,setterCalls:0});assert.equal(r.epoch.current,0);
 }
});
test('stale committed action cannot change speed or retire the active timer',()=>{
 const epoch={current:4},result=changeRate(2,1,epoch,false);
 assert.deepEqual(result.state,{rate:1,suspended:0,setterCalls:0});assert.equal(epoch.current,4);
});
