import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/thoracoacromial-quiz-pins.json' with {type:'json'};

const baseline='297707431e0f85a76a9d4b40d13a53669f65c705';
const sourceUrl='https://pubmed.ncbi.nlm.nih.gov/15622236/';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitBytes=path=>execFileSync('git',['show',`${baseline}:${path}`],{
  maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true,
});
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const pinPath='content/thoracoacromial-quiz-pins.json';
assert.deepEqual(await readFile(catalogPath),gitBytes(catalogPath),'Source catalog changed');
assert.deepEqual(await readFile(pinPath),gitBytes(pinPath),'Existing source pins changed');
assert.deepEqual(await readFile('public/models/bodyparts3d/manifest.json'),
  gitBytes('public/models/bodyparts3d/manifest.json'),'Model manifest changed');
const selected=pins.entries.filter(e=>e.group==='pectoral');
assert.deepEqual(selected.map(e=>e.identity.fmaId),['FMA23063','FMA23064']);
assert.equal(new Set(selected.map(e=>e.identity.id)).size,2);
for(const bundle of pins.bundles){
  const path='public'+new URL(bundle.url,'https://local.invalid').pathname;
  const bytes=await readFile(path);
  assert.deepEqual(bytes,gitBytes(path),'Source model changed: '+path);
  assert.equal(bytes.length,bundle.bytes);assert.equal(hash(bytes),bundle.sha256);
}

const context=await contentContext(),api=context.api;
const old=await exactSourceHistoryApi(baseline,'display-review');
const display=api.bodyDisplayCatalog(context.catalog),oldDisplay=old.bodyDisplayCatalog(context.catalog);
assert.deepEqual(display,oldDisplay);
assert.equal(hash(JSON.stringify(display)),pins.catalogHash);
assert.deepEqual(api.structures,old.structures);
assert.deepEqual(api.dissectionProfiles,old.dissectionProfiles);
assert.deepEqual(api.contentTabs,old.contentTabs);
assert.equal(display.structures.length*api.contentTabs.length,9936);

const compiled=await build({stdin:{
  contents:"export {pectoralBranchUltrasoundLesson} from './lib/pectoral-branch-ultrasound.ts';export {pectoralBranchUltrasound} from './content/pectoral-branch-ultrasound.ts';export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
  resolveDir:process.cwd(),loader:'ts',
},bundle:true,write:false,platform:'node',format:'esm'});
const helper=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(typeof helper.pectoralBranchUltrasoundLesson,'function');
assert.equal(typeof helper.pectoralBranchUltrasound,'object');
assert.equal(typeof helper.parseBodyReviewResponse,'function');

const currentRecords=api.bodyContentRecords(display),oldRecords=old.bodyContentRecords(oldDisplay);
assert.equal(currentRecords.length,display.structures.length);
assert.equal(oldRecords.length,currentRecords.length);
const currentById=new Map(currentRecords.map(r=>[r.id,r]));
const oldById=new Map(oldRecords.map(r=>[r.id,r]));
assert.equal(currentById.size,currentRecords.length);
assert.equal(oldById.size,oldRecords.length);
const registry=new Map([...context.shoulder,...currentRecords].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);
const targets=new Map(selected.map(e=>[e.identity.id,e]));
let changed=0,unchanged=0,validated=0;
for(const structure of display.structures){
  const current=currentById.get(structure.id),previous=oldById.get(structure.id);
  assert(current&&previous);assert(validate(current));validated++;
  const expected=structuredClone(previous),target=targets.get(structure.id);
  if(target)assert.deepEqual(structure,target.identity);
  for(const tab of api.contentTabs){
    const before=old.bodyLesson(structure,tab),now=api.bodyLesson(structure,tab);
    const taught=helper.pectoralBranchUltrasoundLesson(structure,tab);
    if(!target||tab!=='ultrasound'){
      assert.deepEqual(now,before,structure.id+'|'+tab);
      assert.equal(taught,undefined);unchanged++;continue;
    }
    assert.equal(before.readiness,'pending');assert.equal(now.readiness,'draft');
    assert.deepEqual(now,taught);assert.deepEqual(current.content[tab],now);
    const {readiness,...learner}=now;assert.deepEqual(api.bodyContent(structure,tab),learner);
    assert(typeof now.body==='string'&&now.body.length>0);
    assert(now.bullets?.length>0);assert(now.citations?.includes(sourceUrl));
    assert.match(now.note,/review pending/i);
    expected.content[tab]=now;changed++;
  }
  assert.deepEqual(current,expected,structure.id+' exported packet changed outside target topic');
  assert.equal(current.validation.clinicalApproval,'not-included');
  assert.equal(current.validation.materialRevisions.imaging,null);
}
assert.equal(changed,2);assert.equal(unchanged,9934);

