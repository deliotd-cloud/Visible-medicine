import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { build } from './workspace-test-build.mjs';

// Installed in atlas/scripts. Compare the current authored source with the
// exact prior revision, while resolving every other module from this checkout.
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = '7b2e5accf8538f3ffef396f95b0a206b06a76c1b';
const baselineHash = 'ad6404871498f39639a478eef5a17c6abe8395e7351d2a6c8595606d2533b68d';
const candidateHash = '8e833459d5b893ae94835b50e0e041d216f5467acc46a5ead13583e0ab7dd117';
const contentPath = 'content/cricothyroid-teaching.ts';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

const prior = execFileSync('git', ['-C', root, 'show', `${baseline}:${contentPath}`], { maxBuffer: 32e6 });
const current = await readFile(resolve(root, contentPath));
assert.equal(hash(prior), baselineHash, 'Exact baseline source identity');
assert.equal(hash(current), candidateHash, 'Exact proposed source is staged in this checkout');

async function load(overlay) {
  const built = await build({
    stdin: {
      contents: `export { nestedTeachingFor, nestedTopicLesson } from './lib/nested-teaching.ts';
        export { nestedReviewRows, nestedReviewMaterial, nestedReviewSelection } from './lib/nested-review-material.ts';`,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    plugins: overlay ? [{
      name: 'exact-baseline-cricothyroid-source',
      setup(api) {
        api.onLoad({ filter: /[/\\]content[/\\]cricothyroid-teaching\.ts$/, namespace: 'workspace-test' },
          () => ({ contents: prior.toString('utf8'), loader: 'ts' }));
      },
    }] : [],
  });
  const source = built.outputFiles[0].text;
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}

const before = await load(true);
const after = await load(false);
const tabs = ['anatomy', 'function', 'clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound', 'quiz'];
const citationUrls = ['https://pubmed.ncbi.nlm.nih.gov/26602419/', 'https://pubmed.ncbi.nlm.nih.gov/20040778/'];
const bindings = (await Promise.all([
  'nested', 'femoral-component', 'mca-source', 'pica-source',
].map(async name => JSON.parse(await readFile(resolve(root, `content/${name}-teaching-bindings.v1.json`), 'utf8')))));
let changed = 0;
let unchanged = 0;
let identityRefusals = 0;
const admittedIds = [];

for (const pins of bindings) {
  for (const binding of pins.bindings) {
    const parent = pins.parents.find(item => item.id === binding.parentId);
    assert(parent, `Missing pinned parent for ${binding.structure.id}`);
    const selected = binding.structure;
    const old = before.nestedTeachingFor(parent, binding.study, selected);
    const next = after.nestedTeachingFor(parent, binding.study, selected);
    assert(old && next, `Real resolver must admit ${selected.id}`);
    for (const tab of tabs) {
      const a = before.nestedTopicLesson(old, tab);
      const b = after.nestedTopicLesson(next, tab);
      if (binding.study === 'cricothyroid' && tab === 'ultrasound') {
        assert.equal(a.readiness, 'pending');
        assert.equal(b.readiness, 'draft');
        assert.equal(b.body, next.imaging.ultrasound.body);
        assert.deepEqual(b.citations, citationUrls);
        assert.match(b.note, /specialist review pending/);
        admittedIds.push(selected.id);
        changed++;
      } else {
        assert.deepEqual(b, a, `${selected.id}: ${tab} changed unexpectedly`);
        unchanged++;
      }
    }
    if (binding.study === 'cricothyroid') {
      for (const [p, s] of [
        [{ ...parent, name: parent.name + ' stale' }, selected],
        [parent, { ...selected, fmaId: 'FMA0' }],
        [parent, { ...selected, id: selected.id + '-stale' }],
      ]) {
        assert.equal(after.nestedTeachingFor(p, binding.study, s), null);
        identityRefusals++;
      }
    }
  }
}
assert.equal(changed, 4, 'Exactly four new ultrasound lessons');
assert.equal(unchanged, 968, 'Every other bound tab retained');
assert.equal(identityRefusals, 12);
assert.equal(new Set(admittedIds).size, 4);

assert.deepEqual(after.nestedReviewRows, before.nestedReviewRows, 'Review queue and selections stay bound');
let packets = 0;
let changedPackets = 0;
for (const row of after.nestedReviewRows) {
  for (const surface of row.surfaces) {
    const a = await before.nestedReviewMaterial(row.key, surface.id);
    const b = await after.nestedReviewMaterial(row.key, surface.id);
    assert(a && b, `Review packet missing for ${surface.id}`);
    packets++;
    if (row.study !== 'cricothyroid') {
      assert.deepEqual(b, a, `Unrelated Review packet changed: ${surface.id}`);
      continue;
    }
    assert(admittedIds.includes(surface.id), `Unexpected cricothyroid packet ${surface.id}`);
    changedPackets++;
    assert.deepEqual(b.source, a.source, 'Geometry and source payload retained');
    assert.deepEqual(b.atlasLink, a.atlasLink, 'Exact source link retained');
    assert.equal(b.context.sourceHash, a.context.sourceHash);
    assert.equal(b.context.sourceFrame, a.context.sourceFrame);
    assert.equal(b.context.rendererHash, a.context.rendererHash);
    assert.equal(b.context.revisions.geometry, a.context.revisions.geometry);
    assert.equal(a.context.revisions.imaging, null);
    assert.equal(b.context.revisions.imaging, null);
    assert.notEqual(b.context.revisions.teaching, a.context.revisions.teaching);
    assert.notEqual(b.context.teachingHash, a.context.teachingHash);
    assert.notEqual(b.context.materialHash, a.context.materialHash);
    assert.deepEqual(b.context.checklists, a.context.checklists);
    assert.deepEqual(b.context.blockers, a.context.blockers);
    assert(!a.context.teachingTabs.includes('ultrasound'));
    assert(b.context.teachingTabs.includes('ultrasound'));
    assert.deepEqual(b.context.teachingTabs.filter(tab => tab !== 'ultrasound'), a.context.teachingTabs);
    const oldTopic = a.teaching.topics.find(item => item.tab === 'ultrasound');
    const newTopic = b.teaching.topics.find(item => item.tab === 'ultrasound');
    assert.equal(oldTopic.readiness, 'pending');
    assert.equal(newTopic.readiness, 'draft');
    assert.deepEqual(newTopic.references, citationUrls);
    for (const item of a.teaching.topics.filter(item => item.tab !== 'ultrasound'))
      assert.deepEqual(b.teaching.topics.find(nextItem => nextItem.tab === item.tab), item);
    assert.deepEqual(await after.nestedReviewSelection(row.key, surface.id, a.context.sourceHash), b);
    assert.equal(await after.nestedReviewSelection(row.key, surface.id, '0'.repeat(64)), null);
  }
}
assert.equal(packets, 108, 'All nested Review packets were compared');
assert.equal(changedPackets, 4, 'Only four Review teaching packets changed');
assert.equal(hash(await readFile(resolve(root, contentPath))), candidateHash, 'Test leaves authored source untouched');
console.log(JSON.stringify({ passed: true, baseline, changedLessons: changed, unchangedLessons: unchanged,
  identityRefusals, reviewPackets: packets, changedReviewPackets: changedPackets,
  isolatedTeachingComparisonWithCurrentRenderer: true, geometrySourceUnchanged: true, changedTeachingRevision: true, imagingRevision: null,
  clinicalApproval: false }));
