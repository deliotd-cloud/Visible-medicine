import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeAbdominalBranchImaging,abdominalBranchImagingHash as hash} from './abdominal-branch-imaging-history.mjs';
import {abdominalBranchImagingHistoricalContext,abdominalBranchImagingEpoch} from './abdominal-branch-imaging-epoch.mjs';
import {build as buildComponent} from './workspace-component-test-build.mjs';
import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
// Freeze the old all-topic checksum, not today's authorised corrections or additions.
// Runtime retention and rendering are checked independently against the current API.
const historical=await abdominalBranchImagingHistoricalContext();
const {api:then,before,display:historicCatalog}=historical;
const context=await contentContext(),{api}=context,catalog=api.bodyDisplayCatalog(context.catalog);
const {abdominalBranchImagingGroups:groups,abdominalBranchImagingReferences:references}=api;
const original=JSON.stringify(catalog);
assert.equal(hash(historical.snapshot(before,historicCatalog)),pins.previousAllLessonsAndRecipesHash,'All preceding teaching and recipes preserved at the recorded epoch');
assert.equal(catalog.sourceVersion,pins.sourceVersion);assert.equal(catalog.license,pins.license);
assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
assert.deepEqual(api.contentTabs,then.contentTabs);
for(const path of ['content/abdominal-branch-imaging.ts','lib/abdominal-branch-imaging.ts']) {
  const recorded=execFileSync('git',['show',abdominalBranchImagingEpoch+':'+path],{maxBuffer:32e6}).toString().replaceAll('\r\n','\n');
  assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),recorded,path+' authored source retained');
}
for(const {identity} of pins.entries){const matches=catalog.structures.filter(s=>s.id===identity.id);assert.equal(matches.length,1);assert.deepEqual(matches[0],identity,'Live pinned source identity retained');}
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const r of records)assert(validate(r));
let changed=0,unchanged=0,rejected=0,rendered=0;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await buildComponent({stdin:{contents:"export { SourceDisplayNotes } from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const componentScope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:componentScope,exports:componentScope.exports,require});
const {SourceDisplayNotes}=componentScope.exports;assert.equal(typeof SourceDisplayNotes,'function');
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){
  // Match the note callback's direct declaration, not an enclosing tab callback
  // whose JSX contains this same arrow function further down its subtree.
  if(ts.isArrowFunction(n)&&ts.isBlock(n.body)&&n.body.statements.some(statement=>
    ts.isVariableStatement(statement)&&statement.declarationList.declarations.some(declaration=>
      declaration.name.getText(ast)==='content'&&declaration.initializer?.getText(ast)==='bodyContent(selected, value)'))){assert(!callback);callback=n.getText(ast);}
  ts.forEachChild(n,visit);
}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of historicCatalog.structures)for(const tab of then.contentTabs) {
  const topic=api.abdominalBranchImagingLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(then.bodyLesson(s,tab),before.bodyLesson(s,tab));unchanged++;continue;}
  assert.deepEqual(topic,then.abdominalBranchImagingLesson(s,tab),'Historic source-bound teaching retained in live API');
  changed++;assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],topic);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,SourceDisplayNotes,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,now.body))));
  if(now.note)assert(html.includes(render(React.createElement(SourceDisplayNotes,{note:now.note}))),'Real source note and disclosure retained');
  for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  const copy=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.abdominalBranchImagingLesson(s,tab),copy);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
