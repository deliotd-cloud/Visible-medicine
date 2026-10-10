import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/orbital-nerve-quiz-pins.json' with {type:'json'};

const parentCommit='d77054e28f42b4fe99e6ad9519defde7603c7485';
assert.equal(process.argv.length,2,'No record or mutation mode');
const git=path=>execFileSync('git',['show',`${parentCommit}:${path}`],{
  maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true,
});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(actual,expected,message)=>assert.deepEqual(actual,expected,message);
const expectedGroups={
  anteriorEthmoidal:['FMA52677','FMA52676'],
  posteriorEthmoidal:['FMA52716','FMA52715'],
  infratrochlear:['FMA52699','FMA52698'],
  ophthalmic:['FMA52623','FMA52622'],
  ciliaryConnection:['FMA52674','FMA52673'],
  longCiliary:['FMA82735','FMA82734'],
  supraorbital:['FMA52657','FMA52656'],
  supratrochlear:['FMA52644','FMA52643'],
};

const pinBytes=await readFile('content/orbital-nerve-quiz-pins.json');
same(pinBytes,git('content/orbital-nerve-quiz-pins.json'),'Existing orbital source pins changed');
const pinsHash=digest(pinBytes);
assert.equal(pins.entries.length,30);
const targets=Object.entries(expectedGroups).flatMap(([group,fmas])=>fmas.map(fma=>{
  const matches=pins.entries.filter(e=>e.group===group&&e.identity.fmaId===fma);
  assert.equal(matches.length,1,group+'|'+fma);
  return matches[0];
}));
assert.equal(targets.length,16);
assert.equal(new Set(targets.map(e=>e.identity.id)).size,16);
const targetById=new Map(targets.map(e=>[e.identity.id,e]));
same(await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  git('public/models/bodyparts3d/full-body/catalog.json'),'Geometry catalog changed');

const context=await contentContext(),api=context.api;
const display=api.bodyDisplayCatalog(context.catalog);
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
const oldDisplay=parent.bodyDisplayCatalog(context.catalog);
same(display,oldDisplay,'Display geometry/source changed');
same(api.structures,parent.structures,'Shoulder changed');
same(api.dissectionProfiles,parent.dissectionProfiles,'Recipes changed');
same(api.contentTabs,parent.contentTabs,'Topic tabs changed');
same(display.coordinateSystem,pins.coordinateSystem);
for(const bundle of pins.bundles){
  same(display.bundles.filter(b=>b.id===bundle.id),[bundle],bundle.id+' catalog changed');
  const path='public'+new URL(bundle.url,'https://local.invalid').pathname;
  const bytes=await readFile(path);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(digest(bytes),bundle.sha256);
  same(bytes,git(path),bundle.id+' source bundle changed');
}
for(const entry of pins.entries)
  same(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity],entry.identity.id+' source changed');

