import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeCoreOrganFunction,coreOrganFunctionHash as hash} from './core-organ-function-history.mjs';
import {authoringBeforeMajorOrganFunction} from './major-organ-function-history.mjs';
import {authoringBeforeClinicalReferenceRevision} from './clinical-reference-revision-history.mjs';
import pins from '../content/core-organ-function-pins.json' with {type:'json'};
import after from '../content/core-organ-function.transition.json' with {type:'json'};

const context=await contentContext(),{api}=context,catalog=api.bodyDisplayCatalog(context.catalog),original=JSON.stringify(catalog);
const featureBuilt=await build({stdin:{contents:"export * from './lib/core-organ-function'; export * from './content/core-organ-function';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const feature=await import('data:text/javascript;base64,'+Buffer.from(featureBuilt.outputFiles[0].text).toString('base64'));
const coreEra=authoringBeforeMajorOrganFunction(context),before=authoringBeforeCoreOrganFunction({...context,api:coreEra}),older=authoringBeforeClinicalReferenceRevision(context);
assert.equal(authoringBeforeCoreOrganFunction({...context,api:before}),before,'All-before state must be idempotent');
const snapshot=a=>({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(a.contentTabs.map(t=>[t,a.bodyLesson(s,t)]))})),shoulder:a.structures,recipes:a.dissectionProfiles});
assert.equal(hash(snapshot(before)),pins.previousAllLessonsAndRecipesHash,'Strict immutable before hash');
assert.equal(hash(snapshot(coreEra)),after.currentAllLessonsAndRecipesHash,'Strict immutable after hash');
for(const entry of pins.entries)assert.deepEqual(older.bodyLesson(entry.identity,'function'),entry.previous.function,'Older history must see the normalized pre-feature lesson');
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(record=>[record.representationScope+'|'+record.id,record]));
const validate=await contentValidator(registry);for(const record of records)assert(validate(record));
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(node){if(ts.isArrowFunction(node)&&node.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=node.getText(ast);}ts.forEachChild(node,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let changed=0,unchanged=0,rejected=0,rendered=0;
const placements=new Map(pins.entries.map(entry=>[entry.identity.id+'|function',entry]));
for(const s of catalog.structures)for(const tab of api.contentTabs){
  const entry=placements.get(s.id+'|'+tab),now=coreEra.bodyLesson(s,tab),old=before.bodyLesson(s,tab);
  if(!entry){assert.deepEqual(now,old);unchanged++;continue;}
  changed++;assert.equal(old.readiness,'draft');assert.deepEqual(old,entry.previous.function);assert.equal(now.readiness,'draft');assert.deepEqual(now,feature.coreOrganFunctionLesson(s,tab));
  assert.equal(now.bullets.length,4);assert.equal(new Set(now.citations).size,now.citations.length);
  const record=records.find(candidate=>candidate.id===s.id);assert.deepEqual(record.content[tab],now);assert.equal(record.validation.clinicalApproval,'not-included');
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,now.body))));for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  assert(html.includes('revision-bound radiologist review'));assert(html.includes('do not simulate physiology'));assert(html.includes('paid-lecture access remain independent'));
  const detached=structuredClone(now);now.bullets.push('changed');now.citations.push('foreign');assert.deepEqual(api.bodyLesson(s,tab),detached);
  const prior=old;prior.body='changed';assert.deepEqual(before.bodyLesson(s,tab),entry.previous.function);
  rendered++;
}
assert.equal(changed,4);assert.equal(rendered,4);
function leafMutations(value,path=[]){if(value===null||typeof value!=='object')return[path];return Object.entries(value).flatMap(([key,child])=>leafMutations(child,[...path,key]));}
function mutateLeaf(value,path){const copy=structuredClone(value);let parent=copy;for(const key of path.slice(0,-1))parent=parent[key];const key=path.at(-1),old=parent[key];parent[key]=typeof old==='string'?old+'-foreign':typeof old==='number'?old+.0001:typeof old==='boolean'?!old:'foreign';return copy;}
for(const {identity:s} of pins.entries)for(const path of leafMutations(s)){const bad=mutateLeaf(s,path);assert.equal(feature.coreOrganFunctionLesson(bad,'function'),undefined,`accepted changed identity field ${path.join('.')}`);rejected++;}
for(const {identity:s} of pins.entries){
  const missing=structuredClone(s);missing.sources.pop();assert.equal(feature.coreOrganFunctionLesson(missing,'function'),undefined);rejected++;
  const duplicate=structuredClone(s);duplicate.sources.push(structuredClone(duplicate.sources[0]));assert.equal(feature.coreOrganFunctionLesson(duplicate,'function'),undefined);rejected++;
}
for(const {identity:s} of pins.entries)for(const tab of [...api.contentTabs.filter(t=>t!=='function'),'foreign']){assert.equal(feature.coreOrganFunctionLesson(s,tab),undefined);rejected++;}
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeCoreOrganFunction({...context,api:{...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===first.id&&t==='function'?{...lesson,body:'unrecorded'}:lesson;}}}),/Unrecorded core-organ Function change|Current full teaching\/recipe snapshot changed/);
assert.throws(()=>authoringBeforeCoreOrganFunction({...context,api:{...api,bodyLesson(s,t){return s.id===first.id&&t==='function'?structuredClone(pins.entries[0].previous.function):api.bodyLesson(s,t);}}}),/Mixed core-organ Function history state/);
const unrelated=catalog.structures.find(s=>!pins.entries.some(entry=>entry.identity.id===s.id));assert(unrelated);
assert.throws(()=>authoringBeforeCoreOrganFunction({...context,api:{...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===unrelated.id&&t==='anatomy'?{...lesson,body:'unrecorded unrelated edit'}:lesson;}}}),/Current full teaching\/recipe snapshot changed/);
const changedCatalog=structuredClone(catalog),changedRoot=changedCatalog.structures.find(s=>s.id===first.id);changedRoot.sources.pop();
assert.throws(()=>authoringBeforeCoreOrganFunction({...context,catalog:changedCatalog}),/source identity changed|Expected values to be strictly deep-equal|different/);
for(const bundle of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+bundle.url.split('?')[0])).digest('hex'),bundle.sha256);
for(const url of Object.values(feature.coreOrganFunctionReferences))assert.equal(new URL(url).protocol,'https:');
assert.equal(JSON.stringify(catalog),original);
const concepts=Object.fromEntries(pins.entries.reduce((map,entry)=>map.set(entry.concept,(map.get(entry.concept)??0)+1),new Map()));
const report={baselineSource:pins.sourceCommit,sourceSelections:4,addedDraftPlacements:changed,topics:concepts,unchangedTopics:unchanged,bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedChangedIdentityAndTopicCases:rejected,strictBeforeHash:pins.previousAllLessonsAndRecipesHash,strictAfterHash:after.currentAllLessonsAndRecipesHash,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesOrAnimationsImported:false,browserOrDeviceAcceptance:false};
await writeFile('docs/core-organ-function-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
