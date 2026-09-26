import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('generated regional viewer exposes selected-entry Tray framing without widening access',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'4dbcbdec13fbdd0bb7549297e2b17f25fdd51810c9c9d4b8938e59e36a6e8f40');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'36c53fb9e19fca1c7e579f79d6d4807e4778ac19');
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(input=>input.path==='app/body-explorer.tsx')?.sha256,
    'a4cdbd814df2ee08a4fc158e70d377c378f4e2849870d8ffb7d89d0894658e09');
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
  assert.equal(sha(inventoryBytes),'963b47c9c2736dfdec60ab387939e9890c0b6eddd72d42f2644ae38e4f889d09');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.deepEqual(inventory.sources.find((source:{module:string})=>source.module==='head-neck'),{
    module:'head-neck',sourceCommit:manifest.sourceCommit,manifestSha256:sha(manifestBytes),modelPaths:135,
  });
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
