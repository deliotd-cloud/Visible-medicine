import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional runtime binds the verified camera-resize and reassembly fixes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'aa290176f8bfdb02157f7197e4647508c9c41d87');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-explorer.tsx','2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0'],
    ['app/fitted-camera.tsx','5b645a3e14cc8792bdab2be9e5369d40add37005b53a6aa9b40dd39123fa96d9'],
  ]) assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  for(const message of ['Assembled anatomy · Increase separation to arrange in the tray','Non-anatomical positions · Overlap possible']) assert(runtime.includes(message));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[flag],false);
});
