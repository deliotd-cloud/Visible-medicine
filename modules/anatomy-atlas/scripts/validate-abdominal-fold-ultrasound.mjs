import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/abdominal-fold-ultrasound-pins.json' with {type:'json'};

const parentCommit='057640ca58032d1e88680ce0d99797e12532836d';
const pinsHash='4f18a86460f4b045d74e8c1eab6417370e2ba3836d3b10d788c98104c9b7a75c';
assert(process.argv.slice(2).every(arg=>arg==='--record'));
assert(process.argv.filter(arg=>arg==='--record').length<=1);
assert.equal(pins.parentCommit,parentCommit);assert.equal(hash(pins),pinsHash);
assert.deepEqual(pins.entries.map(e=>[e.identity.fmaId,e.topic,e.identity.sources[0].file]),[
  ['FMA14643','mesentery','FJ3396'],['FMA14647','mesocolon','FJ3398'],['FMA16549','mesoappendix','FJ3397']]);
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(await readFile(catalogPath),execFileSync('git',['show',`${parentCommit}:${catalogPath}`],
  {maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const context=await contentContext(),api=context.api,display=api.bodyDisplayCatalog(context.catalog);
const parent=await exactSourceHistoryApi(parentCommit,'display-review'),originalDisplay=parent.bodyDisplayCatalog(context.catalog);
assert.deepEqual(display,originalDisplay);
assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);
assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.deepEqual(api.contentTabs,parent.contentTabs);
assert.equal(hash(snapshot(parent,originalDisplay)),pins.previousAllLessonsAndRecipesHash);
for(const entry of pins.entries){
  assert.deepEqual(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity]);
  assert.deepEqual(entry.topics,['ultrasound']);
  assert.deepEqual(Object.keys(entry.previous),['ultrasound']);
}
assert.equal(pins.bundles.length,1);
for(const bundle of pins.bundles){
  assert.equal(bundle.id,'abdomen-connective-mesenteric');
  assert.deepEqual(display.bundles.filter(b=>b.id===bundle.id),[bundle]);
  const bytes=await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
const compiled=await build({stdin:{contents:"export {abdominalFoldUltrasoundLesson} from './lib/abdominal-fold-ultrasound.ts';export {abdominalFoldUltrasoundTopics} from './content/abdominal-fold-ultrasound.ts';export {regionalTours} from './lib/regional-tours.ts';export {parseBodyReviewResponse} from './lib/body-review-response.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const helper=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(helper.regionalTours,parent.regionalTours);
assert.deepEqual(Object.keys(helper.abdominalFoldUltrasoundTopics).sort(),['mesentery','mesocolon','mesoappendix'].sort());
const currentRecords=api.bodyContentRecords(display),previousRecords=parent.bodyContentRecords(originalDisplay);
assert.equal(currentRecords.length,display.structures.length);assert.equal(previousRecords.length,currentRecords.length);
const currentById=new Map(currentRecords.map(r=>[r.id,r])),previousById=new Map(previousRecords.map(r=>[r.id,r]));
assert.equal(currentById.size,currentRecords.length);assert.equal(previousById.size,previousRecords.length);
const registry=new Map([...context.shoulder,...currentRecords].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry),targets=new Map(pins.entries.map(e=>[e.identity.id,e]));
let changed=0,unchanged=0,rejected=0;const transitions=[];
for(const structure of display.structures){
  const current=currentById.get(structure.id),previous=previousById.get(structure.id),expected=structuredClone(previous),bound=targets.get(structure.id);
  assert(current&&previous);assert(validate(current));
  for(const tab of api.contentTabs){
    const before=parent.bodyLesson(structure,tab),now=api.bodyLesson(structure,tab),taught=helper.abdominalFoldUltrasoundLesson(structure,tab);
    if(!bound||tab!=='ultrasound'){
      assert.deepEqual(now,before,structure.id+'|'+tab);assert.equal(taught,undefined);unchanged++;continue;
    }
    assert.deepEqual(before,bound.previous.ultrasound);assert.equal(before.readiness,'pending');
    assert.equal(now.readiness,'draft');assert.deepEqual(now,taught);assert.deepEqual(current.content[tab],now);
    const {readiness,...learner}=now;assert.deepEqual(api.bodyContent(structure,tab),learner);
    assert(now.bullets.length>0&&now.citations.length>0);
    assert.match(now.note,/review pending/);assert.match(now.note,/No images or publisher text imported/);
    assert.match(now.note,/diagnostic thresholds/);assert.match(now.note,/patient registration/);
    assert.match(now.note,/paid-lecture access remain independent/);
    expected.content[tab]=now;transitions.push({id:structure.id,tab,previousHash:hash(before),currentHash:hash(now)});changed++;
  }
  assert.deepEqual(current,expected,structure.id+' unrelated exported content changed');
  assert.equal(current.validation.clinicalApproval,'not-included');
  assert.equal(current.validation.materialRevisions.imaging,null);
}
assert.equal(changed,3);assert.equal(unchanged,9933);assert.equal(changed+unchanged,9936);
for(const entry of pins.entries){
  const previous=await parent.bodyReviewMaterial(entry.identity.id),current=await api.bodyReviewMaterial(entry.identity.id);
  assert(previous&&current);assert.equal(current.approval,false);
  assert.equal(current.status,'worksheet-not-submitted');
  const expected=structuredClone(previous);expected.topics=current.topics;
  expected.fingerprints.teaching=current.fingerprints.teaching;expected.materialHash=current.materialHash;
  assert.notEqual(current.fingerprints.teaching,previous.fingerprints.teaching);
  assert.notEqual(current.materialHash,previous.materialHash);assert.deepEqual(current,expected);
  assert.deepEqual(await helper.parseBodyReviewResponse(current,entry.identity.id),current);
  assert.equal(await helper.parseBodyReviewResponse(previous,entry.identity.id),null);
  const forged=structuredClone(current);forged.topics.find(t=>t.tab==='ultrasound').body+=' foreign';
  assert.equal(await helper.parseBodyReviewResponse(forged,entry.identity.id),null);
  for(const item of current.topics){const {tab,...lesson}=item;assert.deepEqual(lesson,api.bodyLesson(entry.identity,tab));}
  const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
  for(const path of leaves(entry.identity)){
    const bad=structuredClone(entry.identity);let branch=bad;
    for(const key of path.slice(0,-1))branch=branch[key];
    const key=path.at(-1),value=branch[key];
    branch[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
    assert.equal(helper.abdominalFoldUltrasoundLesson(bad,'ultrasound'),undefined,path.join('.'));rejected++;
  }
  const lesson=helper.abdominalFoldUltrasoundLesson(entry.identity,'ultrasound'),baseline=structuredClone(lesson);
  lesson.bullets.push('foreign');lesson.citations.length=0;
  assert.deepEqual(helper.abdominalFoldUltrasoundLesson(entry.identity,'ultrasound'),baseline);
}
const transition={parentCommit,pinsHash,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries:transitions};
const path='content/abdominal-fold-ultrasound-transition.json';
if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(await readFile(path,'utf8')),transition);
console.log(JSON.stringify({changed,unchanged,rejected,transitionHash:hash(transition),
  sourceBundleSha256:pins.bundles[0].sha256,clinicalApproval:false,imagesImported:false}));
