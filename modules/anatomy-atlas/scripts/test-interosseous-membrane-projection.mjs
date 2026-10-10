import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import pins from '../content/interosseous-membrane-projection-pins.json' with {type:'json'};
import {build} from './workspace-component-test-build.mjs';
import {beforeInterosseousMembraneProjection} from './interosseous-membrane-projection-history.mjs';
const root=process.cwd(),baseline='6c156e8b4cead4a24cc19ea2cc5a53e77ba8e06e';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const old=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const same=(a,b,m)=>assert.deepEqual(structuredClone(a),structuredClone(b),m);
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './app/body-content';export * from './lib/content-types';
 export * from './lib/interosseous-membrane-projection';export * from './lib/body-review-material';
 export * from './lib/body-review-response';export * from './lib/body-review-context';
 export * from './lib/body-review-api';export * from './lib/body-review-decisions';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';
 export {SourceDisplayNotes} from './app/source-display-notes';`,resolveDir:root,loader:'tsx'},
 bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic',
 plugins:[{name:'exact-membrane-editorial-epoch',setup(api){api.onLoad({filter:/body-content\.ts$/},args=>{
  if(relative(root,args.path).replaceAll('\\','/')!=='app/body-content.ts')return;
  return{contents:previous?old('app/body-content.ts'):execFileSync('git',['show','24e82d38d226eac294ffa5f3a922448f4904cec0:app/body-content.ts'],{encoding:'utf8',maxBuffer:32e6}),loader:'ts',resolveDir:dirname(args.path)};
 });}}]});
 const module={exports:{}},require=createRequire(root+'/package.json');
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,structuredClone,URL,URLSearchParams,Request,Response,Headers});
 return module.exports;
}
const previous=await load(true),current=await load(),catalog=current.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(pins.parentCommit,baseline);assert.equal(hash(catalog),pins.previousCatalogHash);
const expectations=new Map([['FMA23707',['forearm','right']],['FMA23708',['forearm','left']],['FMA35192',['leg','right']],['FMA35193',['leg','left']]]);
same(pins.entries.map(e=>e.identity.fmaId).sort(),[...expectations.keys()].sort());
for(const e of pins.entries){const [group,side]=expectations.get(e.identity.fmaId);assert.equal(e.group,group);assert.equal(e.identity.laterality,side);assert(e.identity.regions.includes(group));same(e.topics,['ct','xray']);same(catalog.structures.find(s=>s.id===e.identity.id),e.identity);}
same(catalog.coordinateSystem,pins.coordinateSystem);assert.equal(catalog.sourceVersion,pins.sourceVersion);
for(const b of pins.bundles){same(catalog.bundles.find(item=>item.id===b.id),b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
for(const p of ['public/models/bodyparts3d/full-body/catalog.json','LICENSES/THIRD_PARTY_NOTICES.md','package-lock.json','lib/reasoning-questions.ts','lib/atlas-practice.ts'])assert.equal(await readFile(p,'utf8'),old(p),p+' unchanged');
const allPrevious=catalog.structures.map(s=>({id:s.id,topics:current.contentTabs.map(tab=>({tab,...previous.bodyLesson(s,tab)}))}));
assert.equal(hash(allPrevious),pins.previousAllTopicsHash,'All9936 prior topics reconstructed exactly');
const target=new Map(pins.entries.map(e=>[e.identity.id,e]));let changed=0,unchanged=0,packetChanges=0,sourceMutations=0,rendered=0,stale=0;
const require=createRequire(root+'/package.json'),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const viewerSource=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',viewerSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let callback;
function visit(node){if(ts.isArrowFunction(node)&&ts.isBlock(node.body)&&node.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert.equal(callback,undefined);callback=node.getText(ast);}ts.forEachChild(node,visit);}visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
// Exercise changed packets first so harness/setup failures do not wait for the
// complete preservation sweep. The entire catalogue is still checked below.
for(const s of [...catalog.structures].sort((a,b)=>Number(target.has(b.id))-Number(target.has(a.id)))){
 const entry=target.get(s.id);
 for(const tab of current.contentTabs){
  const before=previous.bodyLesson(s,tab),after=current.bodyLesson(s,tab),explicit=current.interosseousMembraneProjectionLesson(s,tab);
  if(!entry||!entry.topics.includes(tab)){assert.equal(explicit,undefined);same(after,before,s.id+'|'+tab);unchanged++;continue;}
  changed++;same(before,entry.previous[tab]);assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');same(after,explicit);
  assert(after.title.startsWith(s.name+' ·'));assert(after.bullets.some(b=>/whole.*membrane|membrane injury/.test(b)));
  assert(after.note.includes('No patient images'));assert(after.note.includes('Independent anatomy/radiology review pending'));
  assert.equal(new Set(after.citations).size,after.citations.length);assert(after.citations.every(url=>new URL(url).protocol==='https:'));
  if(entry.group==='forearm')assert.match(after.body,/radius and ulna/);else assert.match(after.body,/tibia and fibula/);
  const tree=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:current.bodyContent,selected:s,SourceDisplayNotes:current.SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(tree);assert(html.includes(render(React.createElement('p',null,after.body))));
  for(const bullet of after.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of after.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  assert(html.includes('No imaging study loaded'));rendered++;
  const detached=structuredClone(after);after.bullets.push('foreign');after.citations.push('foreign');same(current.bodyLesson(s,tab),detached);
 }
 const a=await previous.bodyReviewMaterial(s.id),b=await current.bodyReviewMaterial(s.id);
 same(b.source,a.source);same(b.reasoning,a.reasoning);same(b.guidedTours,a.guidedTours);assert.equal(b.fingerprints.source,a.fingerprints.source);
 assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
 if(!entry){same(b.fingerprints.teaching,a.fingerprints.teaching);continue;}
 packetChanges++;assert.notEqual(b.fingerprints.teaching,a.fingerprints.teaching);assert(await current.parseBodyReviewResponse(b,s.id));
 const foreign=structuredClone(b);foreign.topics.find(t=>t.tab==='ct').body='Foreign wording';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
 const c=await current.bodyReviewContext(s.id),prior=await previous.bodyReviewContext(s.id);assert.equal(c.revisions.imaging,null);assert.notEqual(c.revisions.teaching,prior.revisions.teaching);
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const delta of [{materialHash:a.materialHash},{revisionHash:prior.revisions.teaching}]){
  const response=await current.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_MEMBRANE_REVIEW'},body:JSON.stringify({catalogScope:c.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:current.blankBodyReview(c,'teaching'),...delta})}),storage);
  assert.equal(response.status,409);stale++;
 }
 for(const patch of [{id:'foreign'},{name:'Foreign name'},{fmaId:'FMA0'},{laterality:s.laterality==='left'?'right':'left'},{regions:['head-neck']},{region:'head-neck'},{sourceTree:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:[0,0,0,1,1,1]},{sources:[]},{sources:[...s.sources,...s.sources]},{sources:s.sources.map(f=>({...f,sha256:'0'.repeat(64)}))}]){
  const altered={...s,...patch};if(JSON.stringify(altered)===JSON.stringify(s))continue;
  for(const tab of entry.topics)assert.equal(current.interosseousMembraneProjectionLesson(altered,tab),undefined);sourceMutations++;
 }
}
assert.equal(changed,8);assert.equal(unchanged,9928);assert.equal(packetChanges,4);assert.equal(rendered,8);assert.equal(stale,8);
const replay=beforeInterosseousMembraneProjection(current);
assert.equal(beforeInterosseousMembraneProjection(replay),replay,'Offline replay is idempotent');
const restored=catalog.structures.map(s=>({id:s.id,topics:current.contentTabs.map(tab=>({tab,...replay.bodyLesson(s,tab)}))}));
assert.equal(hash(restored),pins.previousAllTopicsHash,'Exact9936-topic historical baseline, not a replacement golden');
let historyRefusals=0;
for(const e of pins.entries){
 assert.throws(()=>replay.bodyLesson({...e.identity,name:'Foreign'},'ct'));historyRefusals++;
 assert.throws(()=>beforeInterosseousMembraneProjection({...current,bodyLesson(s,tab){const lesson=current.bodyLesson(s,tab);return s.id===e.identity.id&&tab==='ct'?{...lesson,body:'Foreign'}:lesson;}}));historyRefusals++;
 assert.throws(()=>beforeInterosseousMembraneProjection({...current,bodyLesson(s,tab){return s.id===e.identity.id&&tab==='ct'?e.previous.ct:current.bodyLesson(s,tab);}}));historyRefusals++;
}
const report={baseline,newDraftPlacements:changed,preservedTopicPlacements:unchanged,changedTeachingWorksheets:packetChanges,unchangedTeachingWorksheets:1100,actualViewerRenderings:rendered,sourceMutationRefusals:sourceMutations,stalePostRefusalsBeforeStorage:stale,historyRefusals,modelsAndLicensesUnchanged:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/interosseous-membrane-projection-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
