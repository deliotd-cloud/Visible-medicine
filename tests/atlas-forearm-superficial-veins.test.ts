import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('regional export presents source-bound superficial forearm veins without clinical or imaging approval',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'e21d3f8a844ac1260ee9b272ce1f0fc2124911b24e5846b327bcada42289540b');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'facf4a46d8a9380c890af16495a2c609ad74f5f3');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'content/forearm-superficial-vein-runtime-pins.json':'cb864bdb2d08c8585091a9c7a0cad37392d8b7aff374910d16ea01478a0916e6',
    'content/forearm-superficial-vein-study.ts':'6ad60f58f4131df71d35580d086729b27c39cd4d2f0819a5464df43293960053',
    'lib/forearm-superficial-veins.ts':'07dde747d85a1a4fff95b1f19e62f4f1bc6a17c7696b91d60a842d9b6e499105',
    'lib/limb-vascular-studies.ts':'9338230911c7db7967b947ec5afade816bcad861e68cc15129e5b5487a49f63e',
  }))assert.equal(inputs.find(row=>row.path===path)?.sha256,expected,path);
  assert.ok(!inputs.some(row=>/native-mr|local-mr-study|\.vmmr/i.test(row.path)),'private native MRI checker excluded');

  const scripts=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'));
  const runtime=scripts.map(file=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return bytes.toString();
  }).join('\n');
  for(const phrase of [
    'Superficial forearm veins',
    'Choose Left or Right to simplify the view',
    'Their proximity does not establish a joined lumen',
    'this is not a venepuncture guide or patient registration',
    'Anatomical review is pending',
    'FMA13325','FMA13326','FMA22909','FMA22910',
    'FMA22964','FMA22965','FMA22968','FMA22969',
  ])assert.ok(runtime.includes(phrase),phrase);

  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,136);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,143);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
