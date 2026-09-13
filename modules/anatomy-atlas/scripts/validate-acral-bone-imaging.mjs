import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeAcralBoneImaging,acralBoneImagingHash as hash} from './acral-bone-imaging-history.mjs';
import pins from '../content/acral-bone-imaging-pins.json' with {type:'json'};
const context=await contentContext(),{api}=context,catalog=api.bodyDisplayCatalog(context.catalog);
const {acralBoneImagingGroups:groups,acralBoneImagingModes:modes,acralBoneImagingReferences:references}=api;
const original=JSON.stringify(catalog),before=authoringBeforeAcralBoneImaging(context);
assert.equal(hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,before.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles}),pins.previousAllLessonsAndRecipesHash,'All preceding teaching and recipes preserved');
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
  const topic=api.acralBoneImagingLesson(s,tab),now=api.bodyLesson(s,tab);
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
  const copy=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.acralBoneImagingLesson(s,tab),copy);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
assert.equal(Object.keys(groups).length,38);
for(const group of Object.values(groups)){
  assert.equal(group.fmaIds.length,2);
  assert([1,2,3,4,5].includes(group.digit));
  assert(!(group.digit===1&&group.segment==='middle'));
  for(const [i,id] of group.fmaIds.entries()){
    const s=pins.entries.find(e=>e.identity.fmaId===id)?.identity;
    assert(s);assert.equal(s.region,group.region);assert.equal(s.laterality,i===0?'right':'left');
  }
}
assert.equal(pins.entries.filter(e=>e.identity.region==='hand').length,38);
assert.equal(pins.entries.filter(e=>e.identity.region==='foot').length,38);
assert.equal(changed,152);assert.equal(unchanged,9757);assert.equal(rendered,152);
const unresolved=catalog.structures.filter(s=>s.system==='skeleton'&&s.category==='bone'&&['hand','foot'].includes(s.region)&&Object.keys(modes).some(t=>api.bodyLesson(s,t).readiness==='pending'));
assert.deepEqual(unresolved.map(s=>s.fmaId).sort(),['FMA45097','FMA45098']);
for(const {identity:s} of pins.entries)assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');
for(const {identity:s} of pins.entries)for(const mutate of [
  x=>x.system='muscular',x=>x.category='organ',x=>x.laterality=x.laterality==='left'?'right':'left',x=>x.id=pins.entries.find(e=>e.identity.id!==s.id).identity.id,
  x=>x.id+='foreign',x=>x.name+='foreign',x=>x.fmaId='FMA000',x=>x.laterality='foreign',x=>x.region='forearm',x=>x.regions.push('forearm'),x=>x.sourceName+='foreign',x=>x.sourceTree='foreign',x=>x.sources[0].sha256='changed',x=>x.sources[0].file='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign',x=>x.anchor[0]+=.01,x=>x.bounds.min[0]+=.01,x=>x.validation={status:'unvalidated',anatomicalReview:true},
]) {const bad=structuredClone(s);mutate(bad);for(const tab of Object.keys(modes)){assert.equal(api.acralBoneImagingLesson(bad,tab),undefined);assert.equal(api.bodyLesson(bad,tab).readiness,'pending');rejected++;}}
assert.equal(rejected,2888);
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeAcralBoneImaging({...context,api:{...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===first.id&&t==='ct'?{...lesson,body:'unrecorded'}:lesson;}}}),/Unrecorded acral-bone imaging change/);
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const budgets={},unique=new Map();
for(const entry of [...Object.values(modes),...Object.values(groups).flatMap(g=>Object.values(g.focus))])unique.set(JSON.stringify(entry),entry);
for(const f of unique.values())for(const key of f.references){assert(references[key]?.startsWith('https://'));budgets[key]=(budgets[key]||0)+(f.text.match(/\S+/g)?.length||0);}
for(const [key,count]of Object.entries(budgets))assert(count<=200,key+' reference word count '+count);
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,groups:Object.keys(groups).length,sourceSelections:pins.entries.length,addedDraftPlacements:changed,modalities:{ct:76,mri:76},unchangedTopics:unchanged,unresolvedIdentities:unresolved.map(s=>s.fmaId),bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
await writeFile('docs/acral-bone-imaging-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
