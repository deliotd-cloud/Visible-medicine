import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {build} from './workspace-component-test-build.mjs';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const newest=await contentContext(),currentCatalog=newest.api.bodyDisplayCatalog(newest.catalog);
// The original transition is proved from exact Git trees. Current learner
// checks below use the current tree without unwinding unrelated history.
const transitionCommit='270ef68dc7499672549ee3967b485f61eecf3139';
const gitBytes=(commit,path)=>execFileSync('git',['show',commit+':'+path],{maxBuffer:16e6});
const transition=JSON.parse(await readFile('content/central-vessel-imaging.transition.json','utf8'));
assert.deepEqual(JSON.parse(gitBytes(transitionCommit,'content/central-vessel-imaging-pins.json')),pins);
assert.deepEqual(JSON.parse(gitBytes(transitionCommit,'content/central-vessel-imaging.transition.json')),transition);
const rawBefore=JSON.parse(gitBytes(pins.sourceCommit,'public/models/bodyparts3d/full-body/catalog.json'));
const rawAfter=JSON.parse(gitBytes(transitionCommit,'public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(rawAfter,rawBefore,'Original transition preserves raw geometry catalog');
const historicalBefore=await exactSourceHistoryApi(pins.sourceCommit);
const historicalAfter=await exactSourceHistoryApi(transitionCommit,'central-vessel-epoch');
const oldDisplay=historicalBefore.bodyDisplayCatalog(rawBefore);
const api=historicalAfter,catalog=api.bodyDisplayCatalog(rawAfter),before=historicalBefore;
const {centralVesselImagingGroups:groups,centralVesselImagingReferences:references}=api;
const original=JSON.stringify(catalog);
const celiacDisplay=JSON.parse(await readFile('content/celiac-display-transition.json','utf8'));
assert.equal(hash(celiacDisplay),'04fe1aeaba2bc1c5960b8bf5637d0f4ec498c49c63dd9997beddd06023c2c08e');
assert.deepEqual(pins.entries.find(e=>e.identity.id===celiacDisplay.original.id)?.identity,celiacDisplay.original);
const pulmonaryTransition=JSON.parse(await readFile('content/pulmonary-venous-teaching.transition.json','utf8'));
assert.equal(hash(pulmonaryTransition),'5620e0dd7fd38b4928615ff3b7811654c248eeb5e2ecfab8191e0eacd4c14361');
const revisedPulmonary=new Map(pulmonaryTransition.entries.filter(e=>e.tab==='ct'||e.tab==='mri').map(e=>[e.identity.id+'|'+e.tab,e]));
assert.equal(revisedPulmonary.size,8);
assert.deepEqual(historicalAfter.bodyDisplayCatalog(rawAfter),oldDisplay);
assert.deepEqual(historicalBefore.contentTabs,api.contentTabs);
assert.deepEqual(historicalAfter.contentTabs,api.contentTabs);
assert.equal(hash(wholeBodyTeachingSnapshot(historicalBefore,rawBefore)),pins.previousAllLessonsAndRecipesHash,'All original preceding teaching and recipes preserved');
assert.deepEqual(historicalAfter.structures,historicalBefore.structures);
assert.deepEqual(historicalAfter.dissectionProfiles,historicalBefore.dissectionProfiles);
const recorded=new Map(pins.entries.flatMap(e=>e.topics.map(t=>[e.identity.id+'|'+t,{entry:e,tab:t}])));
let historicalChanged=0,historicalUnchanged=0;
for(const s of oldDisplay.structures)for(const t of api.contentTabs){
 const entry=recorded.get(s.id+'|'+t),previous=historicalBefore.bodyLesson(s,t),next=historicalAfter.bodyLesson(s,t);
 if(!entry){assert.deepEqual(next,previous,'Original unrelated topic preserved');historicalUnchanged++;continue;}
 assert.deepEqual(s,entry.entry.identity);
 assert.deepEqual(previous,entry.entry.previous[t]);
 assert.equal(hash(next),transition.entries.find(e=>e.id===s.id).sections[t]);
 assert.deepEqual(api.centralVesselImagingLesson(s,t),next,'Original recorded resolver output');
 historicalChanged++;
}
assert.equal(historicalChanged,79);assert.equal(historicalUnchanged,9830);
const records=newest.api.bodyContentRecords(currentCatalog),registry=new Map([...newest.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const r of records)assert(validate(r));
let changed=0,unchanged=0,rejected=0,rendered=0;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const compiled=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes'; export {teachingHeading} from './lib/teaching-heading';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const noteScope={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module:noteScope,exports:noteScope.exports,require});
const {SourceDisplayNotes,teachingHeading}=noteScope.exports;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){
  // Select the direct note callback, not its newer lazy-loader parent arrow.
  const note=ts.isArrowFunction(n)&&ts.isBlock(n.body)&&n.body.statements.some(statement=>
    ts.isVariableStatement(statement)&&statement.declarationList.declarations.some(declaration=>
      declaration.name.getText(ast)==='content'&&declaration.initializer?.getText(ast)==='bodyContent(selected, value)'));
  if(note){assert(!callback,'Exactly one direct learner note callback');callback=n.getText(ast);}
  ts.forEachChild(n,visit);
}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of catalog.structures)for(const tab of api.contentTabs) {
  const topic=api.centralVesselImagingLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(now,before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const liveIdentity=currentCatalog.structures.find(row=>row.id===s.id);
  assert(liveIdentity,'Original central-vessel selection remains in current catalog');
  assert.deepEqual(liveIdentity,s.id===celiacDisplay.original.id?celiacDisplay.replacement:s,'Exact current central source identity');
  const liveTopic=newest.api.centralVesselImagingLesson(liveIdentity,tab),liveNow=newest.api.bodyLesson(liveIdentity,tab);
  const pulmonary=revisedPulmonary.get(s.id+'|'+tab);
  if(pulmonary){
    assert.deepEqual(pulmonary.identity,s,'Exact pulmonary revision source');
    assert.deepEqual(liveTopic,topic,'Original central helper remains intact');
    assert.deepEqual(pulmonary.previous,topic,'Recorded pulmonary predecessor');
    assert.equal(hash(liveNow),pulmonary.currentHash,'Exact later pulmonary revision');
  }else if(s.fmaId==='FMA3789'&&tab==='ultrasound'){
    assert.deepEqual(liveNow,liveTopic);
    assert.equal(hash(liveTopic),'958d0ae247bdcd128fcb61493208080306eedd171322752643a4aac7031723bb');
  }else{
    assert.deepEqual(liveNow,liveTopic);
    assert.deepEqual(liveTopic,topic,'Every other current central topic matches original epoch');
  }
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],liveNow);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,teachingHeading,topic:tab,bodyContent:newest.api.bodyContent,selected:liveIdentity,SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:currentCatalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,liveNow.body))));
  for(const bullet of liveNow.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const url of liveNow.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  const copy=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.centralVesselImagingLesson(s,tab),copy);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
