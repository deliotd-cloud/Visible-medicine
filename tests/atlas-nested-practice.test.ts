import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

test('regional practice export preserves every model and binds the tested named-space implementation', () => {
  const base = 'public/atlas-runtime/head-neck/';
  const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
  const bytes = readFileSync(base + 'manifest.json');
  assert.equal(sha(bytes), 'df2ee985c5403e42543d457960bf973de713d5f3ca1d4358c3aaf5ed81d92a05');
  const manifest = JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit, '9b9a1ffca58eb9f921354eccbebeabcb9965d556');
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  assert.equal(manifest.imagingConnection, false);
  assert.equal(manifest.standaloneReviewConnection, false);
  assert.equal(manifest.regionalScopes.length, 12);
  const inputs = JSON.parse(readFileSync(base + 'source-inputs.json', 'utf8')) as {path:string;sha256:string}[];
  for (const [path, hash] of Object.entries({
    'app/atlas-workspace.tsx': 'a0655723c65162737065b13e10ce6bb0d9790eead79ae5f44433acdc812117fe',
    'app/dissection-controls.tsx': '520127bb748b4c8e2e1cd05f7e97937d73d86a8add37f8023315bbb214330e6d',
    'app/nested-practice.tsx': '84d0e01eb8aa81a7c045b243b4bd426ca898a27dbf0070cf8cb9e73e0eb590a7',
    'app/nested-practice.css': '8e0c687cecb73a74e65f6a574ad0858237d9f61680732eafb140c760779f1591',
    'lib/nested-practice.ts': 'e61db487c33d4c8aaeb737e0122b376abeb5f5bb4df49d99370285eb85d65a82',
    'app/ventricles.tsx': '76edb842c6899ec10354ec032356640ca2fc1500c89183bd41ce4dd02cb35046',
  })) assert.equal(inputs.find(f => f.path === path)?.sha256, hash);
  const runtime = manifest.files.filter((f:{path:string}) => f.path.endsWith('.js')).map((f:{path:string;sha256:string}) => {
    const data = readFileSync(base + f.path); assert.equal(sha(data), f.sha256); return data.toString();
  }).join('\n');
  for (const text of ['Find the named space', 'Name the isolated space', 'Practice identification']) assert(runtime.includes(text), text);
  assert(runtime.includes('Enabled by the current layers and system filters; models may still be loading or unavailable.'));
  const prior = JSON.parse(execFileSync('git', ['show', 'b4514b336868b7cedca25f33b61ed428355c4726:lib/atlas-model-inventory.json'], {encoding:'utf8'}));
  const current = JSON.parse(readFileSync('lib/atlas-model-inventory.json', 'utf8'));
  assert.deepEqual(current.models, prior.models);
  assert.equal(current.models.length, 135);
  assert.equal(current.models.flatMap((m:{paths:string[]}) => m.paths).length, 142);
  assert.deepEqual(current.sources.filter((s:{module:string}) => s.module !== 'head-neck'), prior.sources.filter((s:{module:string}) => s.module !== 'head-neck'));
});
