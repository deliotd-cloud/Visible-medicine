import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeCraniofacialOrganImaging,craniofacialOrganImagingHash as hash} from './craniofacial-organ-imaging-history.mjs';
import pins from '../content/craniofacial-organ-imaging-pins.json' with {type:'json'};
const context=await contentContext(),{api}=context,catalog=api.bodyDisplayCatalog(context.catalog);
const {craniofacialOrganImagingGroups:groups,craniofacialOrganImagingReferences:references}=api;
const original=JSON.stringify(catalog),before=authoringBeforeCraniofacialOrganImaging(context);
assert.equal(hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,before.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles}),pins.previousAllLessonsAndRecipesHash,'All preceding teaching and recipes preserved');
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const r of records)assert(validate(r));
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let changed=0,unchanged=0,rejected=0,rendered=0;
for(const s of catalog.structures)for(const tab of api.contentTabs){
  const topic=api.craniofacialOrganImagingLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(now,before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],topic);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,now.body))));
  for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));assert(html.includes('paid-lecture access remain independent'));
  for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  const copy=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.craniofacialOrganImagingLesson(s,tab),copy);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
assert.equal(Object.keys(groups).length,5);assert.equal(changed,36);assert.equal(unchanged,9882);assert.equal(rendered,36);
assert.deepEqual(pins.entries.map(e=>e.identity.laterality).sort(),['left','left','left','left','right','right','right','right','unpaired']);
for(const s of context.catalog.structures.filter(s=>s.fmaId==='FMA12514'))for(const tab of ['ct','mri','xray','ultrasound']){
  assert.equal(api.craniofacialOrganImagingLesson(s,tab),undefined);
  assert.deepEqual(before.bodyLesson(s,tab),api.bodyLesson(s,tab));
  assert.equal(api.bodyLesson(s,tab).readiness,'pending');
}
assert.match(groups.pituitary.focus.ultrasound.body,/not a method/);
assert.match(groups.pituitary.focus.xray.body,/not delineate the gland/);
assert.match(groups.globe.focus.ultrasound.pitfall,/open-globe/);
assert.match(groups.lacrimal.focus.ct.pitfall,/lacrimal sac/);
assert.match(groups.submandibular.focus.ct.body,/posterior mylohyoid/);
assert.match(groups.sublingual.focus.xray.pitfall,/submandibular duct/);
for(const {identity:s,topics} of pins.entries)for(const mutate of [
  x=>x.system='muscular',x=>x.category='bone',x=>x.laterality=x.laterality==='left'?'right':'left',x=>x.id=pins.entries.find(e=>e.identity.id!==s.id).identity.id,
  x=>x.id+='foreign',x=>x.name+='foreign',x=>x.fmaId='FMA000',x=>x.laterality='foreign',x=>x.region='foot',x=>x.regions.push('foot'),x=>x.sourceName+='foreign',x=>x.sourceTree='foreign',x=>x.sources[0].sha256='changed',x=>x.sources[0].file='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign',x=>x.anchor[0]+=.01,x=>x.bounds.min[0]+=.01,x=>x.validation={status:'unvalidated',anatomicalReview:true},
]){const bad=structuredClone(s);mutate(bad);for(const tab of topics){assert.equal(api.craniofacialOrganImagingLesson(bad,tab),undefined);assert.equal(api.bodyLesson(bad,tab).readiness,'pending');rejected++;}}
assert.equal(rejected,684);
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeCraniofacialOrganImaging({...context,api:{...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===first.id&&t==='ct'?{...lesson,body:'unrecorded'}:lesson;}}}),/Unrecorded craniofacial organ imaging change/);
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const budgets={},unique=new Map();
for(const entry of Object.values(groups).flatMap(g=>Object.values(g.focus)))unique.set(JSON.stringify(entry),entry);
for(const f of unique.values())for(const key of f.references){assert(references[key]?.startsWith('https://'));budgets[key]=(budgets[key]||0)+((f.body+' '+f.pitfall).match(/\S+/g)?.length||0);}
for(const [key,count]of Object.entries(budgets))assert(count<=200,key+' reference word count '+count);
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,groups:5,sourceSelections:9,addedDraftPlacements:changed,modalities:{ct:9,mri:9,ultrasound:9,xray:9},unchangedTopics:unchanged,bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
await writeFile('docs/craniofacial-organ-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
