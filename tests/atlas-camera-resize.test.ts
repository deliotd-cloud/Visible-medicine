import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional runtime binds the verified camera-resize and reassembly fixes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'541bc971918daa421a835e0d9ee45d332a3e6da8');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-explorer.tsx','82baa2c48a9c1bcada70f1e3b615668ef9432b75120253895558b76a3e676867'],
    ['app/fitted-camera.tsx','572ffa7075bc3c2d5b98d7d8e88e1c558b35601d99bfe859529e99452738f10e'],
  ]) assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  for(const message of ['Assembled anatomy · Increase separation to arrange in the tray','Non-anatomical positions · Overlap possible']) assert(runtime.includes(message));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[flag],false);
});
