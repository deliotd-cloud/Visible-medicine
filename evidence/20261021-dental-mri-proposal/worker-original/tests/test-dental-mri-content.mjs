import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const stage = new URL('../', import.meta.url);
const contentPath = new URL('content/dental-mri.ts', stage);
const sourcePath = 'F:/VisibleMedicine/atlas/lib/head-detail.ts';
const pendingPath = 'F:/VisibleMedicine/staging/20261021-head-teaching-selection/ALL_PENDING_CURRENT.log';
const require = createRequire(import.meta.url);
const { transform } = require('F:/VisibleMedicine/staging/20261020-combined-website-ui/website/node_modules/esbuild');
const source = await readFile(contentPath, 'utf8');
const built = await transform(source, { loader: 'ts', format: 'esm' });
const { dentalMriGroups, dentalMriTopics, dentalMriNote } = await import(
  `data:text/javascript;base64,${Buffer.from(built.code).toString('base64')}`
);
const expectedGroups = ['incisors', 'canines', 'premolars', 'molars'];
const expectedCounts = [8, 4, 8, 8];

test('four exact FMA groups match frozen source and pending MRI placements', async () => {
  const head = await readFile(sourcePath, 'utf8');
  const pending = JSON.parse(await readFile(pendingPath, 'utf8'));
  assert.equal(pending.evidence.sourceRevision, '485df97c2530e8e81a8d39a5ee61073ce76d93db');
  assert.deepEqual(Object.keys(dentalMriGroups), expectedGroups);
  const all = [];
  for (const [index, key] of expectedGroups.entries()) {
    const match = head.match(new RegExp(`id: '${key}',[\\s\\S]*?fmaIds: \\[([\\s\\S]*?)\\],`));
    assert.ok(match, `missing source group ${key}`);
    const sourceIds = [...match[1].matchAll(/'FMA\d+'/g)].map(([id]) => id.slice(1, -1));
    assert.deepEqual([...dentalMriGroups[key]], sourceIds);
    assert.equal(sourceIds.length, expectedCounts[index]);
    assert.ok(Object.isFrozen(dentalMriGroups[key]));
    all.push(...sourceIds);
  }
  assert.equal(all.length, 28);
  assert.equal(new Set(all).size, 28);
  const pendingDentalIds = pending.rows
    .filter((row) => row.topic === 'mri' && row.region === 'head-neck' && /tooth$/i.test(row.name))
    .map((row) => row.fmaId);
  assert.deepEqual([...all].sort(), pendingDentalIds.sort());
});

test('each group has original bounded draft text and primary citations', () => {
  assert.deepEqual(Object.keys(dentalMriTopics), expectedGroups);
  assert.ok(Object.isFrozen(dentalMriGroups));
  assert.ok(Object.isFrozen(dentalMriTopics));
  for (const key of expectedGroups) {
    const topic = dentalMriTopics[key];
    assert.ok(Object.isFrozen(topic));
    assert.ok(Object.isFrozen(topic.bullets));
    assert.ok(Object.isFrozen(topic.citations));
    assert.equal(typeof topic.body, 'string');
    assert.equal(topic.bullets.length, 2);
    assert.deepEqual(topic.citations, [
      'https://pubmed.ncbi.nlm.nih.gov/22707436/',
      'https://pubmed.ncbi.nlm.nih.gov/23420857/',
      'https://pubmed.ncbi.nlm.nih.gov/40301177/',
    ]);
    assert.match(topic.body, /soft tissue|soft-tissue/i);
    assert.doesNotMatch(`${topic.body} ${topic.bullets.join(' ')}`, /diagnose|treat|recommend a scan|replace x-ray/i);
  }
  assert.match(dentalMriNote, /draft.*radiologist review is pending/i);
  assert.match(dentalMriNote, /No scan or registration was imported/i);
  assert.match(dentalMriNote, /whole exterior tooth surfaces only/i);
  assert.doesNotMatch(source, /^import\s/m);
});
