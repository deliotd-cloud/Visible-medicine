import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';

const sourceCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourceFiles={
  'content/internal-iliac-ultrasound.ts':'f5d7c5ca8fe2439501494cf9de890d915b61d8096c7ce8e4cad7aee4dfc7411f',
  'lib/internal-iliac-ultrasound.ts':'fd66f9bc4260e7548313a1398b451f203e591599ea7987b193154a1d92d4dc7f',
} as const;
const expected={
  FMA18809:{id:'vm:anatomy:body:pelvis:right:vessel:right-internal-iliac-artery',name:'Right internal iliac artery',laterality:'right',file:'FJ3569',sha256:'bc5922d28b6f5d9f67722396283ea7ef10cd3baa8ed0a8271faa8c11ca96d52a'},
  FMA18810:{id:'vm:anatomy:body:pelvis:left:vessel:left-internal-iliac-artery',name:'Left internal iliac artery',laterality:'left',file:'FJ3468',sha256:'2effa517c9d8b549b5a6b9e0ffe0326a99b03cb3d7ca58f4b1d338ce80f1d5e0'},
} as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('imported internal iliac ultrasound drafts retain exact source, Review and learner bindings',async()=>{
  const currentRevision=admitPreservedClinicalReview({revision:sourceCommit,sourceHashes:sourceFiles,learnerModules:['head-neck']});
  const review=json('atlas-review/manifest.json');
  const learner=json('public/atlas-runtime/head-neck/manifest.json');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  const pins=json('atlas-review/content/iliac-arterial-imaging-pins.json');
  assert.equal(review.revision,currentRevision);
  assert.equal(learner.sourceCommit,currentRevision);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  for(const [path,digest] of Object.entries(sourceFiles)){
    const imported=review.files.find((file:{path:string})=>file.path===path);
    const input=inputs.find((file:{path:string})=>file.path===path);
    assert(imported&&input,path);
    assert.equal(imported.sourceSha256,digest,path);
    assert.equal(imported.importedSha256,digest,path);
    assert.equal(input.sha256,digest,path);
    assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  }
  const selected=pins.entries.filter((entry:{identity:{fmaId:string}})=>Object.hasOwn(expected,entry.identity.fmaId));
  assert.deepEqual(selected.map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId),['FMA18809','FMA18810']);
  for(const {identity} of selected){
    const bound=expected[identity.fmaId as keyof typeof expected];
    assert.equal(identity.id,bound.id);
    assert.equal(identity.name,bound.name);
    assert.equal(identity.region,'pelvis');
    assert.equal(identity.laterality,bound.laterality);
    assert.equal(identity.bundle,'pelvis-vessels-recovery');
    assert.equal(identity.nodeName,identity.fmaId);
    assert.deepEqual(identity.sources,[{file:bound.file,sha256:bound.sha256}]);
  }
  const compiled=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {internalIliacUltrasoundLesson} from './atlas-review/lib/internal-iliac-ultrasound';",
    "export {internalIliacUltrasoundFacts,internalIliacUltrasoundReferences} from './atlas-review/content/internal-iliac-ultrasound';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.deepEqual(Object.keys(api.internalIliacUltrasoundFacts),['FMA18809','FMA18810']);
  assert.deepEqual(api.internalIliacUltrasoundReferences,[
    'https://jultrason.pl/artykul.php?a=258',
    'https://pubmed.ncbi.nlm.nih.gov/8544154/',
  ]);
  const runtime=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
    const bytes=readFileSync('public/atlas-runtime/head-neck/'+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const {identity} of selected){
    const lesson=api.bodyLesson(identity,'ultrasound');
    assert.deepEqual(lesson,api.internalIliacUltrasoundLesson(identity,'ultrasound'));
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ultrasound orientation · draft`);
    assert.equal(lesson.body,api.internalIliacUltrasoundFacts[identity.fmaId].body);
    assert(lesson.bullets.includes(api.internalIliacUltrasoundFacts[identity.fmaId].pitfall));
    assert.match(lesson.body,/acquired iliac ultrasound examination/i);
    assert.match(lesson.body,/when the vessel is visible/i);
    assert.match(lesson.bullets.join(' '),/Failure to see a segment is not proof of absence or occlusion/i);
    assert.match(lesson.note,/radiologist review pending/i);
    assert.match(lesson.note,/No acquired ultrasound study, Doppler data or patient-to-atlas registration/i);
    assert.match(lesson.note,/cannot establish flow, patency or diagnosis/i);
    for(const citation of api.internalIliacUltrasoundReferences)assert(lesson.citations.includes(citation));
    for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
      assert(runtime.includes(value),`${identity.id}: learner missing ${value}`);
    const packet=wire(await api.bodyReviewMaterial(identity.id));
    const context=await api.bodyReviewContext(identity.id);
    assert(packet&&context,identity.id);
    assert.equal(packet.approval,false);
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.deepEqual(packet.source.structure,identity);
    assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson});
    assert.equal(context.structureId,identity.id);
    assert.equal(context.materialHash,packet.materialHash);
    assert.equal(context.sourceHash,packet.fingerprints.source);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert.equal(context.revisions.imaging,null);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='ultrasound').body+=' foreign';},
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='ultrasound').citations[0]+='?foreign=1';},
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='ultrasound').note+=' foreign';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){
      const bad=wire(packet);mutate(bad);
      assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,identity.id);
    }
    for(const patch of [{name:'Foreign'},{fmaId:'FMA0'},{sources:[...identity.sources,...identity.sources]},{coverageNote:'Foreign'}])
      assert.equal(api.internalIliacUltrasoundLesson({...identity,...patch},'ultrasound'),undefined,identity.id);
  }
});
