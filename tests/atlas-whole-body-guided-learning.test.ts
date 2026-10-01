import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Delivery parity complements the Atlas actual-component event tests.
test('whole-body library delivers the tested selector and shared regional player',()=>{
  const root='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(root+'source-inputs.json','utf8'));
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'33566ee21aa65ed1a370a5e7653337048656a13e');
  for(const path of ['app/whole-body-guided-learning.tsx','app/whole-body-guided-learning.css','app/body-explorer.tsx','app/regional-guided-learning.tsx','lib/regional-tours.ts']){
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,
      review.files.find((f:any)=>f.path===path)?.sourceSha256,path);
    assert.ok(inputs.some((f:any)=>f.path===path),path+' must exist');
  }
  const source=readFileSync('atlas-review/app/whole-body-guided-learning.tsx','utf8');
  assert.ok(source.includes('key={`${tour.id}:${tour.revision}`}'));
  assert.ok(source.includes('options.some(t=>t.id===id)'));
  assert.ok(source.includes("wholeBodyTourOptions.filter(t=>t.region===region)"));
  assert.ok(source.includes('No guided tours are available for this region.'));
  assert.ok(source.includes('onExit={onExit}'));
  assert.ok(!/<iframe|window\.open|location\.(assign|href)/.test(source));
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{
    const bytes=readFileSync(root+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  assert.ok(js.includes('Guided tour library'));
  assert.ok(js.includes('whole-body-tour-picker'));
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection']) assert.equal(manifest[flag],false);
});
