import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length,2,'No test-mode flags');
const baseline='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const previousTest=readFileSync(new URL('./fixtures/arterial-evidence-limits.before-mra-6036.mjs.raw',import.meta.url),'utf8');
assert.equal(sha(previousTest),'88f887b72ab488b1fd0df31c814e4e78e2a4f268ecf2501c83600c50603ee69e');
const currentTest=readFileSync(new URL('./test-arterial-evidence-limits.mjs',import.meta.url),'utf8');
const oldDeclaration='const middle=live.arterialEvidenceLimits.middleCollateralUltrasound,thyroid=live.arterialEvidenceLimits.inferiorThyroidMri;';
const historicalDeclaration="const middle=live.arterialEvidenceLimits.middleCollateralUltrasound,thyroid=feature.bodyLesson(pins.entries.find(e=>e.family==='inferiorThyroidMri').identity,'mri');";
assert.equal(currentTest.split(historicalDeclaration).length,2,'One historical context adapter');
assert.equal(currentTest.replace(historicalDeclaration,oldDeclaration),previousTest,'Every original assertion retained by exact inverse');
const git=(args,encoding='utf8')=>execFileSync('git',args,{encoding,windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git(['rev-parse',baseline+'^{commit}']).trim(),baseline);
assert.equal(git(['merge-base',baseline,'HEAD']).trim(),baseline,'Candidate must descend from exact baseline');

const expectedBaseline={
 'content/arterial-evidence-limits.ts':'2298e936bd0110766118bc304909b77f4ad6ac22448cc5d3e2e387183bce8981',
 'content/arterial-evidence-limits-pins.json':'b890eb90aaae78ac63038577ae9b4bba33ee2b4a649f596dff279b11e0f0bcc3',
 'lib/arterial-evidence-limits.ts':'9940e0a04aa4ebe82062d0744ca9772e68b815edc27a6523405dcbe324547ab9',
 'public/models/bodyparts3d/full-body/catalog.json':'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
};
for(const [path,digest] of Object.entries(expectedBaseline))
 assert.equal(sha(git(['show',baseline+':'+path],null)),digest,'Immutable before bytes: '+path);
const proposalSha='b746ada70e8f96906cb30289cd2649530f380f942f69b34fbf5e370282c21c24';
assert.equal(sha(readFileSync('content/arterial-evidence-limits.ts')),proposalSha,'Only reviewed proposal bytes');
for(const path of [
 'content/arterial-evidence-limits-pins.json','lib/arterial-evidence-limits.ts',
 'public/models/bodyparts3d/full-body/catalog.json','app/body-content.ts',
 'lib/body-source-additions.ts','lib/body-review-material.ts','lib/body-review-context.ts',
 'lib/body-review-response.ts','lib/body-review-api.ts','lib/body-review-decisions.ts'
]) assert.equal(sha(readFileSync(path)),sha(git(['show',baseline+':'+path],null)),'Unchanged source/identity contract: '+path);
const pins=JSON.parse(readFileSync('content/arterial-evidence-limits-pins.json','utf8'));
assert.equal(pins.baseline,'bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f');
assert.equal(pins.entries.length,4);
const selected=pins.entries.filter(e=>e.family==='inferiorThyroidMri');
assert.equal(selected.length,2);
assert.deepEqual(selected.map(e=>[e.identity.laterality,e.identity.fmaId,e.tab]),
 [['left','FMA10680','mri'],['right','FMA10697','mri']]);
const raw=JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const compiled=await build({stdin:{contents:`export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export {arterialEvidenceLimitLesson} from './lib/arterial-evidence-limits';export {arterialEvidenceLimits} from './content/arterial-evidence-limits';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
// Completed MRA assertions replay their exact parent; the CT suite checks current source independently.
const live=await exactSourceHistoryApi('87ed7e343260c7df48a40d53503f25bbfd34cfa5','inferior-thyroid-mra-legacy');
const before=await exactSourceHistoryApi(baseline,'review-security');
const currentCatalog=live.bodyDisplayCatalog(raw),oldCatalog=before.bodyDisplayCatalog(raw);
assert.deepEqual(currentCatalog,oldCatalog,'Catalog identity and geometry unchanged');
assert.equal(currentCatalog.structures.length,1104);
assert.equal(live.contentTabs.length,9);
for(const key of ['structures','dissectionProfiles','regionalTours','contentTabs'])
 assert.deepEqual(live[key],before[key],key+' unchanged');
assert.equal(new Set(currentCatalog.structures.map(s=>s.id)).size,1104);
for(const entry of pins.entries)
 assert.deepEqual(currentCatalog.structures.filter(s=>s.id===entry.identity.id),[entry.identity],
  'Whole identity including side, source and bounds: '+entry.identity.id);
const middleBlock=text=>text.slice(text.indexOf('  middleCollateralUltrasound: {'),
 text.indexOf('  inferiorThyroidMri: {'));
assert.equal(middleBlock(readFileSync('content/arterial-evidence-limits.ts','utf8')),
 middleBlock(git(['show',baseline+':content/arterial-evidence-limits.ts'])),
 'Middle collateral source content unchanged byte for byte');
const topic=live.arterialEvidenceLimits.inferiorThyroidMri;
assert.match(topic.body,/right-sided course through thyroid tissue/);
assert.match(topic.body,/left-sided aneurysms/);
assert.match(topic.body,/selected cases do not establish routine visibility/);
assert.deepEqual(topic.citations,['https://doi.org/10.7727/wimj.2015.288','https://pubmed.ncbi.nlm.nih.gov/25770593/']);
assert.match(topic.bullets.join(' '),/Neither report establishes normal-vessel detection rates/);
assert.match(topic.bullets.join(' '),/no acquired scan, measured flow, patient registration/);
assert.match(topic.note,/revision-bound radiologist sign-off remain pending/);
const selectedIds=new Set(selected.map(e=>e.identity.id));
let changed=0,preserved=0;
for(const structure of currentCatalog.structures)for(const tab of live.contentTabs){
 const old=before.bodyLesson(structure,tab),now=live.bodyLesson(structure,tab);
 if(tab==='mri'&&selectedIds.has(structure.id)){
  assert.notDeepEqual(now,old);
  assert.deepEqual(now,{...old,title:`${structure.name} · ${topic.title} · evidence pending`,
   body:topic.body,bullets:[...topic.bullets],citations:[...topic.citations],note:topic.note});
  assert.equal(now.readiness,'pending');changed++;
 }else{assert.deepEqual(now,old,structure.id+':'+tab);preserved++;}
}
assert.deepEqual([changed,preserved],[2,9934]);
function leaves(value,path=[]){
 if(value&&typeof value==='object')return Object.entries(value).flatMap(([key,next])=>leaves(next,[...path,key]));
 return [{path,value}];
}
function alter(root,path,value){let target=root;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=value;}
const request=body=>new Request('https://atlas.test/api/body-decisions',{method:'POST',
 headers:{origin:'https://atlas.test','content-type':'application/json',
 'oai-authenticated-user-id':'SYNTHETIC_THYROID_MRA'},body:JSON.stringify(body)});
let identityRefusals=0,packetRefusals=0,decisionRefusals=0,storageCalls=0;
const db={prepare(){storageCalls++;throw Error('Invalid request reached storage');}};
for(const entry of selected){
 const s=entry.identity,tab=entry.tab;
 const lesson=live.arterialEvidenceLimitLesson(s,tab);
 assert.deepEqual(lesson,live.bodyLesson(s,tab));
 const {readiness,...section}=lesson;
 assert.deepEqual(live.bodyContent(s,tab),section);
 for(const other of live.contentTabs.filter(t=>t!==tab))
  assert.equal(live.arterialEvidenceLimitLesson(s,other),undefined);
 for(const {path,value} of leaves(s)){
  const forged=structuredClone(s);
  alter(forged,path,typeof value==='string'?value+' foreign':typeof value==='number'?value+1:typeof value==='boolean'?!value:'foreign');
  assert.equal(live.arterialEvidenceLimitLesson(forged,tab),undefined,'Identity leaf '+path.join('.'));
  identityRefusals++;
 }
 assert.equal(live.arterialEvidenceLimitLesson({...s,foreign:true},tab),undefined);
 identityRefusals++;
 const oldPacket=await before.bodyReviewMaterial(s.id),packet=await live.bodyReviewMaterial(s.id);
 assert.deepEqual(await live.parseBodyReviewResponse(packet,s.id),packet);
 assert.equal(await live.parseBodyReviewResponse(oldPacket,s.id),null);
 assert.deepEqual(packet.topics.find(t=>t.tab===tab),{tab,...lesson});
 for(const edit of [
  p=>{p.topics.find(t=>t.tab===tab).body+=' foreign';},
  p=>{p.topics.find(t=>t.tab===tab).readiness='draft';},
  p=>{p.topics.find(t=>t.tab===tab).citations=['https://foreign.invalid'];},
  p=>{p.source.structure.sources[0].sha256='0'.repeat(64);},
  p=>{p.source.structure.bounds.min[0]+=1;}
 ]){
  const forged=structuredClone(packet);edit(forged);
  assert.equal(await live.parseBodyReviewResponse(forged,s.id),null);
  packetRefusals++;
 }
 const oldContext=await before.bodyReviewContext(s.id),context=await live.bodyReviewContext(s.id);
 assert.equal(context.sourceHash,oldContext.sourceHash);
 assert.notEqual(context.materialHash,oldContext.materialHash);
 assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
 const decision={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',
  expectedVersion:0,materialHash:oldContext.materialHash,
  revisionHash:oldContext.revisions.teaching,checklistVersion:context.checklistVersion,
  draft:live.blankBodyReview(context,'teaching')};
 for(const forged of [
  decision,
  {...decision,materialHash:context.materialHash},
  {...decision,revisionHash:context.revisions.teaching}
 ]){
  assert.equal((await live.postBodyDecision(request(forged),db)).status,409);
  decisionRefusals++;
 }
 assert.equal((await live.postBodyDecision(request({...decision,structureId:s.id+' foreign'}),db)).status,404);
 decisionRefusals++;
}
assert.equal(storageCalls,0);
console.log(JSON.stringify({baseline,changed,preserved,readinessPromotions:0,
 identityRefusals,packetRefusals,decisionRefusals,storageCalls,
 geometryChanged:false,clinicalApproval:false}));
