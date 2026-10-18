import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';

const sourceCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const expected=[
  ['vm:anatomy:body:shoulder-arm:left:bone:left-clavicle','e243715b1b28fcd42f2bc395f3b846f7a951fa074c47954a79a9c139796d4c48'],
  ['vm:anatomy:body:shoulder-arm:left:bone:left-humerus','41193493d9edcca238f6fbe0ee52e7bd3edee7e713b848a40020067cfc5760a6'],
  ['vm:anatomy:body:shoulder-arm:left:bone:left-scapula','2b6e04dc412204e9d7e6ec7f08397dacd9b17a3f4bbde75fb11b8f7cedfbd152'],
  ['vm:anatomy:body:pelvis:right:bone:right-hip-bone','1e675c63c0cac59d3d9b9f612f73e96e0e048ea74c17d551c0d0c76a84b21b5b'],
  ['vm:anatomy:body:pelvis:left:bone:left-hip-bone','d658aea16ee6f0dbcf43840db66bd79f73d089dc70ef9ec4b2a3851a07a56610'],
] as const;
const sourceHashes={
  'app/body-content.ts':'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f',
  'content/girdle-bone-ultrasound.ts':'055033a3486b6ce11643f9f8101337e9bc529aed6581ea31a2094a5f7139b855',
  'content/girdle-bone-ultrasound-pins.json':'70e96b85e050508f6d7d919a7055eef3a3cea3f813094cdcb961593e807a6850',
  'lib/girdle-bone-ultrasound.ts':'b42f6ccf57f032b983da3d6237371a08d1ce5c6c2118331fa884f4653967cf66',
} as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const jsonSha=(value:unknown)=>sha(JSON.stringify(JSON.parse(JSON.stringify(value))));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('five girdle ultrasound drafts reach exact-source body Review without inherited approval', {timeout:120000}, async()=>{
  const learnerBase='public/atlas-runtime/head-neck/';
  const learnerBytes=readFileSync(learnerBase+'manifest.json');
  const inputBytes=readFileSync(learnerBase+'source-inputs.json');
  assert.equal(sha(learnerBytes),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
  assert.equal(sha(inputBytes),'51810a1c996c188141fec6467dfd0ff2ef6d79062e0797908f63aeac49bd3579');
  const learner=JSON.parse(learnerBytes.toString()), inputs=JSON.parse(inputBytes.toString());
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(learner.sourceCommit,sourceCommit);
  assert.equal(review.revision,sourceCommit);
  assert.equal(learner.clinicalApproved,false);
  assert.equal(learner.patientDataIncluded,false);
  for(const [path,expectedHash] of Object.entries(sourceHashes)){
    const input=inputs.find((row:{path:string})=>row.path===path);
    const imported=review.files.find((row:{path:string})=>row.path===path);
    assert(input&&imported,path);
    assert.equal(input.sha256,expectedHash,path);
    assert.equal(imported.sourceSha256,expectedHash,path);
    assert.equal(sha(readFileSync('atlas-review/'+path)),imported.importedSha256,path);
    // These four files are copied without route/alias adaptations.
    assert.equal(imported.importedSha256,expectedHash,path);
  }
  const pins=JSON.parse(readFileSync('atlas-review/content/girdle-bone-ultrasound-pins.json','utf8'));
  assert.deepEqual(pins.entries.map((entry:{identity:{id:string}})=>entry.identity.id),expected.map(([id])=>id));
  const compiled=await build({stdin:{contents:[
    "export {bodyReviewMaterial,bodyReviewSnapshot} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {girdleBoneUltrasoundLesson} from './atlas-review/lib/girdle-bone-ultrasound';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const learnerJs=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
    const bytes=readFileSync(learnerBase+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const [id,lessonHash] of expected){
    const entry=pins.entries.find((row:{identity:{id:string}})=>row.identity.id===id);
    const material=await api.bodyReviewMaterial(id), snapshot=api.bodyReviewSnapshot(id);
    assert(entry&&material&&snapshot,id);
    assert.deepEqual(material.source.structure,entry.identity);
    const lesson=api.girdleBoneUltrasoundLesson(entry.identity,'ultrasound');
    assert(lesson,id);
    assert.equal(jsonSha(lesson),lessonHash,id);
    assert(learnerJs.includes(lesson.body),id+' learner text');
    assert.deepEqual(api.bodyLesson(entry.identity,'ultrasound'),lesson);
    const {readiness,...shown}=lesson;
    assert.equal(readiness,'draft');
    assert.deepEqual(api.bodyContent(entry.identity,'ultrasound'),shown);
    assert.deepEqual(snapshot.topics.find((row:{tab:string})=>row.tab==='ultrasound'),{tab:'ultrasound',...lesson});
    assert.deepEqual(material.topics.find((row:{tab:string})=>row.tab==='ultrasound'),{tab:'ultrasound',...lesson});
    assert.equal(material.status,'worksheet-not-submitted');
    assert.equal(material.approval,false);
    const context=await api.bodyReviewContext(id);
    assert.equal(context.teachingHash,material.fingerprints.teaching);
    assert.match(context.revisions.teaching,/^[a-f0-9]{64}$/);
    assert.equal(context.revisions.imaging,null);
    assert(context.blockers.imaging.length>0);
    assert.deepEqual(await api.parseBodyReviewResponse(wire(material),id),wire(material));
    const prior=wire(material);
    prior.topics[prior.topics.findIndex((row:{tab:string})=>row.tab==='ultrasound')]={tab:'ultrasound',...entry.previous};
    assert.equal(await api.parseBodyReviewResponse(prior,id),null,'prior pending topic cannot be replayed');
    for(const field of ['body','citation','source']){
      const altered=wire(material),topic=altered.topics.find((row:{tab:string})=>row.tab==='ultrasound');
      if(field==='body')topic.body+=' foreign';
      else if(field==='citation')topic.citations[0]+='?foreign=1';
      else altered.source.structure.name+=' foreign';
      assert.equal(await api.parseBodyReviewResponse(altered,id),null,field);
    }
    assert.equal(api.girdleBoneUltrasoundLesson({...entry.identity,name:entry.identity.name+' foreign'},'ultrasound'),undefined);
  }
});