assert.equal(Object.keys(groups).length,29);assert.equal(changed,79);assert.equal(unchanged,catalog.structures.length*api.contentTabs.length-changed);assert.equal(rendered,79);
for(const [region,count] of [['thorax',12],['abdomen',17]])assert.equal(pins.entries.filter(e=>groups[e.group].region===region).length,count);
const unresolved=pins.entries.filter(e=>!groups[e.group].focus.ultrasound).map(e=>e.identity);
assert.deepEqual(unresolved.map(s=>s.fmaId).sort(),['FMA14768','FMA4838','FMA4944','FMA49911','FMA49913','FMA49914','FMA49916','FMA87217']);
const preThoracicEus=await exactSourceHistoryApi('b03ba458907946c1b1c152149ee5867f8d6a62df');
const azygos=unresolved.find(s=>s.fmaId==='FMA4838');
assert.equal(azygos.id,'vm:anatomy:body:thorax:unspecified:vessel:azygos-vein');
for(const s of unresolved){
 assert.equal(api.centralVesselImagingLesson(s,'ultrasound'),undefined);
 assert.equal(historicalAfter.bodyLesson(s,'ultrasound').readiness,'pending','Original central-vessel transition');
 const currentIdentity=currentCatalog.structures.find(row=>row.id===s.id);
 assert.deepEqual(currentIdentity,s,'Unresolved original central source remains exact');
 const currentLesson=newest.api.bodyLesson(currentIdentity,'ultrasound');
 if(s.id===azygos.id){
  assert.equal(preThoracicEus.bodyLesson(s,'ultrasound').readiness,'pending','Exact pre-addition azygos lesson');
  assert.equal(currentLesson.readiness,'draft','Current scoped azygos addition');
 }else if(s.fmaId==='FMA14768'){
  assert.equal(preThoracicEus.bodyLesson(s,'ultrasound').readiness,'draft','Completed abdominal EUS lesson');
  assert.deepEqual(currentLesson,preThoracicEus.bodyLesson(s,'ultrasound'));
 }else assert.deepEqual(currentLesson,preThoracicEus.bodyLesson(s,'ultrasound'),'Current unresolved-topic continuity');
}
assert.match(groups['right-renal-artery'].focus.ct.body,/behind the IVC/);
assert.match(groups.hemiazygos.focus.ct.pitfall,/midline source tag/);
assert.match(groups['inferior-cava'].focus.ct.pitfall,/mixing.*mimic thrombus/);
assert.match(groups['left-gastric-artery'].focus.ct.pitfall,/left hepatic artery/);
for(const {identity:s,topics} of pins.entries)for(const mutate of [
  x=>x.system='muscular',x=>x.category='bone',x=>x.laterality=x.laterality==='left'?'right':'left',x=>x.id=pins.entries.find(e=>e.identity.id!==s.id).identity.id,
  x=>x.id+='foreign',x=>x.name+='foreign',x=>x.fmaId='FMA000',x=>x.laterality='foreign',x=>x.region='foot',x=>x.regions.push('foot'),x=>x.sourceName+='foreign',x=>x.sourceTree='foreign',x=>x.sources[0].sha256='changed',x=>x.sources[0].file='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign',x=>x.anchor[0]+=.01,x=>x.bounds.min[0]+=.01,x=>x.validation={status:'unvalidated',anatomicalReview:true},
]) {const bad=structuredClone(s);mutate(bad);for(const tab of topics){assert.equal(newest.api.centralVesselImagingLesson(bad,tab),undefined);assert.equal(newest.api.bodyLesson(bad,tab).readiness,'pending');rejected++;}}
assert.equal(rejected,1501);
// Every live original placement is checked above against its immutable original
// lesson or a hash-bound later revision; no unrelated unrolling adapter is used.
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const budgets={},unique=new Map();
for(const entry of Object.values(groups).flatMap(g=>Object.values(g.focus)))unique.set(JSON.stringify(entry),entry);
for(const f of Object.values(groups).flatMap(g=>Object.values(g.focus)))for(const key of f.references){assert(references[key]?.startsWith('https://'));budgets[key]=(budgets[key]||0)+((f.body+' '+f.pitfall).match(/\S+/g)?.length||0);}
for(const [key,count]of Object.entries(budgets))assert(count<=200,key+' reference word count '+count);
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,groups:29,sourceSelections:29,addedDraftPlacements:changed,modalities:{ct:29,mri:29,ultrasound:21},unchangedTopics:unchanged,ultrasoundPending:unresolved.map(s=>s.fmaId),bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
report.historicalReplay={transitionCommit,changedTopics:historicalChanged,unchangedTopics:historicalUnchanged,originalBaselineHash:pins.previousAllLessonsAndRecipesHash,originalCatalogAndRecipesUnchanged:true};
report.currentLearner={renderedOriginalPlacements:rendered,laterExactTopicRevisions:9,
 laterEusDrafts:['FMA14768','FMA4838'],ultrasoundPending:unresolved.filter(s=>newest.api.bodyLesson(s,'ultrasound').readiness==='pending').map(s=>s.fmaId),
 geometryOrApprovalChanged:false,scope:'Actual current learner/export/source guards; original 79-placement epoch is replayed from immutable Git trees without repinning.'};
await writeFile('docs/central-vessel-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
