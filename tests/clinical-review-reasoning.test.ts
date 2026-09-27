import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('interactive reasoning reaches learner and protected review with source-bound answers', async () => {
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const learner=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));
  assert.equal(review.revision,'6b1539f9de931cfcae0492278a04d90955974844');
  assert.equal(learner.sourceCommit,review.revision);
  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
  for(const path of ['lib/reasoning-questions.ts','lib/thoracic-vessel-reasoning.ts','lib/atlas-practice.ts']) {
    const file=review.files.find((f:any)=>f.path===path);assert(file);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
  }
  const result=await build({stdin:{contents:`
    export * from './atlas-review/lib/body-review-material';
    export * from './atlas-review/lib/body-review-response';
    export * from './atlas-review/lib/body-review-context';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  let count=0;
  for(const row of api.bodyReviewSummaries.filter((s:any)=>s.system==='vessels' && s.regions.includes('thorax'))) {
    const packet=await api.bodyReviewMaterial(row.id);
    assert(api.parseBodyReviewResponse(packet,row.id));
    assert.equal(packet.schema,'vm-body-review-worksheet-2');
    assert.equal(packet.approval,false);
    if(!packet.reasoning) continue;
    count++;
    assert.equal(packet.reasoning.answerId,row.id);
    assert.equal(packet.reasoning.choices.length,3);
    assert(packet.reasoning.choices.every((c:any)=>c.laterality===row.laterality));
    assert.equal(packet.reasoning.readiness,'draft');
    const context=await api.bodyReviewContext(row.id);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert.equal(context.revisions.imaging,null);
    assert(context.checklists.teaching.find((c:any)=>c.id==='assessment').label.includes('displayed source-specific'));
  }
  assert.equal(count,6);
  const dashboard=readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8');
  assert(dashboard.includes('Interactive reasoning'));
  assert(dashboard.includes('Exact choice sources & checksums'));
});
