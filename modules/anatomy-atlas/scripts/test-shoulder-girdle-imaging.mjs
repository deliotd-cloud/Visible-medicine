import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import pins from '../content/shoulder-girdle-imaging-pins.json' with {type:'json'};
import {build} from './workspace-component-test-build.mjs';
import {beforeShoulderGirdleImaging} from './shoulder-girdle-imaging-history.mjs';

const root=process.cwd(),baseline='732f5f56ff3708b9200b25f18ac3f6f175a438e5';
const milestone='ed3d7a1ebaa11edc5bea4c918e43b6019b93d521';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const old=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const same=(a,b,m)=>assert.deepEqual(structuredClone(a),structuredClone(b),m);
async function load(previous=false,live=false){
 const result=await build({stdin:{contents:`export * from './app/body-content';export * from './lib/content-types';
 export * from './lib/shoulder-girdle-imaging';export * from './lib/body-review-material';
 export * from './lib/body-review-response';export * from './lib/body-review-context';
 export * from './lib/body-review-api';export * from './lib/body-review-decisions';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';
 export {SourceDisplayNotes} from './app/source-display-notes';`,resolveDir:root,loader:'tsx'},
 bundle:true,write:false,platform:'node',format:'cjs',packages:'external',
 plugins:live?[]:[{name:'exact-shoulder-girdle-milestone',setup(api){api.onLoad({filter:/body-content\.ts$/},args=>{
  if(relative(root,args.path).replaceAll('\\','/')!=='app/body-content.ts')return;
  const contents=previous?old('app/body-content.ts'):execFileSync('git',['show',milestone+':app/body-content.ts'],{encoding:'utf8',maxBuffer:32e6});
  return{contents,loader:'ts',resolveDir:dirname(args.path)};
 });}}]});
 const module={exports:{}},require=createRequire(root+'/package.json');
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,structuredClone,URL,URLSearchParams,Request,Response,Headers});
 return module.exports;
}
const previous=await load(true),current=await load(),live=await load(false,true);
for(const path of ['content/shoulder-girdle-imaging.ts','lib/shoulder-girdle-imaging.ts'])assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),execFileSync('git',['show',milestone+':'+path],{encoding:'utf8',maxBuffer:32e6}).replaceAll('\r\n','\n'),'Live authored shoulder-girdle source retained');
const catalog=current.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(pins.parentCommit,baseline);assert.equal(hash(catalog),pins.previousCatalogHash);
same(catalog.coordinateSystem,pins.coordinateSystem);assert.equal(catalog.sourceVersion,pins.sourceVersion);
const expected=new Map([
 ['FMA3992',['FJ2307','right','thyrocervical-trunk']],['FMA4084',['FJ2255','left','thyrocervical-trunk']],
 ['FMA5039',['FJ2276','right','costocervical-trunk']],['FMA4086',['FJ2224','left','costocervical-trunk']],
 ['FMA4057',['FJ2284','right','dorsal-scapular-artery']],['FMA10552',['FJ2232','left','dorsal-scapular-artery']],
 ['FMA50859',['FJ2302','right','suprascapular-vein']],['FMA50860',['FJ2250','left','suprascapular-vein']],
 ['FMA66563',['FJ2304','right','thoraco-acromial-trunk']],['FMA66564',['FJ2252','left','thoraco-acromial-trunk']],
 ['FMA23063',['FJ2361','right','pectoral-branch']],['FMA23064',['FJ2330','left','pectoral-branch']],
 ['FMA23068',['FJ2263','right','acromial-branch']],['FMA23069',['FJ2211','left','acromial-branch']],
 ['FMA23072',['FJ2282','right','deltoid-branch']],['FMA23073',['FJ2230','left','deltoid-branch']],
]);
assert.equal(pins.entries.length,16);assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,16);
same(pins.entries.map(e=>e.identity.fmaId).sort(),[...expected.keys()].sort());
for(const e of pins.entries){const [file,side,group]=expected.get(e.identity.fmaId);
 assert.equal(e.group,group);assert.equal(e.identity.laterality,side);assert.equal(e.identity.region,'shoulder-arm');
 same(e.identity.sources.map(s=>s.file),[file]);same(e.topics,['ct','mri']);
 same(catalog.structures.find(s=>s.id===e.identity.id),e.identity);
}
for(const b of pins.bundles){same(catalog.bundles.find(item=>item.id===b.id),b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
for(const p of ['public/models/bodyparts3d/full-body/catalog.json','LICENSES/THIRD_PARTY_NOTICES.md','package-lock.json'])assert.equal(await readFile(p,'utf8'),old(p),p+' unchanged');
const previousTopics=catalog.structures.map(s=>({id:s.id,topics:current.contentTabs.map(tab=>({tab,...previous.bodyLesson(s,tab)}))}));
assert.equal(hash(previousTopics),pins.previousAllTopicsHash,'Exact 9936-topic prior baseline');
const target=new Map(pins.entries.map(e=>[e.identity.id,e]));let changed=0,unchanged=0,refusals=0,reviewChanges=0,rendered=0,stale=0;
const require=createRequire(root+'/package.json'),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const viewerSource=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',viewerSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let callback;
function visit(node){if(ts.isArrowFunction(node)&&ts.isBlock(node.body)&&node.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert.equal(callback,undefined);callback=node.getText(ast);}ts.forEachChild(node,visit);}visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of catalog.structures){
 const entry=target.get(s.id);
 for(const tab of current.contentTabs){
  const before=previous.bodyLesson(s,tab),after=current.bodyLesson(s,tab),explicit=current.shoulderGirdleImagingLesson(s,tab);
  if(!entry||!entry.topics.includes(tab)){assert.equal(explicit,undefined);same(after,before,s.id+'|'+tab);unchanged++;continue;}
  changed++;same(before,entry.previous[tab]);assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');same(after,explicit);
  same(live.bodyLesson(s,tab),after,'Live targeted shoulder draft retained');same(live.shoulderGirdleImagingLesson(s,tab),explicit);
  assert(after.title.startsWith(s.name+' ·'));assert(after.bullets.some(b=>b.includes('Return separation to zero')));
  assert(after.note.includes('radiologist review pending'));assert(after.note.includes('No patient images'));
  if(entry.group==='suprascapular-vein'){
   assert(after.bullets.some(b=>b.includes('small vein')));
   assert(after.bullets.some(b=>b.includes(tab==='ct'?'arterial-phase CTA is not a complete venous drainage map':'arterial MRA is not a complete venous drainage map')));
  }else assert(after.bullets.some(b=>b.includes('small artery')));
  assert.equal(new Set(after.citations).size,after.citations.length);assert(after.citations.every(url=>new URL(url).protocol==='https:'));
  const tree=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:live.bodyContent,selected:s,SourceDisplayNotes:live.SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(tree);assert(html.includes(render(React.createElement('p',null,after.body))));
  for(const bullet of after.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of after.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  assert(html.includes('No imaging study loaded'));rendered++;
  const detached=structuredClone(after);after.bullets.push('foreign');after.citations.push('foreign');same(current.bodyLesson(s,tab),detached);
 }
 const priorReview=await previous.bodyReviewMaterial(s.id),nextReview=await current.bodyReviewMaterial(s.id);
 same(nextReview.source,priorReview.source);same(nextReview.reasoning,priorReview.reasoning);same(nextReview.guidedTours,priorReview.guidedTours);
 assert.equal(nextReview.fingerprints.source,priorReview.fingerprints.source);
 assert.equal(nextReview.status,'worksheet-not-submitted');assert.equal(nextReview.approval,false);
 if(entry){assert.notEqual(nextReview.fingerprints.teaching,priorReview.fingerprints.teaching);reviewChanges++;
  same((await live.bodyReviewMaterial(s.id)).fingerprints,nextReview.fingerprints,'Live targeted worksheet retained');
  assert(await current.parseBodyReviewResponse(nextReview,s.id));
  const foreign=structuredClone(nextReview);foreign.topics.find(t=>t.tab==='ct').body='Foreign wording';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
  const context=await live.bodyReviewContext(s.id),priorContext=await previous.bodyReviewContext(s.id);
  assert.equal(context.revisions.imaging,null);assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
  const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
  for(const delta of [{materialHash:priorReview.materialHash},{revisionHash:priorContext.revisions.teaching}]){
   const response=await live.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SHOULDER_GIRDLE_REVIEW'},body:JSON.stringify({catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:live.blankBodyReview(context,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);stale++;
  }
 }
 else same(nextReview.fingerprints.teaching,priorReview.fingerprints.teaching);
}
assert.equal(changed,32);assert.equal(unchanged,9904);assert.equal(reviewChanges,16);assert.equal(rendered,32);assert.equal(stale,32);
for(const e of pins.entries){const s=e.identity;
 for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:s.laterality==='left'?'right':'left'},{regions:['head-neck']},{region:'head-neck'},{sourceTree:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:{min:[0,0,0],max:[1,1,1]}},{sources:[]},{sources:s.sources.map(f=>({...f,sha256:'0'.repeat(64)}))}]){
  for(const tab of e.topics){assert.equal(current.shoulderGirdleImagingLesson({...s,...patch},tab),undefined);refusals++;}
 }
 const other=pins.entries.find(x=>x.identity.id!==s.id&&x.identity.fmaId===s.fmaId);
 assert.equal(other,undefined);
}
const replay=beforeShoulderGirdleImaging(current);
assert.equal(beforeShoulderGirdleImaging(replay),replay,'Offline replay is idempotent');
const restored=catalog.structures.map(s=>({id:s.id,topics:current.contentTabs.map(tab=>({tab,...replay.bodyLesson(s,tab)}))}));
assert.equal(hash(restored),pins.previousAllTopicsHash,'Exact 9936-topic prior baseline, not a replacement golden');
let historyRefusals=0;
for(const e of pins.entries){
 for(const tab of e.topics){
  assert.throws(()=>replay.bodyLesson({...e.identity,name:'Foreign'},tab));historyRefusals++;
  assert.throws(()=>beforeShoulderGirdleImaging({...current,bodyLesson(s,t){const lesson=current.bodyLesson(s,t);return s.id===e.identity.id&&t===tab?{...lesson,body:'Foreign'}:lesson;}}));historyRefusals++;
  assert.throws(()=>beforeShoulderGirdleImaging({...current,bodyLesson(s,t){return s.id===e.identity.id&&t===tab?e.previous[tab]:current.bodyLesson(s,t);}}));historyRefusals++;
 }
}
const unchangedTeachingWorksheets=catalog.structures.length-reviewChanges;
assert.equal(unchangedTeachingWorksheets,1088);
const report={baseline,historicalMilestone:milestone,preservationScope:'Recorded shoulder milestone; live targeted drafts, renderings, worksheets and stale POST refusals separately checked.',newDraftPlacements:changed,preservedTopicPlacements:unchanged,changedTeachingWorksheets:reviewChanges,unchangedTeachingWorksheets,actualViewerRenderings:rendered,stalePostRefusalsBeforeStorage:stale,sourceMutationRefusals:refusals,historyRefusals,sourceBundlesVerified:pins.bundles.length,modelsAndLicensesUnchanged:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/shoulder-girdle-imaging-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
