import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Delivery evidence only: Atlas actual-component tests establish answer behavior.
test('regional learner and review viewers ship the tested selectable-question source',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit,'973c73ecfc8b5f39adcb718faf476e56782466a9');
  assert.equal(review.revision,'973c73ecfc8b5f39adcb718faf476e56782466a9');
  for(const [path,sha256] of Object.entries({
    'app/atlas-workspace.tsx':'6ead6f8f9221666d3f6517e00220b2ecd4533746085674fbd13ae79463f64c46',
    'app/structure-quick-check.tsx':'4bfa6567af94f808bc7ed43a9693eae6771da7e8ada1e10183ec4be3ff64c5de',
    'app/structure-quick-check.css':'fb0ae0d036f91d13bd0d6a82c335159c1f3620c8d0301e63724f369c5e836942',
  })) {
    assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256,path);
    assert.equal(review.files.find((f:{path:string})=>f.path===path)?.sourceSha256,sha256,path+' review parity');
  }
  const js=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  for(const text of ['Quiz notes','Structure check','Check answer','Try again','Formative draft','cannot be marked']) assert(js.includes(text),text);
  for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[key],false);
});
