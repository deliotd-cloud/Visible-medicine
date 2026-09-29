import assert from 'node:assert/strict';
import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('regional export binds the reviewed hand studies and MRI drafts without replacing models',()=>{
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  const sha=(b: string|Buffer)=>createHash('sha256').update(b).digest('hex');
  assert.equal(sha(bytes),'8b399ae000f66008c84e5d9e8101252dd4f53f50338fade8904fbb4d0227624e');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'1c3dca274a958a88d583989b769d4b05296622d8');
  assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,hash] of Object.entries({
    'content/hand-intrinsic-studies.ts':'52e2b0d6e28648493f16f9fffb2fa56b5d54f2889c76d866f22bb49041979b85',
    'lib/hand-intrinsic-studies.ts':'5cc77244b513326f9c219e1f26b9d5401d9128f77cd9f8e6433cca01b04dc76b',
    'content/distal-palmar-mri.ts':'174ad897535a6fbf3f56f66ce4781198bb26b19395cb70bbcad47acb209a8885',
    'content/shoulder-arterial-mri.ts':'e9ea55d29364250ae5aab7bcc77f6dec9a80de3cc26b2f3ceb085a3fd4e90d16',
    'app/body-explorer.tsx':'aa5eef6a1429f28243aaaab185bc29b54bbdd3aa06c4990cefc767126796dc30',
  }))assert.equal(inputs.find(f=>f.path===path)?.sha256,hash);
  const scripts=manifest.files.filter((f:{path:string})=>f.path.endsWith('.js')) as {path:string;sha256:string}[];
  const runtime=scripts.map(f=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return b.toString();}).join('\n');
  for(const label of ['hand-intrinsic-thenar-adductor','hand-intrinsic-interosseous-lumbrical','Full extent in View menu'])assert(runtime.includes(label));
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const priorModels=beforeHippocampi(inventory.models).filter((m:{sha256:string})=>m.sha256!=='4f431242839c255ae2320b4004c537a4c2defb7d0cd7b51fdea60f7ba3c09e8f'&&m.sha256!=='4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12');
  assert.equal(sha(JSON.stringify(priorModels)),'972cd41676713abf3aa458055783ce95bcfac41596bf5ec411911f9a1717aa10');
});
