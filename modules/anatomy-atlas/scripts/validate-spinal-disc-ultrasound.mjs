import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/spine-imaging-pins.json' with {type:'json'};

const parentCommit='8ad2315816b83ea16ae77b4a2c060148b4bf9112';
assert.equal(process.argv.length,2,'No record or mutation mode');
const git=(path)=>execFileSync('git',['show',`${parentCommit}:${path}`],
  {maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true});
const digest=(bytes)=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b,label)=>assert.deepEqual(a,b,label);

// Pin bytes, not a regenerated target list or a mutable baseline fixture.
const pinBytes=await readFile('content/spine-imaging-pins.json');
same(pinBytes,git('content/spine-imaging-pins.json'),'Existing spine source pins changed');
const pinsHash=digest(pinBytes);
assert.equal(pins.sourceVersion,'4.0');
same(pins.entries.filter(e=>e.group==='cervicalDisc').length,6);
same(pins.entries.filter(e=>e.group==='thoracicDisc').length,11);
same(pins.entries.filter(e=>e.group==='lumbarDisc').length,5);
const expectedFmas={
  cervicalDisc:['FMA13896','FMA13897','FMA13898','FMA13899','FMA13900'],
  thoracicDisc:['FMA13495','FMA13500','FMA13501','FMA13502','FMA13503','FMA13504','FMA13505','FMA13506','FMA13507','FMA13508'],
  lumbarDisc:['FMA16033','FMA16034','FMA16035','FMA16036'],
};
const targetEntries=Object.entries(expectedFmas).flatMap(([group,fmas])=>fmas.map(fma=>{
  const matches=pins.entries.filter(e=>e.group===group&&e.identity.fmaId===fma);
  assert.equal(matches.length,1,group+'|'+fma);
  return matches[0];
}));
assert.equal(targetEntries.length,19);
assert.equal(new Set(targetEntries.map(e=>e.identity.id)).size,19);
const targetById=new Map(targetEntries.map(e=>[e.identity.id,e]));
const priorDiscEntries=pins.entries.filter(e=>e.group in expectedFmas&&!targetById.has(e.identity.id));
assert.equal(priorDiscEntries.length,3);
same(priorDiscEntries.map(e=>e.identity.fmaId),['FMA25058','FMA10458','FMA16037']);
same(await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  git('public/models/bodyparts3d/full-body/catalog.json'),'Geometry catalog changed');

const context=await contentContext(),api=context.api;
const display=api.bodyDisplayCatalog(context.catalog);
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
const oldDisplay=parent.bodyDisplayCatalog(context.catalog);
same(display,oldDisplay,'Display geometry/source changed');
same(api.structures,parent.structures,'Shoulder changed');
same(api.dissectionProfiles,parent.dissectionProfiles,'Recipes changed');
same(api.contentTabs,parent.contentTabs,'Topic set changed');
same(display.coordinateSystem,pins.coordinateSystem);
assert.equal(display.sourceVersion,pins.sourceVersion);
for(const bundle of pins.bundles){
  same(display.bundles.filter(b=>b.id===bundle.id),[bundle]);
  const bytes=await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(digest(bytes),bundle.sha256);
  same(bytes,git('public'+bundle.url),'Source bundle changed');
}
for(const entry of pins.entries)
  same(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity],entry.identity.id+' source changed');
assert(!display.structures.some(s=>s.sources?.some(source=>source.file==='FJ3211')),
  'Unresolved source disc admitted');

