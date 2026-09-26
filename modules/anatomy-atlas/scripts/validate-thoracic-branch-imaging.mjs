import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot} from './pin-pica-clinical.mjs';
import {build} from './workspace-component-test-build.mjs';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeThoracicBranchImaging,thoracicBranchImagingHash as hash} from './thoracic-branch-imaging-history.mjs';
import pins from '../content/thoracic-branch-imaging-pins.json' with {type:'json'};
import {authoringBeforeAbdominalBranchImaging} from './abdominal-branch-imaging-history.mjs';
const newest=await contentContext(),context={...newest,api:authoringBeforeAbdominalBranchImaging(newest)},{api}=context,catalog=api.bodyDisplayCatalog(context.catalog);
const {thoracicBranchImagingGroups:groups,thoracicBranchImagingReferences:references}=api;
const original=JSON.stringify(catalog),before=authoringBeforeThoracicBranchImaging(newest);
// Original whole-atlas history belongs to its exact Git tree, not today's
// recipes and later geometry partially projected through editorial adapters.
const transitionCommit='193de0e4273fee3ae69cf3f4402b74b6cde5e118';
const gitJson=(commit,path)=>JSON.parse(execFileSync('git',['show',commit+':'+path],{maxBuffer:16e6}));
const transition=JSON.parse(await readFile('content/thoracic-branch-imaging.transition.json'));
assert.deepEqual(gitJson(transitionCommit,'content/thoracic-branch-imaging-pins.json'),pins);
assert.deepEqual(gitJson(transitionCommit,'content/thoracic-branch-imaging.transition.json'),transition);
const rawBefore=gitJson(pins.sourceCommit,'public/models/bodyparts3d/full-body/catalog.json');
assert.deepEqual(gitJson(transitionCommit,'public/models/bodyparts3d/full-body/catalog.json'),rawBefore);
const historicalBefore=await exactSourceHistoryApi(pins.sourceCommit),historicalAfter=await exactSourceHistoryApi(transitionCommit);
const oldDisplay=historicalBefore.bodyDisplayCatalog(rawBefore);
assert.deepEqual(historicalAfter.bodyDisplayCatalog(rawBefore),oldDisplay);
assert.equal(hash(snapshot(historicalBefore,oldDisplay)),pins.previousAllLessonsAndRecipesHash,'Original full snapshot remains pinned');
assert.deepEqual(historicalAfter.structures,historicalBefore.structures);
assert.deepEqual(historicalAfter.dissectionProfiles,historicalBefore.dissectionProfiles);
assert.deepEqual(historicalBefore.contentTabs,api.contentTabs);assert.deepEqual(historicalAfter.contentTabs,api.contentTabs);
const recorded=new Map(pins.entries.flatMap(e=>e.topics.map(tab=>[e.identity.id+'|'+tab,e])));
let historicalChanged=0,historicalUnchanged=0;
for(const s of oldDisplay.structures)for(const tab of api.contentTabs){
  const e=recorded.get(s.id+'|'+tab),previous=historicalBefore.bodyLesson(s,tab),next=historicalAfter.bodyLesson(s,tab);
  if(!e){assert.deepEqual(next,previous,'Original unrelated topic');historicalUnchanged++;continue;}
  assert.deepEqual(s,e.identity);assert.deepEqual(previous,e.previous[tab]);
  assert.equal(hash(next),transition.entries.find(entry=>entry.id===s.id).sections[tab]);
  assert.deepEqual(api.bodyLesson(s,tab),next,'Retained current topic matches original recorded draft');historicalChanged++;
}
assert.equal(historicalChanged,50);assert.equal(historicalUnchanged,9859);
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const r of records)assert(validate(r));
let changed=0,unchanged=0,rejected=0,rendered=0;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const built=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const {SourceDisplayNotes}=scope.exports;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of catalog.structures)for(const tab of api.contentTabs) {
  const topic=api.thoracicBranchImagingLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(now,before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],topic);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,now.body))));
  for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  const copy=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.thoracicBranchImagingLesson(s,tab),copy);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
