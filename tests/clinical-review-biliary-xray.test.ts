import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';

const sourceCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourceFiles={
  'content/biliary-duct-xray.ts':'8c1a5eb8a2e562915828658092bd9fb3f8bdd88f83e72c316e602223d8eb8873',
  'lib/biliary-duct-xray.ts':'48a4db0c5b477e1341f628c866fd6edc58b18a733c402a1cb2500973f8798ff9',
} as const;
const expected={
  FMA14539:{id:'vm:anatomy:body:abdomen:unpaired:organ:cystic-duct',name:'Cystic duct',file:'FJ3080',sha256:'8f7a2604f762392129842c1a7251be006b00bfe9211698d48d0e6dd2bd512d28'},
  FMA14668:{id:'vm:anatomy:body:abdomen:unpaired:organ:common-hepatic-duct',name:'Common hepatic duct',file:'FJ3079',sha256:'31a8cf303123987ddd1a3092b9a7c5ceb092fc10afce61193f40e1fe43af845f'},
} as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('imported biliary X-ray drafts retain exact source, Review and learner bindings',async()=>{
  const review=json('atlas-review/manifest.json');
  const learner=json('public/atlas-runtime/head-neck/manifest.json');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  const pins=json('atlas-review/content/thoracoabdominal-organ-imaging-pins.json');
  assert.equal(review.revision,sourceCommit);
  assert.equal(learner.sourceCommit,sourceCommit);
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
  assert.deepEqual(selected.map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId),['FMA14539','FMA14668']);
  for(const {identity} of selected){
    const bound=expected[identity.fmaId as keyof typeof expected];
    assert.equal(identity.id,bound.id);
    assert.equal(identity.name,bound.name);
    assert.equal(identity.region,'abdomen');
    assert.equal(identity.laterality,'unpaired');
    assert.equal(identity.bundle,'abdomen-organs-inventory');
    assert.equal(identity.nodeName,identity.fmaId);
    assert.deepEqual(identity.sources,[{file:bound.file,sha256:bound.sha256}]);
  }
  const compiled=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {biliaryDuctXrayLesson} from './atlas-review/lib/biliary-duct-xray';",
    "export {biliaryDuctXrayFacts,biliaryDuctXrayReferences} from './atlas-review/content/biliary-duct-xray';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.deepEqual(Object.keys(api.biliaryDuctXrayFacts),['FMA14539','FMA14668']);
  assert.deepEqual(api.biliaryDuctXrayReferences,[
    'https://www.radiologyinfo.org/en/info/biliary',
    'https://www.sages.org/publications/guidelines/clinical-spotlight-review-laparoscopic-common-bile-duct-exploration/',
  ]);
  const runtime=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
    const bytes=readFileSync('public/atlas-runtime/head-neck/'+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const {identity} of selected){
    const lesson=api.bodyLesson(identity,'xray');
    assert.deepEqual(lesson,api.biliaryDuctXrayLesson(identity,'xray'));
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · X-ray orientation · draft`);
    assert.equal(lesson.body,api.biliaryDuctXrayFacts[identity.fmaId].body);
    assert(lesson.bullets.includes(api.biliaryDuctXrayFacts[identity.fmaId].pitfall));
    assert.match(lesson.body,/contrast X-ray cholangiography/i);
    assert.match(lesson.body,/plain abdominal film does not normally delineate/i);
    assert.match(lesson.note,/review pending/i);
    assert.match(lesson.note,/No acquired imaging study/i);
    assert.match(lesson.note,/unregistered model/i);
    assert.match(lesson.note,/no patient-space correspondence, patency or diagnosis/i);
    for(const citation of api.biliaryDuctXrayReferences)assert(lesson.citations.includes(citation));
    for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
      assert(runtime.includes(value),`${identity.id}: learner missing ${value}`);
    const packet=wire(await api.bodyReviewMaterial(identity.id));
    const context=await api.bodyReviewContext(identity.id);
    assert(packet&&context,identity.id);
    assert.equal(packet.approval,false);
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.deepEqual(packet.source.structure,identity);
    assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='xray'),{tab:'xray',...lesson});
    assert.equal(context.structureId,identity.id);
    assert.equal(context.materialHash,packet.materialHash);
    assert.equal(context.sourceHash,packet.fingerprints.source);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert.equal(context.revisions.imaging,null);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').body+=' foreign';},
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').bullets[0]+=' foreign';},
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').note+=' foreign';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){
      const bad=wire(packet);mutate(bad);
      assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,identity.id);
    }
    for(const patch of [{name:'Foreign'},{fmaId:'FMA0'},{sources:[...identity.sources,...identity.sources]},{coverageNote:'Foreign'}])
      assert.equal(api.biliaryDuctXrayLesson({...identity,...patch},'xray'),undefined,identity.id);
  }
});