// Every scalar in the admitted source identity is material. Array shape and
// ordering are separately tested, so identity cannot be weakened by omission.
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:
  Object.entries(value).flatMap(([key,part])=>leaves(part,[...path,key]));
let rejected=0;
for(const entry of selected){
  for(const path of leaves(entry.identity)){
    const bad=structuredClone(entry.identity);let part=bad;
    for(const key of path.slice(0,-1))part=part[key];
    const key=path.at(-1),value=part[key];
    part[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
    assert.equal(helper.pectoralBranchUltrasoundLesson(bad,'ultrasound'),undefined,path.join('.'));
    rejected++;
  }
  for(const mutate of [s=>s.sources.pop(),s=>s.regions.push('foreign'),s=>{delete s.sources;},
    s=>{delete s.bounds;},s=>{s.sources.reverse();s.sources.push({file:'FJ0',sha256:'foreign'});},
  ]){
    const bad=structuredClone(entry.identity);mutate(bad);
    assert.equal(helper.pectoralBranchUltrasoundLesson(bad,'ultrasound'),undefined);
    rejected++;
  }
  const lesson=helper.pectoralBranchUltrasoundLesson(entry.identity,'ultrasound');
  const pristine=structuredClone(lesson);lesson.bullets.push('foreign');lesson.citations.length=0;
  assert.deepEqual(helper.pectoralBranchUltrasoundLesson(entry.identity,'ultrasound'),pristine);
}

let changedPackets=0,unchangedPackets=0,staleRefusals=0,tamperedRefusals=0;
for(const structure of display.structures){
  const prior=await old.bodyReviewMaterial(structure.id);
  const current=await api.bodyReviewMaterial(structure.id);
  assert(prior&&current);assert.equal(current.approval,false);
  assert.equal(current.status,'worksheet-not-submitted');
  const entry=targets.get(structure.id);
  if(!entry){assert.deepEqual(current,prior,structure.id+' unaffected review packet');unchangedPackets++;continue;}
  const expected=structuredClone(prior);
  expected.topics=current.topics;
  expected.fingerprints.teaching=current.fingerprints.teaching;
  expected.materialHash=current.materialHash;
  assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);
  assert.notEqual(current.materialHash,prior.materialHash);
  assert.deepEqual(current,expected);
  assert.deepEqual(current.topics.find(t=>t.tab==='ultrasound'),
    {tab:'ultrasound',...api.bodyLesson(structure,'ultrasound')});
  assert.deepEqual(await helper.parseBodyReviewResponse(current,structure.id),current);
  assert.equal(await helper.parseBodyReviewResponse(prior,structure.id),null);staleRefusals++;
  const tampered=structuredClone(current);
  tampered.topics.find(t=>t.tab==='ultrasound').body+=' foreign';
  assert.equal(await helper.parseBodyReviewResponse(tampered,structure.id),null);tamperedRefusals++;
  changedPackets++;
}
assert.equal(changedPackets,2);assert.equal(unchangedPackets,1102);
assert.equal(staleRefusals,2);assert.equal(tamperedRefusals,2);
console.log(JSON.stringify({baseline,changedTopics:changed,unchangedTopics:unchanged,
  changedReviewPackets:changedPackets,unchangedReviewPackets:unchangedPackets,
  staleRefusals,tamperedRefusals,identityRejections:rejected,validatedRecords:validated,
  sourceGeometryChanged:false,clinicalApproval:false,imagesImported:false}));
