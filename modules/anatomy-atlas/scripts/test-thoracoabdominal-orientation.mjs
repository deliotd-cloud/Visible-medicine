import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {dirname,relative} from 'node:path';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';
import pins from '../content/thoracoabdominal-orientation-pins.json' with {type:'json'};

const root=process.cwd(),baseline='f0ee3f2457aad7de214079cb50cbac4d28912688';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const same=(a,b,message)=>assert.deepEqual(structuredClone(a),structuredClone(b),message);
const old=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6});
// Freeze this milestone's review closures as well as its lesson dispatcher.
// New teaching is independently retained against this epoch by its own test.
const savedMilestone='871c57b7729476bb08cbf04d58732b90fc4b52c5';
async function load(previous=false){
 const compiled=await build({stdin:{contents:`export * from './app/body-content'; export * from './lib/content-types';
 export * from './lib/thoracoabdominal-orientation'; export * from './content/thoracoabdominal-orientation';
 export {bodyDisplayCatalog} from './lib/body-display-catalog'; export * from './lib/body-review-material';
 export * from './lib/body-review-context'; export * from './lib/body-review-response'; export * from './lib/body-review-api';
 export * from './lib/body-review-decisions'; export {SourceDisplayNotes} from './app/source-display-notes';`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',
 plugins:[{name:'exact-thoracoabdominal-orientation-epoch',setup(api){api.onLoad({filter:/body-content\.ts$/},args=>{
  if(relative(root,args.path).replaceAll('\\','/')!=='app/body-content.ts')return;
  const contents=previous?old('app/body-content.ts'):execFileSync('git',['show',savedMilestone+':app/body-content.ts'],{encoding:'utf8',maxBuffer:32e6});
  return{contents,loader:'ts',resolveDir:dirname(args.path)};
 });}}]});
 const module={exports:{}},require=createRequire(root+'/package.json');
 runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,structuredClone,URL,URLSearchParams,Request,Response,Headers});return module.exports;
}
const previous=await load(true),current=await load();
const catalog=current.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(pins.parentCommit,baseline);assert.equal(pins.previousCatalogHash,hash(catalog));assert.equal(pins.license,catalog.license);same(pins.coordinateSystem,catalog.coordinateSystem);assert.equal(pins.sourceVersion,catalog.sourceVersion);
assert.equal(pins.entries.length,8);assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,8);
same(pins.entries.map(e=>e.identity.fmaId).sort(),['FMA3988','FMA4083','FMA10692','FMA4077','FMA4772','FMA4786','FMA11336','FMA16549'].sort());
const beforeTopics=catalog.structures.map(s=>({id:s.id,topics:current.contentTabs.map(tab=>({tab,...previous.bodyLesson(s,tab)}))}));
assert.equal(hash(beforeTopics),pins.previousAllTopicsHash,'Original 9936-topic baseline');
for(const entry of pins.entries){const matches=catalog.structures.filter(s=>s.id===entry.identity.id);assert.equal(matches.length,1);same(matches[0],entry.identity);same(current.bodyLesson(matches[0],'anatomy'),entry.anatomy);same(entry.topics,entry.group==='mesoappendix'?['ct','mri']:['mri']);}
for(const b of pins.bundles){const matches=catalog.bundles.filter(x=>x.id===b.id);assert.equal(matches.length,1);same(matches[0],b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','LICENSES/THIRD_PARTY_NOTICES.md','package-lock.json'])assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),old(path).replaceAll('\r\n','\n'),path+' unchanged');
const require=createRequire(root+'/package.json'),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let callback;
function visit(node){if(ts.isArrowFunction(node)&&ts.isBlock(node.body)&&node.body.statements.some(statement=>ts.isVariableStatement(statement)&&statement.declarationList.declarations.some(d=>d.name.getText(ast)==='content'&&d.initializer?.getText(ast)==='bodyContent(selected, value)'))){assert(!callback);callback=node.getText(ast);}ts.forEachChild(node,visit);}visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));let changed=0,preserved=0,rendered=0,refusals=0,reviewChanges=0,stale=0;
for(const s of catalog.structures){
 const entry=targets.get(s.id);
 for(const tab of current.contentTabs){
  const before=previous.bodyLesson(s,tab),after=current.bodyLesson(s,tab),explicit=current.thoracoabdominalOrientationLesson(s,tab);
  if(!entry||!entry.topics.includes(tab)){assert.equal(explicit,undefined);same(after,before,s.id+'|'+tab);preserved++;continue;}
  same(before,entry.previous[tab]);assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');same(after,explicit);changed++;
  assert(after.title.startsWith(s.name+' ·'));assert(after.note.includes('review pending'));assert(after.note.includes('No patient images'));
  assert(after.bullets.some(b=>b.includes('separation to zero')));assert.equal(new Set(after.citations).size,after.citations.length);assert(after.citations.length>0);assert(after.citations.every(url=>new URL(url).protocol==='https:'));
  const tree=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:current.bodyContent,selected:s,SourceDisplayNotes:current.SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(tree);assert(html.includes(render(React.createElement('p',null,after.body))));for(const bullet of after.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of after.citations)assert(html.includes(url.replaceAll('&','&amp;')));assert(html.includes('No imaging study loaded'));assert(html.includes(render(React.createElement(current.SourceDisplayNotes,{note:after.note}))));rendered++;
  const detached=structuredClone(after);after.bullets.push('foreign');after.citations.push('foreign');same(current.bodyLesson(s,tab),detached,'Defensive lesson copy');
 }
 const priorReview=await previous.bodyReviewMaterial(s.id),nextReview=await current.bodyReviewMaterial(s.id);
 same(nextReview.source,priorReview.source);same(nextReview.reasoning,priorReview.reasoning);same(nextReview.guidedTours,priorReview.guidedTours);assert.equal(nextReview.status,'worksheet-not-submitted');assert.equal(nextReview.approval,false);assert.equal(nextReview.fingerprints.source,priorReview.fingerprints.source);
 if(!entry){assert.equal(nextReview.fingerprints.teaching,priorReview.fingerprints.teaching);continue;}
 reviewChanges++;assert.notEqual(nextReview.fingerprints.teaching,priorReview.fingerprints.teaching);assert(await current.parseBodyReviewResponse(nextReview,s.id));
 const foreign=structuredClone(nextReview);foreign.topics.find(t=>entry.topics.includes(t.tab)).body='Foreign';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
 const context=await current.bodyReviewContext(s.id),priorContext=await previous.bodyReviewContext(s.id);assert.equal(context.revisions.imaging,null);assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const delta of [{materialHash:priorReview.materialHash},{revisionHash:priorContext.revisions.teaching}]){
  const response=await current.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_THORACOABDOMINAL_REVIEW'},body:JSON.stringify({catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:current.blankBodyReview(context,'teaching'),...delta})}),storage);assert.equal(response.status,409);stale++;
 }
}
for(const e of pins.entries)for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:'foreign'},{regions:[]},{region:'foreign'},{system:'foreign'},{category:'foreign'},{sourceTree:'foreign'},{sourceName:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:{min:[0,0,0],max:[1,1,1]}},{anchor:[0,0,0]},{sources:[]},{sources:e.identity.sources.map(f=>({...f,sha256:'0'.repeat(64)}))},{validation:{status:'foreign'}}])for(const tab of e.topics){assert.equal(current.thoracoabdominalOrientationLesson({...e.identity,...patch},tab),undefined);refusals++;}
assert.equal(changed,9);assert.equal(preserved,9927);assert.equal(rendered,9);assert.equal(reviewChanges,8);assert.equal(stale,16);assert.equal(refusals,153);
const report={baseline,newDraftPlacements:changed,preservedTopicPlacements:preserved,changedTeachingWorksheets:reviewChanges,unchangedTeachingWorksheets:catalog.structures.length-reviewChanges,actualViewerRenderings:rendered,stalePostRefusalsBeforeStorage:stale,sourceMutationRefusals:refusals,sourceBundlesVerified:pins.bundles.length,modelsAndLicensesUnchanged:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/thoracoabdominal-orientation-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