// This later, separately admitted source survives the legacy projection. Keep
// the original 9,859-topic baseline; account for only its exact nine topics.
const laterSource=gitJson('efc5ed08bd300540861161f8f823aedb359a789d','public/models/bodyparts3d/corpus-spongiosum/catalog.json');
const laterStructures=catalog.structures.filter(s=>!oldDisplay.structures.some(old=>old.id===s.id));
assert.deepEqual(laterStructures,laterSource.structures);assert.equal(laterStructures.length,1);
assert.equal(Object.keys(groups).length,26);assert.equal(changed,50);assert.equal(unchanged,9859+9);assert.equal(rendered,50);
for(const [region,count] of [['thorax',26]])assert.equal(pins.entries.filter(e=>groups[e.group].region===region).length,count);
const pending={mri:['FMA3969','FMA4068','FMA3988','FMA4083','FMA10692','FMA4077','FMA4758','FMA4772','FMA4786','FMA4149','FMA10704','FMA68109','FMA71537'],ultrasound:['FMA3802','FMA3855','FMA3862','FMA3895','FMA4707','FMA4713','FMA10692','FMA4077','FMA4758','FMA4772','FMA4786','FMA4149','FMA10704','FMA68109','FMA71537']};
for(const tab of ['mri','ultrasound']){const unresolved=pins.entries.filter(e=>!groups[e.group].focus[tab]).map(e=>e.identity);assert.deepEqual(unresolved.map(s=>s.fmaId).sort(),pending[tab].sort());for(const s of unresolved){assert.equal(api.thoracicBranchImagingLesson(s,tab),undefined);assert.equal(api.bodyLesson(s,tab).readiness,'pending');}}
assert.match(groups['right-internal-thoracic-vein'].focus.ct.pitfall,/neither a brachiocephalic nor direct caval/);
assert.match(groups['variant-bronchial-artery'].focus.ct.pitfall,/variant-labelled.*spinal/);
assert.match(groups['esophageal-branches'].focus.ct.pitfall,/grouped source/);
assert.match(groups['left-brachiocephalic-vein'].focus.ct.pitfall,/not a mirror/);
for(const {identity:s,topics} of pins.entries)for(const mutate of [
  x=>x.system='muscular',x=>x.category='bone',x=>x.laterality=x.laterality==='left'?'right':'left',x=>x.id=pins.entries.find(e=>e.identity.id!==s.id).identity.id,
  x=>x.id+='foreign',x=>x.name+='foreign',x=>x.fmaId='FMA000',x=>x.laterality='foreign',x=>x.region='foot',x=>x.regions.push('foot'),x=>x.sourceName+='foreign',x=>x.sourceTree='foreign',x=>x.sources[0].sha256='changed',x=>x.sources[0].file='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign',x=>x.anchor[0]+=.01,x=>x.bounds.min[0]+=.01,x=>x.validation={status:'unvalidated',anatomicalReview:true},
]) {const bad=structuredClone(s);mutate(bad);for(const tab of topics){assert.equal(api.thoracicBranchImagingLesson(bad,tab),undefined);assert.equal(api.bodyLesson(bad,tab).readiness,'pending');rejected++;}}
assert.equal(rejected,950);
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeThoracicBranchImaging({...newest,api:{...newest.api,bodyLesson(s,t){const lesson=newest.api.bodyLesson(s,t);return s.id===first.id&&t==='ct'?{...lesson,body:'unrecorded'}:lesson;}}}),/Unrecorded thoracic branch imaging change/);
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const budgets={},unique=new Map();
for(const entry of Object.values(groups).flatMap(g=>Object.values(g.focus)))unique.set(JSON.stringify(entry),entry);
for(const f of Object.values(groups).flatMap(g=>Object.values(g.focus)))for(const key of f.references){assert(references[key]?.startsWith('https://'));budgets[key]=(budgets[key]||0)+((f.body+' '+f.pitfall).match(/\S+/g)?.length||0);}
for(const [key,count]of Object.entries(budgets))assert(count<=200,key+' reference word count '+count);
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,groups:26,sourceSelections:26,addedDraftPlacements:changed,modalities:{ct:26,mri:13,ultrasound:11},unchangedTopics:unchanged,pendingTopics:pending,bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
await writeFile('docs/thoracic-branch-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
