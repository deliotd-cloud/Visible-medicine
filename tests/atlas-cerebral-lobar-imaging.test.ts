import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('paired cerebral CT/MRI drafts reach learner and exact review worksheets without changing source anatomy',async()=>{
  const revision='08b0fbda394c7a878a3b5474e8aa566b8dfb0b83';
  const base='c73aeae9b5f0b21091a97612d9ed54f3dd549c8e';
  const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
  const prior=(p:string)=>JSON.parse(execFileSync('git',['show',base+':'+p],{encoding:'utf8'}));
  const sha=(s:Uint8Array|string)=>createHash('sha256').update(s).digest('hex');
  const learner=json('public/atlas-runtime/head-neck/manifest.json');
  const review=json('atlas-review/manifest.json');
  assert.equal(learner.sourceCommit,revision);assert.equal(review.revision,'08b0fbda394c7a878a3b5474e8aa566b8dfb0b83');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['content/cerebral-lobar-imaging.ts','content/nested-teaching.ts']){
    const source=review.files.find((f:any)=>f.path===path);assert(source);
    assert.equal(source.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256);
    assert.equal(source.importedSha256,sha(readFileSync('atlas-review/'+path)));
  }
  assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
  assert.deepEqual(learner.regionalScopes,prior('public/atlas-runtime/head-neck/manifest.json').regionalScopes);
  for(const path of ['atlas-review/content/nested-review-bindings.json','atlas-review/content/nested-teaching-bindings.v1.json'])assert.deepEqual(json(path),prior(path));
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
  const built=await build({stdin:{contents:`
    export {nestedReviewRows,nestedReviewMaterial,nestedReviewSelection} from './atlas-review/lib/nested-review-material';
    export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';
    export {clinicalReviewReturn} from './lib/clinical-review-return';
    export {reviewModelHref} from './lib/clinical-review-links';
    export {nestedApprovalProblems,blankNestedReview} from './atlas-review/lib/nested-review';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64')).catch(e=>{e.stack=e.message;throw e;});
  const group=api.nestedReviewRows.find((g:any)=>g.study==='cerebral');assert(group);
  const landmarks={frontal:/precentral gyrus/,parietal:/postcentral gyrus/,temporal:/Sylvian fissure/,occipital:/calcarine sulcus/};
  let count=0;
  for(const [lobe,landmark] of Object.entries(landmarks))for(const side of ['left','right']){
    const id=`vm:anatomy:body:head-neck:${side}:organ:${side}-${lobe}-lobe`;
    const packet=await api.nestedReviewMaterial(group.key,id);assert(packet,id);count++;
    assert.equal(packet.teaching.concept.id,'cerebral-'+lobe);
    for(const topic of ['ct','mri']){
      const lesson=packet.teaching.topics.find((t:any)=>t.tab===topic);
      assert.equal(lesson.readiness,'draft');assert(lesson.references.length>0);
      assert.match(lesson.note,/specialist review pending/);
      if(topic==='mri')assert.match(lesson.body,landmark);
    }
    for(const topic of ['xray','ultrasound'])assert.equal(packet.teaching.topics.find((t:any)=>t.tab===topic).readiness,'pending');
    assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length>0);
    for(const track of ['geometry','teaching','imaging'])assert(api.nestedApprovalProblems(api.blankNestedReview(packet.context,track),packet.context,track).length);
    assert.equal(await api.nestedReviewSelection(group.key,id,'0'.repeat(64)),null);
    const entry=api.clinicalReviewEntries.find((e:any)=>e.scope==='nested'&&e.id===id);assert(entry);
    const query=Object.fromEntries(new URL(api.reviewModelHref(packet.atlasLink),'https://review.test').searchParams);
    assert.deepEqual(await api.clinicalReviewReturn(query),{href:entry.href,name:entry.name});
  }
  assert.equal(count,8);
});
