import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('generated regional viewer exposes selected-entry Tray framing without widening access',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'a8a45649ba6d16d8bc510c8b971f8f440d78483106c6b79a54307a07aa757ee5');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'2d2f2b87232393e0b0d46bd6daba579d78939369');
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(input=>input.path==='app/body-explorer.tsx')?.sha256,
    '8d3cb2812b7f9cf84cf78a42a7c6d0b022165b6eafcc5565d41c0fa9428d245d');
  const file=(manifest.files as {path:string;sha256:string}[])
    .find(file=>file.path.startsWith('assets/index-')&&file.path.endsWith('.js'));
  assert.ok(file,'regional viewer bundle');
  const bytes=readFileSync(base+file.path);
  assert.equal(sha(bytes),file.sha256);
  const runtime=bytes.toString();
  assert.match(runtime,/===`tray`&&\w+&&\w+\.has\(\w+\).{0,150}"aria-label":\w+\?`Show full tray`:`Frame selected tray entry`/);
  assert.ok(runtime.includes('Show every entry in the tray'));
  assert.ok(runtime.includes('Zoom to the selected entry without hiding others'));
  assert.match(runtime,/onClick:\(\)=>\{\w+\(\w+=>!\w+\),\w+\(1\)\}/);
  assert.ok(runtime.includes('Selected entry framed · Others remain in the tray · Turn off Frame selection for the overview · Not anatomical positions'));

  const inventoryBytes=readFileSync('lib/atlas-model-inventory.json');
  assert.equal(sha(inventoryBytes),'827260afd8d72819bf1f1c247af5f415f1f6cefea9838d35edfad40d4c54b666');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.deepEqual(inventory.sources.find((source:{module:string})=>source.module==='head-neck'),{
    module:'head-neck',sourceCommit:manifest.sourceCommit,manifestSha256:sha(manifestBytes),modelPaths:135,
  });
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
