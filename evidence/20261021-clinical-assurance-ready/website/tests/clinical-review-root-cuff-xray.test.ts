import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';

const sourceCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const baseline='707da881415d2d9dd763bc0de7e3cc04ceafdd56';
// SHA-256 of the exact git-show bytes at sourceCommit, independent of checkout line endings.
const sourceFiles={
  'content/root-cuff-xray-pins.json':'fb9ffb087b424b1c54af4990b51bece0a7859df5774d141ace044eadfbccc3f5',
  'content/root-cuff-xray.ts':'bb3d95f201b980175704cfcafa051b2aa585b48cec3bb74e6f5c0d9ac0242aeb',
  'lib/root-cuff-xray.ts':'55741c20c815f6c4a2a5a545187ad4af11b1b482b9af7fdf9ac87094c7e0d86d',
} as const;
const expected=[
  {family:'infraspinatus',fmaId:'FMA32547',id:'vm:anatomy:upper-limb:shoulder:right:muscle:infraspinatus',name:'Right infraspinatus muscle',laterality:'right',file:'FJ1500',sha256:'28f61376a3a88a28d14c44e1c20e9b7a34129772c130afa003daceac801455b1'},
  {family:'infraspinatus',fmaId:'FMA32548',id:'vm:anatomy:body:shoulder-arm:left:muscle:left-infraspinatus-muscle',name:'Left infraspinatus muscle',laterality:'left',file:'FJ1500M',sha256:'9013158a3c598eb6dbf95dcaf72da439721dec4d3ebc37f660db9c2748f1e42e'},
  {family:'subscapularis',fmaId:'FMA13414',id:'vm:anatomy:upper-limb:shoulder:right:muscle:subscapularis',name:'Right subscapularis',laterality:'right',file:'FJ1504',sha256:'fdcbfd01f93e2d24bd73f5cb259a311c9f9e90de08c41573439844eef5f605dd'},
  {family:'subscapularis',fmaId:'FMA13415',id:'vm:anatomy:body:shoulder-arm:left:muscle:left-subscapularis',name:'Left subscapularis',laterality:'left',file:'FJ1504M',sha256:'926fe07c8cf1056aa3aedda2f3a02a5027f4ef24cc5d41ba1359c53eedce1bc6'},
  {family:'supraspinatus',fmaId:'FMA32544',id:'vm:anatomy:upper-limb:shoulder:right:muscle:supraspinatus',name:'Right supraspinatus',laterality:'right',file:'FJ1506',sha256:'793771eceb64385269ddeeb09245e8c53b67499194f6fa98049b5e17aafa8e0c'},
  {family:'supraspinatus',fmaId:'FMA32545',id:'vm:anatomy:body:shoulder-arm:left:muscle:left-supraspinatus',name:'Left supraspinatus',laterality:'left',file:'FJ1506M',sha256:'6d6741ab840272a59d50c59cd87ccfa676e1f72fa9b600bba06bf9c24d1e01fe'},
  {family:'teresMinor',fmaId:'FMA32553',id:'vm:anatomy:upper-limb:shoulder:right:muscle:teres-minor',name:'Right teres minor',laterality:'right',file:'FJ1508',sha256:'f56e595b86cea659891664706cd4443acddd8dc69e4e5bb3855445eef302641a'},
  {family:'teresMinor',fmaId:'FMA32554',id:'vm:anatomy:body:shoulder-arm:left:muscle:left-teres-minor',name:'Left teres minor',laterality:'left',file:'FJ1508M',sha256:'4b07345bef6658a27bac6b2c7c2c52307bc769a804a80e7e657ce40e03427a17'},
] as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('imported root cuff X-ray drafts retain exact source, Review and learner bindings',async()=>{
  const currentRevision=admitPreservedClinicalReview({revision:sourceCommit,sourceHashes:sourceFiles,learnerModules:['head-neck']});
  const review=json('atlas-review/manifest.json');
  const learner=json('public/atlas-runtime/head-neck/manifest.json');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  const pins=json('atlas-review/content/root-cuff-xray-pins.json');
  assert.equal(review.revision,currentRevision);
  assert.equal(learner.sourceCommit,currentRevision);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  assert.equal(pins.baseline,baseline);
  for(const [path,digest] of Object.entries(sourceFiles)){
    const imported=review.files.find((file:{path:string})=>file.path===path);
    const input=inputs.find((file:{path:string})=>file.path===path);
    assert(imported&&input,path);
    assert.equal(imported.sourceSha256,digest,path);
    assert.equal(imported.importedSha256,digest,path);
    assert.equal(input.sha256,digest,path);
    assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  }
  assert.equal(pins.entries.length,8);
  assert.deepEqual(pins.entries.map((entry:{family:string;identity:{fmaId:string}})=>[entry.family,entry.identity.fmaId]),expected.map(({family,fmaId})=>[family,fmaId]));
  const compiled=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {rootCuffXrayLesson} from './atlas-review/lib/root-cuff-xray';",
    "export {rootCuffXrayFacts,rootCuffXrayLimitations,rootCuffXrayReferences} from './atlas-review/content/root-cuff-xray';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.deepEqual(Object.keys(api.rootCuffXrayFacts),['infraspinatus','subscapularis','supraspinatus','teresMinor']);
  assert.deepEqual(api.rootCuffXrayReferences,[
    'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
    'https://www.orthoinfo.org/diseases--conditions/rotator-cuff-tears',
  ]);
  const runtime=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
    const bytes=readFileSync('public/atlas-runtime/head-neck/'+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const [index,bound] of expected.entries()){
    const {family,identity,previous}=pins.entries[index];
    assert.equal(family,bound.family);
    assert.equal(identity.id,bound.id);
    assert.equal(identity.fmaId,bound.fmaId);
    assert.equal(identity.name,bound.name);
    assert.equal(identity.laterality,bound.laterality);
    assert.equal(identity.region,'shoulder-arm');
    assert.equal(identity.bundle,'shoulder-arm-muscles');
    assert.equal(identity.nodeName,bound.fmaId);
    assert.deepEqual(identity.sources,[{file:bound.file,sha256:bound.sha256}]);
    assert.equal(previous.readiness,'pending');
    const lesson=api.bodyLesson(identity,'xray');
    assert.deepEqual(lesson,api.rootCuffXrayLesson(identity,'xray'));
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${bound.name} · X-ray orientation · draft`);
    assert.equal(lesson.body,api.rootCuffXrayFacts[family].body);
    assert.deepEqual(lesson.bullets,[api.rootCuffXrayFacts[family].distinction,...api.rootCuffXrayLimitations]);
    assert.deepEqual(lesson.citations,api.rootCuffXrayReferences);
    assert.match(lesson.note,/Revision-bound radiologist review pending/);
    assert.match(lesson.note,/No acquired study, patient-to-atlas registration or diagnosis/);
    assert.match(lesson.note,/Atlas, imaging-case and lecture access remain independent/);
    for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
      assert(runtime.includes(value),`${bound.id}: learner missing ${value}`);
    const packet=wire(await api.bodyReviewMaterial(bound.id));
    const context=await api.bodyReviewContext(bound.id);
    assert(packet&&context,bound.id);
    assert.equal(packet.approval,false);
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.deepEqual(packet.source.structure,identity);
    assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='xray'),{tab:'xray',...lesson});
    assert.equal(context.structureId,bound.id);
    assert.equal(context.materialHash,packet.materialHash);
    assert.equal(context.sourceHash,packet.fingerprints.source);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert.equal(context.revisions.imaging,null);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,bound.id),packet);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').body+=' foreign';},
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').citations[0]+='?foreign=1';},
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').note+=' foreign';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){
      const bad=wire(packet);mutate(bad);
      assert.equal(await api.parseBodyReviewResponse(bad,bound.id),null,bound.id);
    }
    for(const patch of [{name:'Foreign'},{fmaId:'FMA0'},{sources:[...identity.sources,...identity.sources]},{bounds:{...identity.bounds,min:[0,0,0]}}])
      assert.equal(api.rootCuffXrayLesson({...identity,...patch},'xray'),undefined,bound.id);
  }
});