const compiled=await build({stdin:{contents:
  "export {spinalDiscUltrasoundLesson} from './lib/spinal-disc-ultrasound.ts';"+
  "export {spinalDiscUltrasoundGroups,spinalDiscUltrasoundTopics} from './content/spinal-disc-ultrasound.ts';"+
  "export {regionalTours} from './lib/regional-tours.ts';"+
  "export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching.ts';"+
  "export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const helper=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
same(helper.regionalTours,parent.regionalTours,'Regional tours changed');
const oldNested=await exactSourceHistoryApi(parentCommit,'nested-teaching');
same(helper.nestedConcepts,oldNested.nestedConcepts,'Nested concepts changed');
same(helper.nestedTeachingReferences,oldNested.nestedTeachingReferences,'Nested references changed');
same(helper.spinalDiscUltrasoundGroups,expectedFmas,'Explicit target groups changed');

const currentRecords=api.bodyContentRecords(display),oldRecords=parent.bodyContentRecords(oldDisplay);
assert.equal(currentRecords.length,display.structures.length);
assert.equal(oldRecords.length,currentRecords.length);
const currentById=new Map(currentRecords.map(r=>[r.id,r]));
const oldById=new Map(oldRecords.map(r=>[r.id,r]));
assert.equal(currentById.size,currentRecords.length);
assert.equal(oldById.size,oldRecords.length);
const registry=new Map([...context.shoulder,...currentRecords].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);
let changed=0,unchanged=0,rejected=0,reviewBindings=0;
for(const structure of display.structures){
  const current=currentById.get(structure.id),old=oldById.get(structure.id);
  assert(current&&old);assert(validate(current));
  const expected=structuredClone(old),bound=targetById.get(structure.id);
  for(const tab of api.contentTabs){
    const before=parent.bodyLesson(structure,tab),now=api.bodyLesson(structure,tab);
    const direct=helper.spinalDiscUltrasoundLesson(structure,tab);
    if(!bound||tab!=='ultrasound'){
      same(now,before,structure.id+'|'+tab);
      assert.equal(direct,undefined,structure.id+'|'+tab+' incorrectly targeted');
      unchanged++;continue;
    }
    assert.equal(before.readiness,'pending',structure.id);
    assert.equal(now.readiness,'draft',structure.id);
    same(now,direct,structure.id+' dispatch mismatch');
    same(current.content[tab],now,structure.id+' export mismatch');
    const {readiness,...learner}=now;
    same(api.bodyContent(structure,tab),learner,structure.id+' display mismatch');
    const topic=helper.spinalDiscUltrasoundTopics[bound.group];
    assert.equal(now.body,topic.body);
    same(now.citations,[...topic.citations]);
    assert(now.bullets.length>=topic.bullets.length+2);
    for(const bullet of topic.bullets)assert(now.bullets.includes(bullet));
    assert.match(now.bullets.join(' '),/numbering independently/);
    assert.match(now.bullets.join(' '),/not an acoustic window/);
    assert.match(now.note,/revision-bound radiologist review pending/);
    assert.match(now.note,/do not separately segment annulus, nucleus or endplates/);
    assert.match(now.note,/No sonograms, publisher text, diagnostic thresholds or procedural instructions imported/);
    assert.match(now.note,/Atlas, imaging-case and paid-lecture access remain independent/);
    for(const url of now.citations)assert.equal(new URL(url).protocol,'https:');
    expected.content[tab]=now;changed++;
  }
  same(current,expected,structure.id+' exported record changed elsewhere');
  assert.equal(current.validation.clinicalApproval,'not-included');
  assert.equal(current.validation.materialRevisions.imaging,null);
}
assert.equal(changed,19);assert.equal(unchanged,9917);assert.equal(changed+unchanged,9936);
for(const entry of priorDiscEntries)
  same(api.bodyLesson(entry.identity,'ultrasound'),parent.bodyLesson(entry.identity,'ultrasound'),
    entry.identity.fmaId+' existing ultrasound changed');

for(const entry of targetEntries){
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
  forged.topics.find(t=>t.tab==='ultrasound').body+=' foreign';
  assert.equal(await helper.parseBodyReviewResponse(forged,id),null);
  for(const item of now.topics){const {tab,...lesson}=item;same(lesson,api.bodyLesson(entry.identity,tab));}
  reviewBindings++;
  const mutations=[
    s=>s.id+='-foreign',s=>s.fmaId='FMA0',s=>s.name+=' foreign',
    s=>s.sourceName+='-foreign',s=>s.bundle+='-foreign',
    s=>s.sources[0].file='FJ3211',s=>s.sources[0].sha256='0'.repeat(64),
    s=>s.laterality='left',s=>s.category='bone',s=>s.system='skeleton',
    s=>s.sourceTree='partof',s=>s.coverageNote='foreign',
    s=>s.validation.anatomicalReview=true,s=>s.bounds.min[0]+=.01,
  ];
  for(const mutate of mutations){
    const bad=structuredClone(entry.identity);mutate(bad);
    assert.equal(helper.spinalDiscUltrasoundLesson(bad,'ultrasound'),undefined);
    rejected++;
  }
  const lesson=helper.spinalDiscUltrasoundLesson(entry.identity,'ultrasound');
  const pristine=structuredClone(lesson);
  lesson.bullets.push('foreign');lesson.citations.length=0;
  same(helper.spinalDiscUltrasoundLesson(entry.identity,'ultrasound'),pristine);
}
same(Object.fromEntries(Object.entries(helper.spinalDiscUltrasoundTopics).map(([group,topic])=>[group,topic.citations])),{
  cervicalDisc:['https://pubmed.ncbi.nlm.nih.gov/37813455/'],
  thoracicDisc:['https://pubmed.ncbi.nlm.nih.gov/22354105/'],
  lumbarDisc:['https://doi.org/10.1177/87564793211008342',
    'https://pieweb.med.utoronto.ca/OBAnesthesia/OBAnesthesia_content/OBA_spinalUltrasound_module.html'],
});
console.log(JSON.stringify({changed,unchanged,rejected,reviewBindings,pinsHash,
  sourceGeometryChanged:false,clinicalApproval:false,imagesImported:false}));