assert.equal(Object.keys(groups).length,34);assert.equal(changed,48);assert.equal(unchanged,9861);assert.equal(rendered,48);
for(const [region,count] of [['abdomen',34]])assert.equal(pins.entries.filter(e=>groups[e.group].region===region).length,count);
const unresolvedIds=['FMA14810','FMA14811','FMA14815','FMA14818','FMA14820','FMA14824','FMA14826','FMA14828','FMA14829','FMA15391','FMA15405','FMA15406','FMA15407','FMA14782','FMA14784','FMA14787','FMA14790','FMA14792','FMA14793','FMA14805','FMA15398','FMA70479','FMA70480','FMA76574','FMA15390','FMA15397','FMA15400'];
const pending={mri:[...unresolvedIds],ultrasound:[...unresolvedIds]};
for(const tab of ['mri','ultrasound']){const unresolved=pins.entries.filter(e=>!groups[e.group].focus[tab]).map(e=>e.identity);assert.deepEqual(unresolved.map(s=>s.fmaId).sort(),pending[tab].sort());for(const s of unresolved){assert.equal(api.abdominalBranchImagingLesson(s,tab),undefined);assert.equal(then.bodyLesson(s,tab).readiness,'pending');}}
assert.match(groups['gastroduodenal-trunk'].focus.ct.pitfall,/trunk-only/);
assert.match(groups['pancreaticoduodenal-vein'].focus.ct.pitfall,/three components.*not three validated/);
assert.match(groups['ileocolic-ascending-branch'].focus.ct.pitfall,/relabelling.*caecal/);
for(const side of ['left','right'])assert.match(groups[side+'-hepatic-tributaries'].focus.ct.pitfall,/not separately named veins, segment boundaries/);
assert.match(groups['left-gastric-vein'].focus.mri.pitfall,/research methods are not routine MRI/);
for(const {identity:s,topics} of pins.entries)for(const mutate of [
  x=>x.system='muscular',x=>x.category='bone',x=>x.laterality=x.laterality==='left'?'right':'left',x=>x.id=pins.entries.find(e=>e.identity.id!==s.id).identity.id,
  x=>x.id+='foreign',x=>x.name+='foreign',x=>x.fmaId='FMA000',x=>x.laterality='foreign',x=>x.region='foot',x=>x.regions.push('foot'),x=>x.sourceName+='foreign',x=>x.sourceTree='foreign',x=>x.sources[0].sha256='changed',x=>x.sources[0].file='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign',x=>x.anchor[0]+=.01,x=>x.bounds.min[0]+=.01,x=>x.validation={status:'unvalidated',anatomicalReview:true},
]) {const bad=structuredClone(s);mutate(bad);for(const tab of topics){assert.equal(api.abdominalBranchImagingLesson(bad,tab),undefined);assert.equal(api.bodyLesson(bad,tab).readiness,'pending');rejected++;}}
assert.equal(rejected,912);
for(const [tab,n] of [['ct',34],['mri',7],['ultrasound',7]])assert.equal(pins.entries.filter(e=>e.topics.includes(tab)).length,n);
for(const {identity:s} of pins.entries)for(const t of ['anatomy','function','pathology','clinical','quiz','xray','foreign'])assert.equal(api.abdominalBranchImagingLesson(s,t),undefined);
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeAbdominalBranchImaging({...context,api:{...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===first.id&&t==='ct'?{...lesson,body:'unrecorded'}:lesson;}}}),/Unrecorded abdominal branch imaging change/);
assert.equal(pins.bundles.length,5);
for(const b of pins.bundles){const matches=catalog.bundles.filter(v=>v.id===b.id);assert.equal(matches.length,1);assert.deepEqual(matches[0],b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const budgets={},unique=new Map();
for(const entry of Object.values(groups).flatMap(g=>Object.values(g.focus)))unique.set(JSON.stringify(entry),entry);
for(const f of Object.values(groups).flatMap(g=>Object.values(g.focus)))for(const key of f.references){assert(references[key]?.startsWith('https://'));budgets[key]=(budgets[key]||0)+((f.body+' '+f.pitfall).match(/\S+/g)?.length||0);}
for(const [key,count]of Object.entries(budgets))assert(count<=200,key+' reference word count '+count);
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,historicalEpoch:abdominalBranchImagingEpoch,originalChecksum:pins.previousAllLessonsAndRecipesHash,historicalPreservationScope:'Recorded Git module graph; installed build dependencies are current. Later unrelated teaching and corrections are not rolled back.',groups:34,sourceSelections:34,addedDraftPlacements:changed,currentSourceBoundDraftsRetained:changed,modalities:{ct:34,mri:7,ultrasound:7},unchangedTopics:unchanged,pendingTopics:pending,pendingTopicsScope:'Historical readiness; current branch-specific getter still refuses these placements. Later teaching from other batches is independently validated.',bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
await writeFile('docs/abdominal-branch-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
