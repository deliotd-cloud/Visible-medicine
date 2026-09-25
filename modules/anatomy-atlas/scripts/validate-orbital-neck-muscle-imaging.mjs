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
import {authoringBeforeOrbitalNeckMuscleImaging,orbitalNeckMuscleImagingHash as hash} from './orbital-neck-muscle-imaging-history.mjs';
import pins from '../content/orbital-neck-muscle-imaging-pins.json' with {type:'json'};
import {authoringBeforeThoracoabdominalOrganImaging} from './thoracoabdominal-organ-imaging-history.mjs';
import {beforeCorpusSpongiosumSource} from './corpus-spongiosum-source-history.mjs';
const newest=await contentContext(),context={...newest,api:beforeCorpusSpongiosumSource(authoringBeforeThoracoabdominalOrganImaging(newest),newest.catalog)},{api}=context,catalog=api.bodyDisplayCatalog(context.catalog);
const {orbitalNeckMuscleImagingGroups:groups,orbitalNeckMuscleImagingModes:modes,orbitalNeckMuscleImagingReferences:references}=api;
const original=JSON.stringify(catalog),before=authoringBeforeOrbitalNeckMuscleImaging(newest);
// Scoped rewind helpers retain unrelated later teaching. Use the original Git
// trees for the complete old snapshot, and keep the live checks below separate.
const transitionCommit='76e0d191c683f273d2399216d82a592b14438b7d';
const gitBytes=(commit,path)=>execFileSync('git',['show',commit+':'+path],{maxBuffer:16e6});
const transition=JSON.parse(await readFile('content/orbital-neck-muscle-imaging.transition.json','utf8'));
assert.deepEqual(JSON.parse(gitBytes(transitionCommit,'content/orbital-neck-muscle-imaging-pins.json')),pins);
assert.deepEqual(JSON.parse(gitBytes(transitionCommit,'content/orbital-neck-muscle-imaging.transition.json')),transition);
const rawBefore=JSON.parse(gitBytes(pins.sourceCommit,'public/models/bodyparts3d/full-body/catalog.json'));
const rawAfter=JSON.parse(gitBytes(transitionCommit,'public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(rawAfter,rawBefore,'Original raw geometry catalog unchanged');
const historicalBefore=await exactSourceHistoryApi(pins.sourceCommit);
const historicalAfter=await exactSourceHistoryApi(transitionCommit);
const oldDisplay=historicalBefore.bodyDisplayCatalog(rawBefore);
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
 assert.deepEqual(s,entry.entry.identity);assert.deepEqual(previous,entry.entry.previous[t]);
 assert.equal(hash(next),transition.entries.find(e=>e.id===s.id).sections[t]);
 assert.deepEqual(api.bodyLesson(s,t),next,'Live normalized lesson matches original transition');
 historicalChanged++;
}
assert.equal(historicalChanged,112);assert.equal(historicalUnchanged,9797);
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);
for(const r of records)assert(validate(r));
let changed=0,unchanged=0,rejected=0,rendered=0;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of catalog.structures)for(const tab of api.contentTabs) {
  const topic=api.orbitalNeckMuscleImagingLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(now,before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;
  assert.equal(before.bodyLesson(s,tab).readiness,'pending');
  assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],topic);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);
  assert(html.includes(render(React.createElement('p',null,now.body))));
  for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  const copy=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.orbitalNeckMuscleImagingLesson(s,tab),copy);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
assert.equal(Object.keys(groups).length,21);
for(const group of Object.values(groups)){
  assert.equal(group.fmaIds.length,2);
  assert.equal(Object.keys(group.focus).length,group.family==='orbital'?2:3);
  for(const [i,id] of group.fmaIds.entries()){
    const s=pins.entries.find(e=>e.identity.fmaId===id)?.identity;
    assert(s);assert(s.regions.includes('head-neck'));assert.equal(s.laterality,i===0?'left':'right');
  }
}
for(const [family,count] of [['orbital',14],['neck',12],['hyoid',16]])assert.equal(pins.entries.filter(e=>groups[e.group].family===family).length,count);
assert.equal(changed,112);assert.equal(unchanged,9797);assert.equal(rendered,112);
const unresolved=pins.entries.filter(e=>!groups[e.group].focus.ultrasound).map(e=>e.identity);
assert.equal(unresolved.length,14);
for(const s of unresolved){assert.equal(api.orbitalNeckMuscleImagingLesson(s,'ultrasound'),undefined);assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');}
assert.equal(pins.entries.filter(e=>e.group==='digastric').find(e=>e.identity.laterality==='left').identity.sources.length,3);
assert.equal(pins.entries.filter(e=>e.group==='digastric').find(e=>e.identity.laterality==='right').identity.sources.length,2);
assert.match(groups['levator-palpebrae-superioris'].limitation,/superior tarsal/);
assert.match(groups['scalenus-posterior'].landmark,/rib 2/);
assert.match(groups.sternothyroid.landmark,/thyroid cartilage/);
assert.equal(pins.entries.some(e=>['FMA81752','FMA81753'].includes(e.identity.fmaId)),false);
for(const {identity:s} of pins.entries)for(const mutate of [
  x=>x.system='muscular',x=>x.category='organ',x=>x.laterality=x.laterality==='left'?'right':'left',x=>x.id=pins.entries.find(e=>e.identity.id!==s.id).identity.id,
  x=>x.id+='foreign',x=>x.name+='foreign',x=>x.fmaId='FMA000',x=>x.laterality='foreign',x=>x.region='foot',x=>x.regions.push('foot'),x=>x.sourceName+='foreign',x=>x.sourceTree='foreign',x=>x.sources[0].sha256='changed',x=>x.sources[0].file='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign',x=>x.anchor[0]+=.01,x=>x.bounds.min[0]+=.01,x=>x.validation={status:'unvalidated',anatomicalReview:true},
]) {const bad=structuredClone(s);mutate(bad);for(const tab of pins.entries.find(e=>e.identity.id===s.id).topics){assert.equal(api.orbitalNeckMuscleImagingLesson(bad,tab),undefined);assert.equal(newest.api.bodyLesson(bad,tab).readiness,'pending');rejected++;}}
assert.equal(rejected,2128);
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeOrbitalNeckMuscleImaging({...newest,api:{...newest.api,bodyLesson(s,t){const lesson=newest.api.bodyLesson(s,t);return s.id===first.id&&t==='ct'?{...lesson,body:'unrecorded'}:lesson;}}}),/Unrecorded orbital\/neck muscle imaging change|Unrecorded whole-body teaching change after clinical reference revision/);
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const budgets={},unique=new Map();
for(const entry of [...Object.values(modes),...Object.values(groups).flatMap(g=>Object.values(g.focus))])unique.set(JSON.stringify(entry),entry);
for(const f of unique.values())for(const key of f.references){assert(references[key]?.startsWith('https://'));budgets[key]=(budgets[key]||0)+(f.text.match(/\S+/g)?.length||0);}
for(const [key,count]of Object.entries(budgets))assert(count<=200,key+' reference word count '+count);
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,groups:Object.keys(groups).length,sourceSelections:pins.entries.length,addedDraftPlacements:changed,modalities:{ct:42,mri:42,ultrasound:28},unchangedTopics:unchanged,ultrasoundPending:unresolved.map(s=>s.fmaId),bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
report.historicalReplay={baselineSource:pins.sourceCommit,transitionCommit,changedTopics:historicalChanged,unchangedTopics:historicalUnchanged,originalPinsUnchanged:true,exactGitTrees:true};
await writeFile('docs/orbital-neck-muscle-imaging-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
