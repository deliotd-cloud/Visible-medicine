import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery } from './current-atlas-delivery.mjs';
import { build } from './review-component-test-build.ts';

test('interactive reasoning reaches learner and protected review with source-bound answers', async () => {
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const learner=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));
  assert.equal(review.revision,CURRENT_ATLAS_REVISION);
  assert.equal(learner.sourceCommit,validateCurrentAtlasDelivery().runtimeSources['head-neck']);
  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
  for(const path of ['lib/reasoning-questions.ts','lib/thoracic-vessel-reasoning.ts','lib/atlas-practice.ts']) {
    const file=review.files.find((f:any)=>f.path===path);assert(file);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
    const sourceRoot=currentAtlasDeliveryRoot();
    const historical=execFileSync('git',['-C',sourceRoot,'show','9fba9a1e24b6669aafd48e945d55fc0939d50ab2:'+path],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    const current=execFileSync('git',['-C',sourceRoot,'show',review.revision+':'+path],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.deepEqual(current,historical,path+' retains exact 9f reasoning source bytes');
    assert.equal(file.sourceSha256,createHash('sha256').update(current).digest('hex'));
  }
  const result=await build({stdin:{contents:`
    export * from './atlas-review/lib/body-review-material';
    export * from './atlas-review/lib/body-review-response';
    export * from './atlas-review/lib/body-review-context';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  let count=0;
  const abdominalKeys:string[]=[];
  for(const row of api.bodyReviewSummaries.filter((s:any)=>s.system==='vessels' && s.regions.includes('thorax'))) {
    const packet=await api.bodyReviewMaterial(row.id);
    assert((await api.parseBodyReviewResponse(packet,row.id)));
    assert.equal(packet.schema,'vm-body-review-worksheet-3');
    assert.equal(packet.approval,false);
    if(!packet.reasoning) continue;
    count++;
    assert.equal(packet.reasoning.answerId,row.id);
    const key=packet.reasoning.key;
    const abdominal=key.startsWith('abdominal-vessel-');
    if(abdominal)abdominalKeys.push(key);
    assert.equal(packet.reasoning.choices.length,abdominal?(row.id.includes(':midline:')?2:4):3);
    assert(packet.reasoning.choices.every((c:any)=>c.laterality===row.laterality));
    assert.equal(packet.reasoning.readiness,'draft');
    const context=await api.bodyReviewContext(row.id);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert.equal(context.revisions.imaging,null);
    assert(context.checklists.teaching.find((c:any)=>c.id==='assessment').label.includes('displayed source-specific'));
  }
  assert.equal(count,8);
  assert.deepEqual(abdominalKeys.sort(),['abdominal-vessel-abdominal-aorta','abdominal-vessel-inferior-vena-cava']);
  const dashboard=readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8');
  assert(dashboard.includes('Interactive reasoning'));
  assert(dashboard.includes('Exact choice sources & checksums'));
});
