import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {pelvicVeinTeaching,pelvicVeinTeachingGroups,pelvicVeinTeachingReferences} from '../content/pelvic-vein-teaching.ts';
const hash=x=>createHash('sha256').update(x).digest('hex');
const prior=await readFile('content/pelvic-vein-teaching.before.txt','utf8');
assert.equal(hash(prior.replaceAll('\r\n','\n')),'8ad3004dbb32200c4bc5cee2afd3783286582f1d152b8f4ef056ff0020b72508','Exact pre-teaching resolver');
const contents="export * from './lib/pelvic-veins'; export {bodyLesson} from './app/body-content';";
async function compile(before=false) {
  const bundle=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:before?[{name:'pinned-before',setup(t){t.onLoad({filter:/[\\/]lib[\\/]pelvic-veins\.ts$/,namespace:'workspace-test'},args=>({contents:prior,loader:'ts',resolveDir:args.path.replace(/[\\/][^\\/]+$/,'')}));}}]:[]});
  return import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
}
const [before,current,context]=await Promise.all([compile(true),compile(),contentContext()]);
const catalog=context.api.bodyDisplayCatalog(context.catalog),original=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('public/models/bodyparts3d/pelvic-veins/catalog.json'));
const selected=new Map(pins.structures.map(s=>[s.id,s]));
const counts={function:0,clinical:0,pathology:0,ct:0,mri:0,ultrasound:0};
let unchanged=0,changed=0,rejected=0,rendered=0,pending=0;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
// Execute the actual note callback from BodyExplorer, rather than a duplicate test template.
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of catalog.structures) for(const tab of context.api.contentTabs) {
  const group=Object.keys(pelvicVeinTeachingGroups).find(g=>pelvicVeinTeachingGroups[g].includes(s.fmaId));
  const topic=selected.has(s.id)&&group?pelvicVeinTeaching[group][tab]:null;
  const now=current.bodyLesson(s,tab),old=before.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(now,old,s.id+' '+tab+' preserved');unchanged++;}
  else {assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.equal(now.body,topic.body);counts[tab]++;changed++;}
  if(!selected.has(s.id)){assert.equal(current.pelvicVeinLesson(s,tab),undefined);continue;}
  assert.equal(current.pelvicVeinLesson(s,tab).readiness,now.readiness);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:(structure,value)=>current.bodyLesson(structure,value),selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){}});
  const html=render(jsx);
  assert(html.includes(render(React.createElement('p',null,now.body))));
  for(const url of now.citations||[])assert(html.includes(url));
  if(['ct','mri','xray','ultrasound'].includes(tab))assert(html.includes('No imaging study loaded'));
  if(now.readiness==='pending')pending++;rendered++;
}
assert.deepEqual(counts,{function:7,clinical:10,pathology:10,ct:9,mri:5,ultrasound:5});
assert.equal(changed,46);assert.equal(rendered,90);assert.equal(pending,21);
for(const s of pins.structures) for(const mutate of [x=>x.id+='foreign',x=>x.fmaId='FMA18919',x=>x.laterality='midline',x=>x.sourceName+='foreign',x=>x.anchor[0]+=.01,x=>x.sources[0].sha256='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign']) {
  const bad=structuredClone(s);mutate(bad);
  for(const tab of context.api.contentTabs){assert.equal(current.pelvicVeinLesson(bad,tab),undefined);rejected++;}
}
for(const s of pins.structures){const lesson=current.pelvicVeinLesson(s,'clinical');lesson.citations.push('foreign');lesson.bullets.push('foreign');assert(!current.pelvicVeinLesson(s,'clinical').citations.includes('foreign'));assert(!current.pelvicVeinLesson(s,'clinical').bullets.includes('foreign'));}
for(const id of ['FMA18919','FMA18907'])assert(!catalog.structures.some(s=>s.fmaId===id));
const body=context.api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...body].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const record of body)assert(validate(record));
for(const b of pins.bundles)assert.equal(hash(await readFile('public'+b.url.split('?')[0])),b.sha256);
assert.equal(JSON.stringify(catalog),original);
for(const group of Object.values(pelvicVeinTeaching))for(const topic of Object.values(group)){assert(topic.body&&topic.references.length);for(const key of topic.references)assert(pelvicVeinTeachingReferences[key]?.startsWith('https://'));}
const report={sourceSelections:10,groups:6,addedDraftPlacements:changed,uniqueTopicTexts:new Set(Object.values(pelvicVeinTeaching).flatMap(group=>Object.values(group).map(t=>t.body))).size,counts,unchangedTopicComparisons:unchanged,renderedNotes:rendered,pendingTopics:pending,rejectedSourceTopicCombinations:rejected,bodySchemaRecords:body.length,sourceGeometryPreserved:true,oldAuthoredTopicsPreserved:true,baselineSource:'720e44a10b96b10aaa600451dd5a491a79c26c31',baselineSha256:hash(prior.replaceAll('\r\n','\n')),clinicalOrDeviceAcceptance:false,imagingConnected:false};
await writeFile('docs/pelvic-vein-teaching-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
