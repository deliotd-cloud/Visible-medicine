import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('all fourteen upper-arm reasoning selections reach matching learner and review revisions',async()=>{
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const learner=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));
  assert.equal(learner.sourceCommit,'d5ebe0712d71f4f352ebac679373f00b8d7d94e1');
  const path='lib/upper-arm-reasoning.ts';
  const input=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8')).find((r:any)=>r.path===path);
  const file=review.files.find((r:any)=>r.path===path);assert(file&&input);
  assert.equal(input.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
  const compiled=await build({stdin:{contents:`
    export * from './atlas-review/lib/body-review-material';
    export * from './atlas-review/lib/body-review-response';
    export * from './atlas-review/lib/body-review-context';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const keys=new Map<string,Set<string>>();
  for(const row of api.bodyReviewSummaries.filter((r:any)=>r.system==='muscles'&&r.regions.includes('shoulder-arm'))){
    const packet=await api.bodyReviewMaterial(row.id);
    if(!packet.reasoning?.key.startsWith('upper-arm-'))continue;
    assert((await api.parseBodyReviewResponse(packet,row.id)));
    assert.equal(packet.approval,false);
    assert.equal(packet.reasoning.readiness,'draft');
    assert.equal(packet.reasoning.answerId,row.id);
    assert.equal(packet.reasoning.choices.length,4);
    assert(packet.reasoning.choices.every((c:any)=>c.laterality===row.laterality));
    assert.equal(packet.reasoning.references.length,1);
    const context=await api.bodyReviewContext(row.id);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert(context.checklists.teaching.some((c:any)=>c.id==='assessment'));
    const sides=keys.get(packet.reasoning.key)??new Set<string>();
    assert(!sides.has(row.laterality));sides.add(row.laterality);keys.set(packet.reasoning.key,sides);
  }
  assert.deepEqual([...keys.keys()].sort(),['anconeus','biceps-short','triceps-medial','triceps-lateral','levator-scapulae','rhomboid-major','rhomboid-minor'].map(k=>'upper-arm-'+k).sort());
  for(const sides of keys.values())assert.deepEqual([...sides].sort(),['left','right']);
});
