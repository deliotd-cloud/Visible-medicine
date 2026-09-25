import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional runtime binds the verified camera-resize and reassembly fixes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'0cdca340b7a4b67b387389a0fa794e5d36d547e7');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-explorer.tsx','1a24c0ece43111d220f385d2b730c580b34eb161e3c4622aa3a8705ba82350be'],
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
