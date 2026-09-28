import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional runtime binds the verified camera-resize and reassembly fixes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'77244671eaf419095f681bb284737c01ecfbf6bb');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-explorer.tsx','6349a0fa81cba0412ba60724a1e1d058ccdf310c3c7b00912c9951b98163a800'],
    ['app/fitted-camera.tsx','ff59cb133b53a6ea728dc0aa902a1530559e375a834ec5eb7d0d7b5509a73e5c'],
  ]) assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  for(const message of ['Assembled anatomy · Increase separation to arrange in the tray','Non-anatomical positions · Overlap possible']) assert(runtime.includes(message));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[flag],false);
});
