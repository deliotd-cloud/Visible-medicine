import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeDeferentClinical,deferentClinicalHash as hash} from './deferent-clinical-history.mjs';
import pins from '../content/deferent-clinical-pins.json' with {type:'json'};
import after from '../content/deferent-clinical.transition.json' with {type:'json'};
import {exactDeferentClinicalHistory,deferentWholeBodySnapshot} from './exact-deferent-clinical-history.mjs';

const context=await contentContext(),{api}=context,catalog=api.bodyDisplayCatalog(context.catalog),original=JSON.stringify(catalog),historicalAfter=api,before=authoringBeforeDeferentClinical(context,{sourceAtTransition:true});
const exact=await exactDeferentClinicalHistory(context.catalog);
assert.equal(hash(deferentWholeBodySnapshot(exact.before,context.catalog)),pins.previousAllLessonsAndRecipesHash,'Strict immutable before hash');
assert.equal(hash(deferentWholeBodySnapshot(exact.after,context.catalog)),after.currentAllLessonsAndRecipesHash,'Strict immutable after hash');
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(record=>[record.representationScope+'|'+record.id,record]));
const validate=await contentValidator(registry);for(const record of records)assert(validate(record));
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(node){if(ts.isArrowFunction(node)&&node.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=node.getText(ast);}ts.forEachChild(node,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let changed=0,unchanged=0,rejected=0,rendered=0;
for(const s of catalog.structures)for(const tab of api.contentTabs){
  const topic=api.deferentClinicalLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(historicalAfter.bodyLesson(s,tab),before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const record=records.find(candidate=>candidate.id===s.id);assert.deepEqual(record.content[tab],topic);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,now.body))));
  for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('revision-bound radiologist review'));assert(html.includes('cannot establish patency'));assert(html.includes('paid-lecture access remain independent'));
  for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  const detached=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.deferentClinicalLesson(s,tab),detached);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
assert.equal(changed,4);assert.equal(unchanged,catalog.structures.length*api.contentTabs.length-changed);assert.equal(rendered,4);
assert.deepEqual(pins.entries.map(entry=>[entry.identity.fmaId,entry.identity.sources[0].file,entry.side]).sort(),[['FMA19235','FJ3140','right'],['FMA19236','FJ3135','left']]);
function leafMutations(value,path=[]){
  if(value===null||typeof value!=='object')return[path];
  return Object.entries(value).flatMap(([key,child])=>leafMutations(child,[...path,key]));
}
function mutateLeaf(value,path){
  const copy=structuredClone(value);let parent=copy;
  for(const key of path.slice(0,-1))parent=parent[key];
  const key=path.at(-1),old=parent[key];parent[key]=typeof old==='string'?old+'-foreign':typeof old==='number'?old+.0001:typeof old==='boolean'?!old:'foreign';
  return copy;
}
for(const {identity:s,topics} of pins.entries)for(const path of leafMutations(s)){
  const bad=mutateLeaf(s,path);
  for(const tab of topics){assert.equal(api.deferentClinicalLesson(bad,tab),undefined,`accepted changed identity field ${path.join('.')}`);assert.equal(api.bodyLesson(bad,tab).readiness,'pending');rejected++;}
}
for(const {identity:s} of pins.entries)for(const tab of ['anatomy','function','ct','mri','ultrasound','xray','quiz','foreign']){assert.equal(api.deferentClinicalLesson(s,tab),undefined);rejected++;}
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeDeferentClinical({...context,api:{...historicalAfter,bodyLesson(s,t){const lesson=historicalAfter.bodyLesson(s,t);return s.id===first.id&&t==='clinical'?{...lesson,body:'unrecorded'}:lesson;}}},{sourceAtTransition:true}),/Unrecorded deferent clinical change/);
for(const bundle of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+bundle.url.split('?')[0])).digest('hex'),bundle.sha256);
for(const [key,url] of Object.entries(api.deferentClinicalReferences)){assert(['anatomy','clinical','obstruction'].includes(key));assert.equal(new URL(url).protocol,'https:');}
for(const [key,topic] of Object.entries(api.deferentClinicalTopics)){assert(['clinical','pathology'].includes(key));assert(topic.references.length);for(const reference of topic.references)assert(api.deferentClinicalReferences[reference]);}
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,sourceSelections:2,addedDraftPlacements:changed,topics:{clinical:2,pathology:2},unchangedTopics:unchanged,bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceSideBundleTopicCombinations:rejected,strictBeforeHash:pins.previousAllLessonsAndRecipesHash,strictAfterHash:after.currentAllLessonsAndRecipesHash,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,browserOrDeviceAcceptance:false};
await writeFile('docs/deferent-clinical-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
