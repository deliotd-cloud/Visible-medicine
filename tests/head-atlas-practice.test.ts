import assert from 'node:assert/strict';
import test from 'node:test';
import {createNativeVolumeGeometry,type Vec3} from '../lib/head-atlas-geometry.mjs';
import {canvasVoxel,firstPracticeOutcome,labelIsCorrect,maskContainsVoxel,practiceChoices,practiceEntries,practiceReviewEntries,practiceScore,shuffled} from '../lib/head-atlas-practice.ts';
import type {HeadEntry,LoadedEntry,LoadedStudy} from '../lib/head-atlas-import.ts';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
import ts from 'typescript';

const affine=[[-2,0,0,20],[0,1,0,-5],[0,0,3,2],[0,0,0,1]],shape=[4,6,8];
const entry=(id:string,label:string,family='bst'):HeadEntry=>({id,label,family,representation:'partial_mask',color:[1,0,0],opacity:{fill:.25,outline:.9},mask:{file:`${id}.bin`,sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:[2,2,3],offset_kji:[1,2,3],native_shape_kji:shape,ijk_to_ras:affine},source:{declared_scope:'Saved partial region only.'}});
function fixture(){
  const target=entry('cth.target','Target left'),other=entry('cth.other','Other right');
  const definition={image:{file:'image.bin',sha256:'a'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries:[target,other]};
  const study:LoadedStudy={definition,data:new Int16Array(shape.reduce((a,b)=>a*b)),geometry:createNativeVolumeGeometry(definition.image),range:[0,1]};
  const mask=new Uint8Array(12);mask[0]=1;mask[11]=1;
  return {study,target,other,loaded:{entry:target,mask} satisfies LoadedEntry};
}

test('native mask scoring uses exact KJI crop offsets, including final voxel; no tolerance',()=>{
  const {study,loaded}=fixture();
  for(const point of [[3,2,1],[5,3,2]] as Vec3[])assert.equal(maskContainsVoxel(loaded,study,point),true);
  for(const point of [[4,2,1],[2,2,1],[6,3,2],[3,2,0],[-1,0,0],[3.1,2,1],[8,2,1],[NaN,2,1]] as Vec3[])assert.equal(maskContainsVoxel(loaded,study,point),false);
  loaded.mask[0]=2;assert.equal(maskContainsVoxel(loaded,study,[3,2,1]),false,'non-binary values do not count');
});

test('foreign study, affine, malformed crop and locator-only answers fail closed',()=>{
  const {study,loaded,target}=fixture();
  assert.equal(maskContainsVoxel({...loaded,entry:{...target}},study,[3,2,1]),false,'identity is bound to the active inventory');
  assert.equal(maskContainsVoxel({entry:target},study,[3,2,1]),false);
  const mutate=(mask:Partial<NonNullable<HeadEntry['mask']>>)=>{const changed={...target,mask:{...target.mask!,...mask}};return maskContainsVoxel({...loaded,entry:changed},{...study,definition:{...study.definition,entries:[changed]}},[3,2,1]);};
  assert.equal(mutate({native_shape_kji:[4,6,9]}),false);
  assert.equal(mutate({ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}),false);
  assert.equal(mutate({offset_kji:[3,2,3]}),false);
  assert.equal(mutate({shape_kji:[2,2,2]}),false);
});

test('screen hit conversion follows native geometry in all planes and rejects outside canvas',()=>{
  const {study}=fixture(),rect={left:20,top:30,width:640,height:180};
  for(const view of Object.values(study.geometry.views))for(const slice of [0,view.sliceCount-1])for(const [x,y] of [[0,0],[view.width-1,view.height-1],[2,2]]){
    const ijk=view.pixelToIJK(x,y,slice);
    assert.deepEqual(canvasVoxel(view,rect,rect.left+(x+.5)*rect.width/view.width,rect.top+(y+.5)*rect.height/view.height,slice),ijk);
  }
  const view=study.geometry.views.axial;
  for(const [x,y] of [[19,31],[660,31],[21,210],[21,29]])assert.equal(canvasVoxel(view,rect,x,y,0),null);
  assert.equal(canvasVoxel(view,{...rect,width:0},20,30,0),null);
  assert.equal(canvasVoxel(view,rect,21,31,view.sliceCount),null);
});

test('oblique reversed-axis screens preserve exact native voxels without guessed resampling',()=>{
  const radians=28*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
  const geometry=createNativeVolumeGeometry({shape_kji:shape,ijk_to_ras:[[-2,0,0,20],[0,c,-3*s,-5],[0,s,3*c,2],[0,0,0,1]]});
  assert.equal(geometry.oblique,true);
  for(const view of Object.values(geometry.views)){
    const ijk:[number,number,number]=[4,3,2],p=view.pixelFromIJK(ijk),rect={left:5,top:7,width:350,height:410};
    assert.deepEqual(canvasVoxel(view,rect,5+(p.x+.5)*350/view.width,7+(p.y+.5)*410/view.height,p.slice),ijk);
  }
});

test('quiz pools omit points, curves, aliases and duplicate masks; choices use exact same-study IDs',()=>{
  const {target,other}=fixture(),third=entry('cth.third','Third'),fourth=entry('cth.fourth','Fourth','ctx');
  const alias={...entry('cth.alias','Alias'),source:{geometry_alias_of:target.id}},duplicate={...entry('cth.duplicate','Duplicate'),mask:target.mask},point={...entry('cth.point','Point'),mask:undefined};
  const entries=[target,other,third,fourth,alias,duplicate,point];
  assert.deepEqual(practiceEntries(entries).map(e=>e.id),[target,other,third,fourth].map(e=>e.id));
  assert.equal(practiceEntries(entries,'ctx').length,1);
  const choices=practiceChoices(entries,target,()=>.5);
  assert.equal(choices.length,4);assert.ok(choices.includes(target));assert.equal(new Set(choices.map(e=>e.id)).size,4);
  assert.equal(labelIsCorrect(target,target.id,choices),true);
  assert.equal(labelIsCorrect(target,other.id,choices),false);
  assert.equal(labelIsCorrect(target,target.label,choices),false);
  assert.equal(labelIsCorrect(target,target.id,[other]),false);
  assert.deepEqual(shuffled([target],()=>0),[target]);
});

test('identical mask bytes at different crop placements remain distinct practice targets and choices',()=>{
  const {target}=fixture();
  const moved={...target,id:'moved',label:'Different location',family:'ctx',mask:{...target.mask!,offset_kji:[0,2,3]}};
  const duplicate={...target,id:'copy',label:'Copy',mask:{...target.mask!,file:'copied.bin'}};
  const alias={...moved,id:'alias',source:{geometry_alias_of:moved.id}};
  const entries=[target,duplicate,moved,alias],before=structuredClone(entries);
  assert.deepEqual(practiceEntries(entries),[target,moved]);
  assert.deepEqual(practiceEntries(entries,'ctx'),[moved]);
  assert.deepEqual(new Set(practiceChoices(entries,target).map(e=>e.id)),new Set([target.id,moved.id]));
  assert.deepEqual(practiceReviewEntries([target,moved],{[target.id]:'correct'},entries),[{entry:target,outcome:'correct'},{entry:moved,outcome:'unanswered'}]);
  for(const patch of [
    {shape_kji:[3,2,2]}, {native_shape_kji:[8,6,8]},
    {ijk_to_ras:[[2,0,0,20],[0,1,0,-5],[0,0,3,2],[0,0,0,1]]}, {dtype:'int8'},
  ]){
    const different={...moved,mask:{...target.mask!,...patch}};
    assert.deepEqual(practiceEntries([target,different]),[target,different],'byte identity alone does not prove placement identity');
  }
  assert.deepEqual(entries,before);
});

test('system filtering never promotes a duplicate mask over its whole-study representative',()=>{
  const first=entry('first','First','bst'),duplicate={...entry('duplicate','Duplicate','ctx'),mask:first.mask};
  const distinct=entry('distinct','Distinct','ctx'),alias={...entry('alias','Alias','ctx'),source:{geometry_alias_of:distinct.id}};
  const rows=[first,duplicate,alias,distinct],before=structuredClone(rows);
  assert.deepEqual(practiceEntries(rows,'ctx'),[distinct]);
  assert.deepEqual(practiceEntries(rows,'bst'),[first]);
  assert.deepEqual(practiceEntries(rows,'missing'),[]);
  for(const family of ['bst','ctx','missing'])assert.deepEqual(practiceEntries(rows,family),practiceEntries(rows).filter(row=>row.family===family));
  assert.deepEqual(rows,before,'eligibility does not mutate the source');
  assert.deepEqual(practiceEntries([alias,distinct],'ctx'),[distinct],'excluded aliases do not reserve a hash');
});

test('first attempts are immutable across retries/reveals and skipped questions are not correct',()=>{
  let outcomes=firstPracticeOutcome({},'a','incorrect');
  const original=outcomes;outcomes=firstPracticeOutcome(outcomes,'a','correct');assert.equal(outcomes,original);
  outcomes=firstPracticeOutcome(outcomes,'b','correct');outcomes=firstPracticeOutcome(outcomes,'c','revealed');
  assert.deepEqual(practiceScore(outcomes,5),{correct:1,attempted:2,revealed:1,remaining:2,total:5});
});

const require=createRequire(import.meta.url),panelSource=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
test('review preserves deck order/first attempts and refuses foreign identities, aliases and malformed outcomes',()=>{
  const {target,other}=fixture(),revealed=entry('cth.revealed','Revealed'),unanswered=entry('cth.unanswered','Unanswered');
  const alias={...entry('cth.alias','Alias'),source:{geometry_alias_of:target.id}},point={...entry('cth.point','Point'),mask:undefined};
  const entries=[target,other,revealed,unanswered,alias,point],outcomes=firstPracticeOutcome({[target.id]:'incorrect',[revealed.id]:'revealed'},other.id,'correct');
  const retried=firstPracticeOutcome(outcomes,target.id,'correct'),deck=[other,target,revealed,unanswered,target,{...target},alias,point];
  assert.equal(retried,outcomes);
  assert.deepEqual(practiceReviewEntries(deck,retried,entries),[{entry:other,outcome:'correct'},{entry:target,outcome:'incorrect'},{entry:revealed,outcome:'revealed'},{entry:unanswered,outcome:'unanswered'}]);
  assert.deepEqual(practiceReviewEntries(deck,retried,entries.map(item=>({...item}))),[],'same labels/IDs in a replaced study do not match');
  assert.deepEqual(practiceReviewEntries([target],{[target.id]:'approved'} as never,entries),[]);
  assert.equal(practiceReviewEntries([target],Object.create({[target.id]:'correct'}),entries)[0].outcome,'unanswered');
});
const compilation=ts.transpileModule(panelSource,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
assert.equal(compilation.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,'Practice JSX must parse without recovery');
const compiled=compilation.outputText;
const loadedModule={exports:{} as Record<string,unknown>};
new Function('require','module','exports',compiled)((name:string)=>{
  if(name==='../lib/head-atlas-import')return {};
  if(name==='../lib/head-atlas-display')return require('../lib/head-atlas-display.ts');
  if(name==='../lib/head-atlas-practice')return require('../lib/head-atlas-practice.ts');
  if(name==='../lib/head-atlas-focus')return require('../lib/head-atlas-focus.ts');
  if(name==='../lib/head-atlas-links')return require('../lib/head-atlas-links.ts');
  if(name==='./HeadAtlasPracticeReview')return {HeadAtlasPracticeReview:()=>null,HeadAtlasPracticeFeedback:()=>null};
  if(name==='./HeadPracticeSummaryDownload')return {HeadPracticeSummaryDownload:()=>null};
  return require(name);
},loadedModule,loadedModule.exports);
const Panel=loadedModule.exports.HeadAtlasPractice as React.ComponentType<Record<string,unknown>>;
function renderPanel(overrides:Record<string,unknown>={},props:Record<string,unknown>={}){
  const {study,loaded,target,other}=fixture(),noop=()=>{};
  return renderToStaticMarkup(React.createElement(Panel,{study,familyNames:{bst:'Brainstem'},practice:{active:true,finished:false,mode:'label',target:loaded,choices:[target,other],choice:'',pick:null,outcome:null,outcomes:{},error:'',index:0,total:5,headingRef:{current:null},score:{correct:0,attempted:0,revealed:0,remaining:5,total:5},submit:noop,reveal:noop,next:noop,retry:noop,finish:noop,setChoice:noop,end:noop,...overrides},...props}));
}

test('guided return is offered only on completed guided-origin practice, never in a question',()=>{
  const callback={onReturnToLearning:()=>{}};
  assert.match(renderPanel({active:false,finished:true},callback),/Return to Guided learning/);
  assert.doesNotMatch(renderPanel({active:false,finished:true}),/Return to Guided learning/);
  for(const outcome of [null,'correct','incorrect','revealed'])assert.doesNotMatch(renderPanel({outcome},callback),/Return to Guided learning/);
});

test('completed follow-ups expose a compact revisit action without replacing guided return or leaking pending answers',()=>{
  const {target}=fixture(),originalScore={correct:1,attempted:2,revealed:1,remaining:2,total:5};
  const html=renderPanel({active:false,finished:true,revisitEntries:[target],originalScore},{onReturnToLearning:()=>{}});
  assert.match(html,/Follow-up complete/);assert.match(html,/Original set unchanged: 1 \/ 2/);
  assert.match(html,/1 incorrect, revealed or unanswered structure to revisit/);
  assert.match(html,/>Revisit missed structures<\/button>/);assert.match(html,/Return to Guided learning/);
  assert.doesNotMatch(renderPanel({active:false,finished:true,revisitEntries:[]}),/Revisit missed structures/);
  const active=renderPanel({originalScore,revisitEntries:[target]});
  assert.match(active,/Focused follow-up/);assert.doesNotMatch(active,/Revisit missed structures|Original set unchanged/);
  assert.match(panelSource,/onClick=\{p.revisit\}>Revisit missed structures/,'follow-up retains the parent guided-origin flow');
});

test('practice setup has a programmatic focus target after choosing another set',()=>{
  const html=renderPanel({active:false,finished:false,available:[]});
  assert.match(html,/<h2 tabindex="-1">Structure practice<\/h2>/);
  assert.match(panelSource,/if\(!p.active&&!p.finished\)focusHeadLearningContent\(p.headingRef.current\)/);
  assert.match(panelSource,/onStart\?\.\(\);p.start\(\)/);
});
test('right-panel questions require an explicit answer and never show scope/IDs before feedback',()=>{
  const html=renderPanel();assert.match(html,/Name the highlighted structure/);assert.match(html,/Structure label/);
  assert.match(html,/<button type="button" disabled="">Check answer/);assert.doesNotMatch(html,/Saved partial region only/);
  assert.doesNotMatch(html,/<h2[^>]*>Target left/);assert.doesNotMatch(html,/Shared geometry/);
  const locate=renderPanel({mode:'locate'});assert.match(locate,/Find: Target left/);assert.doesNotMatch(locate,/Other right/);
  assert.match(locate,/Keyboard controls/);
});
test('correct, incorrect and revealed feedback are distinct; retry is explicitly unscored',()=>{
  for(const [outcome,title] of [['correct','Correct'],['incorrect','Not quite'],['revealed','Answer revealed']]){
    const html=renderPanel({outcome});assert.ok(html.includes(`<h3 tabindex="-1">${title}</h3>`));assert.match(html,/Saved partial region only/);
    assert.match(html,/<details class="head-practice-help"><summary>Source scope &amp; limitations<\/summary>/);
    if(outcome==='correct')assert.doesNotMatch(html,/Try again/);else assert.match(html,/Try again \(unscored\)/);
  }
});
test('viewer hides index, target names, surfaces and metadata while quiz answers are pending',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(source,/const sidebar=quizActive\?/);assert.match(source,/showName=\{!hideAnswer\}/);
  assert.match(source,/anchorX>=0&&selected&&showName/);assert.match(source,/\{!quizActive&&<section className="head-view head-surface-view"/);
  assert.match(source,/quizActive\?'':status/);assert.match(source,/quizActive\?\(practice.mode==='label'\|\|practice.mode==='recall'\|\|practice.outcome\?practice.target:null\)/);
  assert.match(source,/disabled=\{quizActive\}/);assert.match(panelSource,/controller.signal.aborted/);
  assert.match(source,/if\(panMode\|\|event.repeat\|\|!\(keyboardMoved\|\|quizPick\)\)return;\s*if\(onAnswer\)onAnswer\(cursor\);else pickMask\(cursor\);/,'activation rejects untouched/repeated/panning input before the separate quiz and exploration actions');
  assert.match(source,/if\(showCrosshair&&\(!onAnswer\|\|keyboardMoved\|\|quizPick\)\)/,'optional crosshair still cannot reveal a pending locate answer');
  assert.match(source,/planes.filter\(plane=>!expanded\|\|expanded===plane\)/,'inactive planes do not render full volumes');
  assert.match(panelSource,/closest\('\.imaging-workspace-info'\)\?\.scrollTo/,'new-question navigation scrolls only the information pane');
  assert.match(panelSource,/heading=feedbackRef.current/,'feedback receives focus when the submit button unmounts');
});

test('crosshair is off by default with an independent labelled control and keyboard-practice opt-in',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(source,/\[showCrosshair,setShowCrosshair\]=useState\(false\)/);
  assert.match(source,/checked=\{showCrosshair\} onChange=\{event=>setShowCrosshair\(event.target.checked\)\}\/\> Crosshair localizer/);
  assert.match(source,/showCrosshair=\{showCrosshair\}/);
  assert.match(source,/if\(onAnswer\|\|canPick\)onKeyboardMove\?\.\(\)/,'intentional arrows reveal the localizer for quiz answers or eligible exploration mask picking');
  assert.match(source,/onKeyboardMove=\{\(\)=>setShowCrosshair\(true\)\}/);
  assert.match(source,/regionalCourse,showCrosshair,view/,'visibility changes redraw the annotations');
});
