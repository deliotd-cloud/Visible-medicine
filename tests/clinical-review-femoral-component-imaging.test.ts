import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('femoral component imaging shares exact learner/review content without acquired-image approval',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,'11ba63422686e0f8666bf18769c67485dc518d19');
 for(const path of ['content/femoral-component-teaching.ts','content/femoral-component-teaching-bindings.v1.json','lib/femoral-components.ts']) {
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/femoral-components'; export * from './atlas-review/lib/nested-teaching'; export * from './atlas-review/lib/nested-review-material';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 let placements=0;
 const expected:Record<string,string>={ct:'36512153',mri:'27446322',ultrasound:'29481406'};
 for(const parent of api.femoralComponentCatalog.parents){
  const group=api.nestedReviewRows.find((g:any)=>g.study==='femoral-components'&&g.parentId===parent.id);assert(group);
  for(const part of api.femoralComponentsFor(parent)){
   const packet=await api.nestedReviewMaterial(group.key,part.id);assert(packet);
   const concept=api.nestedTeachingFor(parent,'femoral-components',part);
   assert.deepEqual(packet.teaching.concept,concept);
   assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length>0);
   for(const [topic,pmid] of Object.entries(expected)){
    const lesson=api.nestedTopicLesson(concept,topic);
    const record=packet.teaching.topics.find((t:any)=>t.tab===topic);
    assert.equal(record.body,lesson.body);assert.equal(record.readiness,lesson.readiness);
    if(part.role==='remainder'){assert.equal(lesson.readiness,'pending');continue;}
    placements++;assert.equal(lesson.readiness,'draft');
    assert.deepEqual(record.references,[`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`]);
    assert.match(record.note,/No scan access or synchronization/);
   }
   assert.equal(api.nestedTopicLesson(concept,'xray').readiness,'pending');
   assert.equal(await api.nestedReviewSelection(group.key,part.id,'0'.repeat(64)),null);
  }
 }
 assert.equal(placements,6);
});
