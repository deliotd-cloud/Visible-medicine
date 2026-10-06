import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const revision='44e3807503af91a2cc32c74651584eb2139dcfff';
const targetId='vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta';
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');

test('aorta teaching input reaches learner and protected Review at the exact draft source',()=>{
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,revision);
  const source=review.files.find((row:any)=>row.path==='content/central-vessel-imaging.ts');
  assert(source);
  assert.equal(sha(readFileSync('atlas-review/'+source.path)),source.importedSha256);
  for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
    const root='public/atlas-runtime/'+name+'/';
    const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
    assert.equal(manifest.sourceCommit,revision);
    assert.equal(manifest.patientDataIncluded,false);
    assert.equal(manifest.clinicalApproved,false);
    if(name==='head-neck'||name==='shoulder'){
      const inputs=JSON.parse(readFileSync(root+'source-inputs.json','utf8'));
      assert.equal(inputs.find((row:any)=>row.path===source.path)?.sha256,source.sourceSha256);
    }
  }
  const viewer=JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json','utf8'));
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
});

test('actual aorta lesson and Review agree on conventions without approval or invented source identity',async()=>{
  const result=await build({stdin:{contents:`
    export {bodyLesson} from './atlas-review/app/body-content';
    export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
    export {centralVesselImagingLesson} from './atlas-review/lib/central-vessel-imaging';
    export {bodyReviewSnapshot,bodyReviewMaterial} from './atlas-review/lib/body-review-material';
    export {bodyReviewContext} from './atlas-review/lib/body-review-context';
    export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  const raw=JSON.parse(readFileSync('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json','utf8'));
  const structure=api.bodyDisplayCatalog(raw).structures.find((row:any)=>row.id===targetId);
  assert(structure);
  assert.equal(structure.fmaId,'FMA3789');
  assert.equal(structure.sources[0].file,'FJ1932');
  assert.equal(structure.sources[0].sha256,'c74d3742308c1f05ce9e85c4508d348e3debf57d4aab5bfbc42041d682d39e02');
  const lesson=api.bodyLesson(structure,'ultrasound');
  assert.equal(sha(JSON.stringify(lesson)),'958d0ae247bdcd128fcb61493208080306eedd171322752643a4aac7031723bb');
  assert.equal(lesson.readiness,'draft');
  assert.deepEqual(api.centralVesselImagingLesson(structure,'ultrasound'),lesson);
  assert.deepEqual(api.bodyReviewSnapshot(targetId).topics.find((row:any)=>row.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  const packet=await api.bodyReviewMaterial(targetId);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert(await api.parseBodyReviewResponse(packet,targetId));
  const transported=JSON.parse(JSON.stringify(packet));
  assert.deepEqual(await api.parseBodyReviewResponse(transported,targetId),transported);
  for(const field of ['body','citations']){
    const altered=structuredClone(packet);
    const topic=altered.topics.find((row:any)=>row.tab==='ultrasound');
    topic[field]=field==='body'?topic.body+' foreign':['https://example.invalid/foreign'];
    assert.equal(altered.materialHash,packet.materialHash,'Caller retains claimed fingerprint');
    assert.equal(await api.parseBodyReviewResponse(altered,targetId),null,'Altered current teaching rejects');
  }
  const context=await api.bodyReviewContext(targetId);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.revisions.imaging,null);
  for(const mutate of [(x:any)=>x.sources[0].sha256='foreign',(x:any)=>x.laterality='left']){
    const foreign=structuredClone(structure);mutate(foreign);
    assert.equal(api.centralVesselImagingLesson(foreign,'ultrasound'),undefined);
    assert.notDeepEqual(api.bodyLesson(foreign,'ultrasound'),lesson);
  }
});
