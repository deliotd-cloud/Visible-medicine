import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional runtime binds the verified camera-resize and reassembly fixes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'cdc6ad23ad5c3c13a2f6588019a057d0a063818f');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-explorer.tsx','2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0'],
    ['app/fitted-camera.tsx','9d13fb2b2c498fff6fae7944b4f6ed95d4563dc9d0e1653eed0cb716aa6743a0'],
  ]) assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  for(const message of ['Assembled anatomy · Increase separation to arrange in the tray','Non-anatomical positions · Overlap possible']) assert(runtime.includes(message));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[flag],false);
});
