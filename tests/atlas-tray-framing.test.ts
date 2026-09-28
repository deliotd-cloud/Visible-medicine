import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('generated regional viewer exposes selected-entry Tray framing without widening access',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'891d8c5548d56a67eb6585ee5b95bb361a71a7d632d83d83fbaa88ed77180352');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'beaa104c53e6aa62bb485febd1c47517b346de01');
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(input=>input.path==='app/body-explorer.tsx')?.sha256,
    'aa5eef6a1429f28243aaaab185bc29b54bbdd3aa06c4990cefc767126796dc30');
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
  assert.equal(sha(inventoryBytes),'2f417dc1b5458097783ea5f194f56252525568da14d52b47cd0661972f4ed38d');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.deepEqual(inventory.sources.find((source:{module:string})=>source.module==='head-neck'),{
    module:'head-neck',sourceCommit:manifest.sourceCommit,manifestSha256:sha(manifestBytes),modelPaths:135,
  });
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
