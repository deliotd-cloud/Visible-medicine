// Exact-source regression for the bounded wrist CT/MRI/X-ray teaching correction.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline='90191b8b236bfed00db7c424dbacde915920460d';
const REQUIRED_PINS_HASH='15dfbad1c4484cfb90962ee158c2f12fd113f73edbd2ddb6999f79708668f343';
const REQUIRED_TRANSITION_HASH='74b600dd3a73ac6258c026289fe629f41b16956295a8a73f2d2775867f51abd7';
const tabs=['ct','mri','xray'];
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const pins=JSON.parse(readFileSync('content/wrist-imaging-correction-pins.json'));
const transition=JSON.parse(readFileSync('content/wrist-imaging-correction.transition.json'));
assert.equal(hash(pins),REQUIRED_PINS_HASH);
assert.equal(hash(transition),REQUIRED_TRANSITION_HASH);
assert.equal(pins.baseline,baseline);
assert.equal(transition.baseline,baseline);
assert.equal(transition.sourcePinsHash,hash(pins));

const before=await exactSourceHistoryApi(baseline,'review-security');
// Prove the complete immutable correction epoch. The new toe-US suite separately
// compares current delivery with this entire epoch, including all 48 wrist topics.
const now=await exactSourceHistoryApi('a1cb14f05b3070b8553e85e3596f634b2bf36a5d','wrist-correction');
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sourceCatalog=JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
assert.equal(sourceCatalog.sourceVersion,pins.sourceVersion);
assert.equal(sourceCatalog.license,pins.license);
assert.deepEqual(sourceCatalog.coordinateSystem,pins.coordinateSystem);
const catalog=now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length,1104);
assert.equal(catalog.bundles.length,109);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'))));
for(const key of ['structures','dissectionProfiles','regionalTours','contentTabs'])assert.deepEqual(now[key],before[key],key);
const sourceBundles=new Map(sourceCatalog.bundles.map(bundle=>[bundle.id,bundle]));
for(const bundle of pins.bundles)assert.deepEqual(bundle,sourceBundles.get(bundle.id));