const compiled=await build({stdin:{contents:
  "export {orbitalSensoryMriLesson} from './lib/orbital-sensory-mri.ts';"+
  "export {orbitalSensoryMriGroups,orbitalSensoryMriTopics} from './content/orbital-sensory-mri.ts';"+
  "export {regionalTours} from './lib/regional-tours.ts';"+
  "export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching.ts';"+
  "export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const helper=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
same(helper.regionalTours,parent.regionalTours,'Regional tours changed');
const oldNested=await exactSourceHistoryApi(parentCommit,'nested-teaching');
same(helper.nestedConcepts,oldNested.nestedConcepts,'Nested concepts changed');
same(helper.nestedTeachingReferences,oldNested.nestedTeachingReferences,'Nested references changed');
same(helper.orbitalSensoryMriGroups,expectedGroups,'Explicit target groups changed');
same(Object.keys(helper.orbitalSensoryMriTopics).sort(),Object.keys(expectedGroups).sort());
for(const topic of Object.values(helper.orbitalSensoryMriTopics)){
  assert.equal(typeof topic.body,'string');assert(topic.body.trim());
  assert(Array.isArray(topic.bullets)&&topic.bullets.length>0);
  assert(Array.isArray(topic.citations)&&topic.citations.length>0);
  for(const url of topic.citations)assert.equal(new URL(url).protocol,'https:');
}

const records=api.bodyContentRecords(display),oldRecords=parent.bodyContentRecords(oldDisplay);
assert.equal(records.length,display.structures.length);
assert.equal(oldRecords.length,records.length);
const currentById=new Map(records.map(r=>[r.id,r]));
const oldById=new Map(oldRecords.map(r=>[r.id,r]));
assert.equal(currentById.size,records.length);assert.equal(oldById.size,oldRecords.length);
const registry=new Map([...context.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);
let changed=0,unchanged=0,rejected=0,reviewBindings=0;
for(const structure of display.structures){
  const current=currentById.get(structure.id),old=oldById.get(structure.id);
  assert(current&&old);assert(validate(current));
  const expected=structuredClone(old),bound=targetById.get(structure.id);
  for(const tab of api.contentTabs){
    const before=parent.bodyLesson(structure,tab),now=api.bodyLesson(structure,tab);
    const direct=helper.orbitalSensoryMriLesson(structure,tab);
    if(!bound||tab!=='mri'){
      same(now,before,structure.id+'|'+tab+' changed');
      assert.equal(direct,undefined,structure.id+'|'+tab+' incorrectly targeted');
      unchanged++;continue;
    }
    assert.equal(before.readiness,'pending',structure.id);
    assert.equal(now.readiness,'draft',structure.id);
    same(now,direct,structure.id+' dispatch mismatch');
    same(current.content[tab],now,structure.id+' export mismatch');
    const {readiness,...learner}=now;
    same(api.bodyContent(structure,tab),learner,structure.id+' display mismatch');
    const topic=helper.orbitalSensoryMriTopics[bound.group];
    assert.equal(now.body,topic.body);
    same(now.citations,[...topic.citations]);
    for(const bullet of topic.bullets)assert(now.bullets.includes(bullet));
    assert.match(now.bullets.join(' '),/no validated patient registration/i);
    assert.match(now.note,/revision-bound radiologist review pending/);
    assert.match(now.note,/Atlas, imaging-case and paid-lecture access remain independent/);
    expected.content[tab]=now;changed++;
  }
  same(current,expected,structure.id+' exported record changed elsewhere');
  assert.equal(current.validation.clinicalApproval,'not-included');
  assert.equal(current.validation.materialRevisions.imaging,null);
}
assert.equal(changed,16);assert.equal(unchanged,9920);
assert.equal(changed+unchanged,9936);
const shortCiliary=display.structures.find(s=>s.fmaId==='FMA7041');
assert(shortCiliary,'Short ciliary source missing');
assert.equal(api.bodyLesson(shortCiliary,'mri').readiness,'pending');
same(api.bodyLesson(shortCiliary,'mri'),parent.bodyLesson(shortCiliary,'mri'));

for(const entry of targets){
  const id=entry.identity.id,old=await parent.bodyReviewMaterial(id),now=await api.bodyReviewMaterial(id);
  assert(old&&now);assert.equal(now.approval,false);
  assert.equal(now.status,'worksheet-not-submitted');
  const expected=structuredClone(old);
  expected.topics=now.topics;
  expected.fingerprints.teaching=now.fingerprints.teaching;
  expected.materialHash=now.materialHash;
  assert.notEqual(now.fingerprints.teaching,old.fingerprints.teaching);
  assert.notEqual(now.materialHash,old.materialHash);
  same(now,expected,id+' review binding changed outside teaching');
  same(await helper.parseBodyReviewResponse(now,id),now);
  assert.equal(await helper.parseBodyReviewResponse(old,id),null);
  const forged=structuredClone(now);
  forged.topics.find(t=>t.tab==='mri').body+=' foreign';
  assert.equal(await helper.parseBodyReviewResponse(forged,id),null);
  for(const item of now.topics){const {tab,...lesson}=item;same(lesson,api.bodyLesson(entry.identity,tab));}
  reviewBindings++;
  const reject=bad=>{
    assert.equal(helper.orbitalSensoryMriLesson(bad,'mri'),undefined,id+' accepted foreign source');
    rejected++;
  };
  const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:
    Object.entries(value).flatMap(([key,item])=>leaves(item,[...path,key]));
  for(const path of leaves(entry.identity)){
    const bad=structuredClone(entry.identity);let value=bad;
    for(const key of path.slice(0,-1))value=value[key];
    const key=path.at(-1),oldValue=value[key];
    value[key]=typeof oldValue==='number'?oldValue+.01:
      typeof oldValue==='boolean'?!oldValue:String(oldValue)+'-foreign';
    reject(bad);
  }
  for(const mutate of [
    s=>{s.laterality=s.laterality==='left'?'right':'left';},
    s=>{s.regions.push('foreign');},s=>{s.sources.push(s.sources[0]);},
    s=>{delete s.sources;},s=>{s.foreign=true;},
  ]){const bad=structuredClone(entry.identity);mutate(bad);reject(bad);}
  const counterpart=targets.find(other=>other.group===entry.group&&other.identity.id!==id);
  assert(counterpart);reject({...entry.identity,sources:counterpart.identity.sources});
  const direct=helper.orbitalSensoryMriLesson(entry.identity,'mri');
  const pristine=structuredClone(direct);
  direct.bullets.push('foreign');direct.citations.length=0;
  same(helper.orbitalSensoryMriLesson(entry.identity,'mri'),pristine,'Return fresh arrays');
}
console.log(JSON.stringify({changed,unchanged,rejected,reviewBindings,pinsHash,
  sourceGeometryChanged:false,clinicalApproval:false,patientRegistration:false}));
