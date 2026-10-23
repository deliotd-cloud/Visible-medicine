import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const site=new URL('../',import.meta.url);
const ts=createRequire(new URL('package.json',site))('typescript');
const read=path=>readFileSync(new URL(path,site));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourcePaths=['app/regional-guided-learning.tsx','app/shoulder-explorer.tsx','app/shoulder-tour-player.tsx'];
const review=json('atlas-review/manifest.json');
const atlas=currentAtlasDeliveryRoot();
const committed=path=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],
 {cwd:atlas,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const parsed=path=>ts.createSourceFile(path,read('atlas-review/'+path).toString(),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function findOne(ast,predicate){const found=[];const walk=node=>{if(predicate(node))found.push(node);ts.forEachChild(node,walk);};walk(ast);assert.equal(found.length,1,'One bound production node');return found[0];}
function runExpression(expression,names,values){const js=ts.transpileModule(`(${expression})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;return new Function(...names,`return ${js}`)(...values);}

test('new replay controls are bound to the exact committed source and protected Review import',()=>{
 assert.equal(CURRENT_ATLAS_REVISION,'d143c28fb1e5da200712af6629a375c25d17dad7');
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 for(const path of sourcePaths){
  const row=review.files.find(item=>item.path===path);assert(row,path);
  assert.equal(sha(committed(path)),row.sourceSha256,path);
  assert.equal(sha(read('atlas-review/'+path)),row.importedSha256,path);
 }
 const head=json('public/atlas-runtime/head-neck/source-inputs.json');
 const shoulder=json('public/atlas-runtime/shoulder/source-inputs.json');
 assert.equal(head.find(item=>item.path===sourcePaths[0])?.sha256,review.files.find(item=>item.path===sourcePaths[0]).sourceSha256);
 for(const path of sourcePaths.slice(1))assert.equal(shoulder.find(item=>item.path===path)?.sha256,review.files.find(item=>item.path===path).sourceSha256);
 const regional=read('atlas-review/app/regional-guided-learning.tsx').toString();
 const player=read('atlas-review/app/shoulder-tour-player.tsx').toString();
 assert.match(regional,/finished\?'Replay full tour'/);assert.match(player,/Replay full tour/);
 assert.match(player,/onClick=\{finished \? onReplay : onPlayPause\}/);
 assert.match(player,/Tour ended · final notes remain available/);
 assert.match(player,/last \? onExit\(\) : onStep\(activeIndex \+ 1\)/,'Finish still exits after completion');
 assert.match(player,/<TourSpeedControl rate=\{rate\} onRateChange=\{onRateChange\}/);
});

const regionalAst=parsed(sourcePaths[0]);
const replayButton=findOne(regionalAst,node=>ts.isJsxElement(node)&&node.openingElement.tagName.getText(regionalAst)==='Button'&&node.getText(regionalAst).includes("finished?'Replay full tour'"));
const regionalOnClick=replayButton.openingElement.attributes.properties.find(p=>p.name?.text==='onClick').initializer.expression.getText(regionalAst);
assert(!regionalOnClick.includes('setPlaybackRate('),'Replay retains the selected regional rate');
function regionalReplay({current=true,ready=true,finished=true,scopeFinished=true,hidden=false,reduced=false,playing=false}={}){
 const state={events:[],epoch:{current:7},scope:{finished:scopeFinished}};
 const names=['isCurrentAction','ready','finished','scope','pausedImaging','playing','revokePlayback','playbackEpoch','setFinished','setContinuous','setPlaying','document','reduced','changeStep','setMotionPaused'];
 const values=[()=>current,ready,finished,state.scope,{suspend:()=>state.events.push('suspend')},playing,()=>state.events.push('pause'),state.epoch,v=>state.events.push(['finished',v]),v=>state.events.push(['continuous',v]),v=>state.events.push(['playing',v]),{hidden},reduced,v=>state.events.push(['step',v]),v=>state.events.push(['motionPaused',v])];
 runExpression(regionalOnClick,names,values)();return state;
}
test('actual regional replay resets the completed tour to stop zero and holds reduced motion',()=>{
 const normal=regionalReplay();
 assert.deepEqual(normal.events,['suspend',['finished',false],['continuous',true],['playing',true],['step',0]]);
 assert.equal(normal.scope.finished,false);assert.equal(normal.epoch.current,8);
 const reduced=regionalReplay({reduced:true});
 assert.deepEqual(reduced.events,['suspend',['finished',false],['continuous',true],['playing',false],['step',0],['motionPaused',true]]);
 for(const options of [{current:false},{ready:false},{finished:true,scopeFinished:false}]){
  const denied=regionalReplay(options);assert.deepEqual(denied.events,[]);assert.equal(denied.epoch.current,7);
 }
 const hidden=regionalReplay({hidden:true});
 assert.deepEqual(hidden.events,['suspend',['finished',false],['continuous',true],['playing',false],['step',0],['motionPaused',true]]);
 assert(!hidden.events.some(event=>Array.isArray(event)&&event[0]==='playing'&&event[1]===true),'Hidden replay refuses automatic motion');
});

const shoulderAst=parsed(sourcePaths[1]);
const replayFunction=findOne(shoulderAst,node=>ts.isFunctionDeclaration(node)&&node.name?.text==='replayTour');
const replaySource=replayFunction.getText(shoulderAst);
assert(!replaySource.includes('setTourRate('),'Replay retains the selected shoulder rate');
function shoulderReplay({guided=true,active=true,finished=true,ready=true,hidden=false,mode='study',workspaceMode='study',reduced=false}={}){
 const state={events:[],epoch:{current:11}};
 const names=['guidedLearning','tourActiveRef','tourFinishedRef','examReadyRef','document','mode','workspace','tourPlaybackEpoch','setTourContinuous','setTourPlaying','applyTourStep','reducedMotion','setTourMotionPaused'];
 const values=[guided,{current:active},{current:finished},{current:ready},{hidden},mode,{mode:workspaceMode},state.epoch,v=>state.events.push(['continuous',v]),v=>state.events.push(['playing',v]),v=>state.events.push(['step',v]),reduced,v=>state.events.push(['motionPaused',v])];
 runExpression(replaySource,names,values)();return state;
}
test('actual shoulder replay preserves the study gate, completion gate and reduced-motion pause',()=>{
 const normal=shoulderReplay();assert.deepEqual(normal.events,[['continuous',true],['playing',true],['step',0]]);assert.equal(normal.epoch.current,12);
 const reduced=shoulderReplay({reduced:true});assert.deepEqual(reduced.events,[['continuous',true],['playing',false],['step',0],['motionPaused',true]]);
 for(const options of [{guided:false},{active:false},{finished:false},{ready:false},{hidden:true},{mode:'practice'},{workspaceMode:'practice'}]){
  const denied=shoulderReplay(options);assert.deepEqual(denied.events,[]);assert.equal(denied.epoch.current,11);
 }
 const player=parsed(sourcePaths[2]);
 const click=findOne(player,node=>ts.isJsxAttribute(node)&&node.name.text==='onClick'&&node.initializer?.getText(player).includes('finished ? onReplay : onPlayPause'));
 assert.match(click.getText(player),/finished \? onReplay : onPlayPause/);
});