const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(tab=>[tab,api.bodyLesson(s,tab)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(hash(snapshot(before)),pins.beforeAllTeachingSnapshotHash);
const reconstructed=snapshot(now);
const entries=new Map(pins.entries.map(entry=>[entry.identity.id,entry]));
const transitions=new Map(transition.entries.map(entry=>[`${entry.id}:${entry.tab}`,entry]));
assert.equal(pins.entries.length,16);
assert.equal(entries.size,16);
assert.equal(transition.entries.length,48);
assert.equal(transitions.size,48);
assert.deepEqual(pins.entries.map(entry=>entry.identity.name).sort(),
 ['Left','Right'].flatMap(side=>['capitate','hamate','lunate','pisiform','scaphoid','trapezium','trapezoid','triquetral'].map(bone=>`${side} ${bone}`)).sort());
let changed=0,preserved=0;
for(const row of reconstructed.body){
 const structure=catalog.structures.find(s=>s.id===row.id);
 const entry=entries.get(row.id);
 for(const tab of now.contentTabs){
  const prior=before.bodyLesson(structure,tab),current=now.bodyLesson(structure,tab);
  if(entry&&tabs.includes(tab)){
   assert.deepEqual(prior,entry.previous[tab],`${row.id}:${tab}:previous`);
   assert.equal(current.readiness,'draft');
   assert.deepEqual(current,now.wristImagingLesson(structure,tab));
   const record=transitions.get(`${row.id}:${tab}`);
   assert(record);assert.equal(record.fmaId,structure.fmaId);
   assert.equal(hash(current),record.draftHash);
   assert.notDeepEqual(current,prior,`${row.id}:${tab}: recorded correction must be material`);
   assert.equal(current.bullets.at(-1),'Return separation to zero before comparing source wrist relationships. Cutaway and Explode do not generate acquired scan slices, tissue signal or diagnostic measurements.');
   if(!['FMA24446','FMA24447','FMA24448','FMA24449'].includes(structure.fmaId)){
    // The remaining twelve wrist selections change only the common typo.
    const withPriorBullet=structuredClone(current);
    withPriorBullet.bullets[withPriorBullet.bullets.length-1]=prior.bullets.at(-1);
    assert.deepEqual(withPriorBullet,prior,`${row.id}:${tab}: no unrelated rewrite`);
   }
   const {readiness,...shown}=current;
   assert.deepEqual(now.bodyContent(structure,tab),shown);
   row.topics[tab]=prior;changed++;
  }else{assert.deepEqual(current,prior,`${row.id}:${tab}:preserved`);preserved++;}
 }
}
assert.equal(changed,48);
assert.equal(preserved,9888);
assert.equal(hash(reconstructed),pins.beforeAllTeachingSnapshotHash);

const pathsWhere=(value,predicate,path=[])=>[...(predicate(value)?[path]:[]),...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>pathsWhere(child,predicate,[...path,key])):[])];
const at=(value,path)=>path.reduce((part,key)=>part[key],value);
let refusals=0,expectedRefusals=0,malformed=0,stale=0,storageCalls=0,worksheets=0;
for(const {identity,previous} of pins.entries){
 assert.deepEqual(catalog.structures.find(s=>s.id===identity.id),identity);
 assert.deepEqual(Object.keys(previous).sort(),[...tabs].sort());
 const isCapitate=/capitate/i.test(identity.name),isHamate=/hamate/i.test(identity.name);
 for(const tab of tabs){
  const draft=now.wristImagingLesson(identity,tab),clean=structuredClone(draft);
  assert.equal(draft.readiness,'draft');
  assert.match(draft.note,/independent anatomy\/radiology review pending/i);
  assert.match(draft.note,/no patient images, scan registration or paid-lecture access/i);
  if(isCapitate)assert.doesNotMatch([draft.body,...draft.bullets].join(' '),/\bhook\b/i);
  draft.bullets.push('foreign');draft.citations.push('https://foreign.example');
  assert.deepEqual(now.wristImagingLesson(identity,tab),clean,`${identity.id}:${tab}:fresh arrays`);
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const foreign=structuredClone(identity),parent=at(foreign,path.slice(0,-1)),key=path.at(-1),value=parent[key];
   parent[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+.01:value===null?'foreign':!value;
   assert.equal(now.wristImagingLesson(foreign,tab),undefined,`${identity.id}:${tab}:${path.join('.')}`);refusals++;
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const foreign=structuredClone(identity);at(foreign,path).push('foreign');
   assert.equal(now.wristImagingLesson(foreign,tab),undefined,`${identity.id}:${tab}:${path.join('.')}`);refusals++;
  }
  const foreign=structuredClone(identity);foreign.unexpected=true;
  assert.equal(now.wristImagingLesson(foreign,tab),undefined);refusals++;
  expectedRefusals+=pathsWhere(identity,value=>value===null||typeof value!=='object').length+pathsWhere(identity,Array.isArray).length+1;
  const material=await now.bodyReviewMaterial(identity.id);
  assert.equal(material.approval,false);
  assert(await now.parseBodyReviewResponse(material,identity.id));
  for(const mutate of [
   value=>{value.topics.find(topic=>topic.tab===tab).body+=' foreign';},
   value=>{value.topics.find(topic=>topic.tab===tab).readiness='approved';},
   value=>{value.topics.find(topic=>topic.tab===tab).citations=['https://foreign.example'];},
   value=>{value.source.structure.sources=[];},
   value=>{value.topics=value.topics.filter(topic=>topic.tab!==tab);},
  ]){const foreignMaterial=structuredClone(material);mutate(foreignMaterial);assert.equal(await now.parseBodyReviewResponse(foreignMaterial,identity.id),null);malformed++;}
  const priorContext=await before.bodyReviewContext(identity.id),context=await now.bodyReviewContext(identity.id);
  assert.equal(context.sourceHash,priorContext.sourceHash);
  assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  const packet={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};
  for(const delta of [{materialHash:priorContext.materialHash,revisionHash:priorContext.revisions.teaching},{materialHash:priorContext.materialHash},{revisionHash:priorContext.revisions.teaching}]){
   const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_WRIST_IMAGING'},body:JSON.stringify({...packet,...delta})}),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
   assert.equal(response.status,409);stale++;
  }
 }
 for(const tab of now.contentTabs.filter(tab=>!tabs.includes(tab)))assert.equal(now.wristImagingLesson(identity,tab),undefined);
 if(isCapitate||isHamate){
  const bodies=tabs.map(tab=>now.wristImagingLesson(identity,tab).body);
  assert.equal(new Set(bodies).size,3,`${identity.id}: modality bodies must differ`);
 }
}
assert.equal(refusals,expectedRefusals);
assert.equal(malformed,48*5);
assert.equal(stale,48*3);
assert.equal(storageCalls,0);
for(const [capitateFma,hamateFma]of[['FMA24446','FMA24448'],['FMA24447','FMA24449']]){
 const capitate=catalog.structures.find(s=>s.fmaId===capitateFma),hamate=catalog.structures.find(s=>s.fmaId===hamateFma);
 assert(capitate&&hamate);assert.equal(capitate.laterality,hamate.laterality);
 for(const tab of tabs){
  const capitateLesson=now.wristImagingLesson(capitate,tab),hamateLesson=now.wristImagingLesson(hamate,tab);
  assert.notEqual(capitateLesson.body,hamateLesson.body,`${tab}: separate bone teaching`);
  assert.match(capitateLesson.body,/capitate/i);assert.match(hamateLesson.body,/hamate/i);
  assert.match(hamateLesson.body,/hook/i);
 }
}
assert.equal(now.wristImagingLesson({id:'foreign'},'ct'),undefined);
for(const structure of catalog.structures){
 const prior=await before.bodyReviewMaterial(structure.id),current=await now.bodyReviewMaterial(structure.id);
 for(const key of ['source','reasoning','guidedTours'])assert.deepEqual(current[key],prior[key]);
 assert.equal(current.approval,false);
 if(entries.has(structure.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheets++;}
 else{assert.deepEqual(current.topics,prior.topics);assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching);}
}
assert.equal(worksheets,16);
for(const bundle of catalog.bundles){
 const path=`public${bundle.url.split('?')[0]}`,bytes=readFileSync(path);
 assert.equal(bytes.length,bundle.bytes);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(path));
}
for(const path of ['package-lock.json','LICENSES/dependency-license-audit.json','LICENSES/BODYPARTS3D_FULL_BODY.md','app/body-explorer.tsx','lib/imaging-sync.ts','lib/didanix-atlas-adapter.ts','lib/independent-study-links.ts','lib/body-review-context.ts','lib/body-review-api.ts'])
 assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
console.log(JSON.stringify({changed,preserved,worksheets,identityRefusals:refusals,malformed,stale,storageCalls,bundlesUnchanged:catalog.bundles.length,clinicalApproval:false,websiteIntegrated:false}));
