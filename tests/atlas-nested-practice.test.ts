import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

test('regional practice export preserves every model and binds the tested named-space implementation', () => {
  const base = 'public/atlas-runtime/head-neck/';
  const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
  const bytes = readFileSync(base + 'manifest.json');
  assert.equal(sha(bytes), 'bc5bc1cecc0eee73b6c2f2cad4f5c5ea75a2bf83e65eadcafc5afacb5936a485');
  const manifest = JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit, 'd732f0b519f5e9a61fca4460cd6e57dc918d9755');
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  assert.equal(manifest.imagingConnection, false);
  assert.equal(manifest.standaloneReviewConnection, false);
  assert.equal(manifest.regionalScopes.length, 12);
  const inputs = JSON.parse(readFileSync(base + 'source-inputs.json', 'utf8')) as {path:string;sha256:string}[];
  for (const [path, hash] of Object.entries({
    'app/atlas-workspace.tsx': '0f0995358609a589e7f02a0911195419f206ba407a2cfa1d6a6d0d82b06dc24c',
    'app/dissection-controls.tsx': '520127bb748b4c8e2e1cd05f7e97937d73d86a8add37f8023315bbb214330e6d',
    'app/nested-practice.tsx': '84d0e01eb8aa81a7c045b243b4bd426ca898a27dbf0070cf8cb9e73e0eb590a7',
    'app/nested-practice.css': '8e0c687cecb73a74e65f6a574ad0858237d9f61680732eafb140c760779f1591',
    'lib/nested-practice.ts': 'e61db487c33d4c8aaeb737e0122b376abeb5f5bb4df49d99370285eb85d65a82',
    'app/ventricles.tsx': '56f6eba3b7f735be290f436958194b12cc5c0f4266c2c6d4ecbb879d84e4d405',
  })) assert.equal(inputs.find(f => f.path === path)?.sha256, hash);
  const runtime = manifest.files.filter((f:{path:string}) => f.path.endsWith('.js')).map((f:{path:string;sha256:string}) => {
    const data = readFileSync(base + f.path); assert.equal(sha(data), f.sha256); return data.toString();
  }).join('\n');
  for (const text of ['Find the named space', 'Name the isolated space', 'Practice identification']) assert(runtime.includes(text), text);
  assert(runtime.includes('Enabled by the current layers and system filters; models may still be loading or unavailable.'));
  const prior = JSON.parse(execFileSync('git', ['show', 'b4514b336868b7cedca25f33b61ed428355c4726:lib/atlas-model-inventory.json'], {encoding:'utf8'}));
  const current = JSON.parse(readFileSync('lib/atlas-model-inventory.json', 'utf8'));
  assert.deepEqual(current.models.filter((m:{sha256:string})=>m.sha256!=='4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12'), prior.models);
  assert.equal(current.models.length, 136);
  assert.equal(current.models.flatMap((m:{paths:string[]}) => m.paths).length, 143);
  assert.deepEqual(current.sources.filter((s:{module:string}) => s.module !== 'head-neck'), prior.sources.filter((s:{module:string}) => s.module !== 'head-neck'));
});
