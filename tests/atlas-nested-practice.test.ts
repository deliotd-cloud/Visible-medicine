import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

test('regional practice export preserves every model and binds the tested source-identification implementation', () => {
  const base = 'public/atlas-runtime/head-neck/';
  const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
  const bytes = readFileSync(base + 'manifest.json');
  assert.equal(sha(bytes), '16d1648f505c12cc8896e02461ff0bea5aea09afeb7b147d14975597a712ef57');
  const manifest = JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit, 'ab3e884bd28c9d112bfd7300d429891a3c1d1d36');
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  assert.equal(manifest.imagingConnection, false);
  assert.equal(manifest.standaloneReviewConnection, false);
  assert.equal(manifest.regionalScopes.length, 12);
  const inputs = JSON.parse(readFileSync(base + 'source-inputs.json', 'utf8')) as {path:string;sha256:string}[];
  for (const [path, hash] of Object.entries({
    'app/atlas-workspace.tsx': 'ee177772777f18e2db5ed8ab5c30448ace5e07fa1adab4e7f6515c6907605110',
    'app/dissection-controls.tsx': '520127bb748b4c8e2e1cd05f7e97937d73d86a8add37f8023315bbb214330e6d',
    'app/nested-practice.tsx': '37917409e0021403ffd4ed7fa92b3371af250e31b1411abbf697644610bf8c5e',
    'app/nested-practice.css': '8e0c687cecb73a74e65f6a574ad0858237d9f61680732eafb140c760779f1591',
    'lib/nested-practice.ts': '6e21a6dc48dc026110e76138d3705f8b5a94146df3b48767d31275c5bf04ce82',
    'app/ventricles.tsx': '08a2c1cd5d64cb9072d8fe80f2d95a40a7eb0611a2071043db45bc4a8f6f7ed0',
  })) assert.equal(inputs.find(f => f.path === path)?.sha256, hash);
  const runtime = manifest.files.filter((f:{path:string}) => f.path.endsWith('.js')).map((f:{path:string;sha256:string}) => {
    const data = readFileSync(base + f.path); assert.equal(sha(data), f.sha256); return data.toString();
  }).join('\n');
  for (const text of ['Practice identification', 'Separate overlapping structures', 'Restore anatomical positions', 'Restore all branch types before starting practice.']) assert(runtime.includes(text), text);
  assert(runtime.includes('Enabled by the current layers and system filters; models may still be loading or unavailable.'));
  const prior = JSON.parse(execFileSync('git', ['show', 'b4514b336868b7cedca25f33b61ed428355c4726:lib/atlas-model-inventory.json'], {encoding:'utf8'}));
  const current = JSON.parse(readFileSync('lib/atlas-model-inventory.json', 'utf8'));
  assert.deepEqual(beforeHippocampi(current.models).filter((m:{sha256:string})=>m.sha256!=='4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12'), prior.models);
  assert.equal(current.models.length, 137);
  assert.equal(current.models.flatMap((m:{paths:string[]}) => m.paths).length, 144);
  assert.deepEqual(current.sources.filter((s:{module:string}) => s.module !== 'head-neck'), nonregionalAtlasSources);
});
