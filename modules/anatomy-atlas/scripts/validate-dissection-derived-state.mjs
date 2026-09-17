import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
const baseline='6b1385e522a90cda5f76aa5fc7e587673991c910';
const source=await readFile('app/body-explorer.tsx','utf8');
const original=execFileSync('git',['show',baseline+':app/body-explorer.tsx'],{encoding:'utf8'});
const compiled=await build({stdin:{contents:`
export * from './lib/body-display-catalog';
export * from './app/body-types';
export * from './app/dissection-data';
export * from './lib/dissection-guidance';
export * from './lib/atlas-practice';
export * from './lib/anatomy-load-state';
export * from './lib/knee-studies';
export * from './lib/elbow-studies';
export * from './lib/cubital-studies';
export * from './lib/body-presentation-parts';
export * from './lib/genicular-study';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8')));
const untouched=JSON.stringify(catalog);
const names=['available','enabledIds','jointCloseUp','guidance','focusTargetIds','practiceEligible','practiceReady','availableQuestions','practiceLoadStatus','practiceBlocked','retryIds','retryCount','sceneStructures','required','loadStatus','pending','practicePaused'];
function expressions(text) {
  const ast=ts.createSourceFile('explorer.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const found=[];
  for(const f of ast.statements)if(ts.isFunctionDeclaration(f)&&f.body)for(const statement of f.body.statements)if(ts.isVariableStatement(statement))
    for(const declaration of statement.declarationList.declarations)if(names.includes(declaration.name.getText(ast)))found.push('const '+declaration.getText(ast)+';');
  assert.equal(found.length,names.length,'All actual explorer derivations located exactly once');
  return ts.transpile(found.join('\n')+'\nreturn {'+names.join(',')+'};',{target:ts.ScriptTarget.ES2022});
}
const inputNames=['regionStructures','presentationStructures','systems','profile','dissection','hiddenIds','loaded','failed','initialRegion','exam','focus','isolated','ghostRemoved','showOrigins','explode','layout','inspection','catalog','focusedStudy','practiceSampling','practiceMode','practiceResult','displayReady','practice'];
const apiNames=['dissectionGuidance','matchesRule','practicePool','practiceCanStart','practiceQuestionCount','anatomyLoadSummary','missedPracticeIds','practiceRenderIds','requestedAnatomyBundles','kneeStudyBounds','elbowStudyBounds','genicularStudyBounds','cubitalStudyBounds'];
function runner(text,cache=true) {
  const fn=new Function(...inputNames,...apiNames,'useMemo',expressions(text));
  let index=0,cells=[],calls={};
  const helpers=apiNames.map(name=>(...args)=>{calls[name]=(calls[name]||0)+1;return api[name](...args);});
  function useMemo(create,deps) {
    const i=index++,cell=cells[i];
    if(cache&&cell&&deps.length===cell.deps.length&&deps.every((d,j)=>Object.is(d,cell.deps[j])))return cell.value;
    const value=create();cells[i]={deps:[...deps],value};return value;
  }
  return {render(input){index=0;return fn(...inputNames.map(n=>input[n]),...helpers,useMemo);},calls,reset(){for(const k of Object.keys(calls))delete calls[k];},discard(){cells=[];}};
}
const serial=value=>JSON.stringify(value,(_k,v)=>v instanceof Set?[...v]:v);
let comparisons=0,scopes=0,repeatedRenders=0,invalidations=0;
const heavy=['dissectionGuidance','practiceQuestionCount','practicePool','requestedAnatomyBundles','anatomyLoadSummary'];
const timing={};
for(const region of Object.keys(api.dissectionProfiles))for(const side of ['both','left','right']) {
  const regionStructures=catalog.structures.filter(s=>(region==='whole-body'||s.regions.includes(region))&&(side==='both'||s.laterality===side||['midline','unpaired','unspecified'].includes(s.laterality)));
  const profile=api.dissectionProfiles[region];
  const loaded=[...new Set(regionStructures.map(s=>s.bundle))];
  const input={regionStructures,systems:{...api.allBodySystems},profile,dissection:api.initialDissection,hiddenIds:[],loaded,failed:[],initialRegion:region,exam:false,focus:false,isolated:false,ghostRemoved:false,showOrigins:false,explode:0,layout:'spatial',inspection:{plane:'off'},catalog,focusedStudy:undefined,practiceSampling:'all',practiceMode:'reason',practiceResult:[],displayReady:true,practice:api.initialPractice};
  // The old optimization baseline predates presentation-only source records.
  // Replay that contract with identity presentation, then separately exercise
  // today's actual presentation records against fresh current calculations.
  input.presentationStructures=regionStructures;
  const before=runner(original),after=runner(source),uncached=runner(source,false);
  function check() {
    const actual=after.render(input),expected=before.render(input);
    assert.equal(serial(actual),serial(expected),'Prior results retained: '+region+'/'+side);
    assert.equal(serial(actual),serial(uncached.render(input)),'Memo discard is semantically safe');
    comparisons++;
    return actual;
  }
  const first=check();after.reset();
  const start=performance.now();
  for(let i=1;i<=12;i++) {
    input.explode=i*7;input.showOrigins=i%2===0;input.isolated=i%3===0;
    const value=after.render(input);
    for(const key of ['available','enabledIds','guidance','practiceEligible','practiceLoadStatus','retryIds','sceneStructures','required','loadStatus'])assert.equal(value[key],first[key],key+' identity survives presentation changes');
    repeatedRenders++;
  }
  const currentMs=performance.now()-start;
  for(const name of heavy)assert.equal(after.calls[name]||0,0,name+' must not rerun for presentation');
  if(region==='whole-body'&&side==='both') {
    const t=performance.now();for(let i=0;i<12;i++)before.render(input);
    timing.twelveWholeBodyDerivations={beforeMs:+(performance.now()-t).toFixed(3),afterMs:+currentMs.toFixed(3),measurement:'Node execution of actual extracted explorer derivations; not browser frame rate or INP'};
  }
  check();
  // Every changed dependency must match the original fresh calculation.
  for(const mode of ['find','name','reason']){input.practiceMode=mode;check();invalidations++;}
  if(regionStructures.length) {
    input.hiddenIds=[regionStructures[0].id];check();
    input.systems={...input.systems,[regionStructures[0].system]:false};check();
    input.systems={...api.allBodySystems};input.hiddenIds=[];check();
    input.failed=[loaded[0]];check();assert(!after.render(input).practiceEligible.some(s=>s.bundle===loaded[0]));
    input.loaded=loaded.filter(b=>b!==loaded[0]);input.failed=[];check();
    input.loaded=loaded;check();
    input.practiceResult=[{target:regionStructures[0].id,chosen:null}];check();
    invalidations+=7;
  }
  for(const recipe of profile.focuses.slice(0,2)) {
    input.dissection=api.dissectionReducer(input.dissection,{type:'focus',id:recipe.id});
    input.focusedStudy=recipe;input.hiddenIds=api.resolveDissection(regionStructures,profile,input.dissection).removed.map(s=>s.id);input.practiceSampling='focus';check();invalidations++;
  }
  input.dissection=api.initialDissection;input.focusedStudy=undefined;input.hiddenIds=[];input.practiceSampling='all';
  input.ghostRemoved=true;check();
  input.displayReady=false;check();assert(after.render(input).practiceBlocked);
  for(const mode of ['find','name','reason']) {
    const session=api.createPracticeSession(regionStructures,loaded,{id:1,mode,count:2,sampling:'all'},()=>.31);
    if(!session)continue;
    input.practice=session;input.exam=true;input.displayReady=true;check();
    if(session.questions.length>1){input.practice={...session,index:1};check();}
    input.failed=[loaded[0]];check();input.failed=[];
    input.practice=api.initialPractice;input.exam=false;check();invalidations+=4;
  }
  after.discard();check();
  input.presentationStructures=regionStructures.map(s=>api.bodyPresentationStructure(s,side));
  for(const explode of [0,30,100]){
    input.explode=explode;
    const actual=after.render(input);
    assert.equal(serial(actual),serial(uncached.render(input)),'Actual presentation records survive cache reuse/discard');
    assert.deepEqual(actual.sceneStructures,input.presentationStructures);
    comparisons++;
  }
  scopes++;
}
assert.equal(JSON.stringify(catalog),untouched,'Source records never mutated');
const report={baselineSource:baseline,scopes,comparisons,presentationRenders:repeatedRenders,heavyHelperCallsOnPresentation:0,changedInputChecks:invalidations,...timing,sourceRecords:catalog.structures.length,anatomyChanged:false,clinicalApproval:false,browserInteractionTesting:false,limitations:'Memo semantics/dependency replay and local CPU sample, not WebGL, browser, touch, clinical acceptance or a performance guarantee.'};
await writeFile('docs/dissection-derived-state-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
