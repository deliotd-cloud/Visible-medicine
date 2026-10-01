import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { cranialBoneQuizGroups } from '../content/cranial-bone-quiz.ts';
const parentCommit = 'bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
const { api, catalog } = await contentContext(), display = api.bodyDisplayCatalog(catalog);
const parent = await exactSourceHistoryApi(parentCommit);
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(snapshot(api, display), snapshot(parent, display));
const entries = Object.entries(cranialBoneQuizGroups).flatMap(([group, ids]) => ids.map(fma => {
  const matches = display.structures.filter(s => s.fmaId === fma); assert.equal(matches.length, 1, fma);
  const identity = matches[0];
  assert.equal(identity.system, 'skeleton');
  return { identity, group, topics: ['quiz'], previous: { quiz: api.bodyLesson(identity, 'quiz') } };
}));
assert.equal(entries.length, 8);
assert.equal(new Set(entries.map(entry => entry.identity.id)).size, 8);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]); assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(parent, display)), entries };
await writeFile('content/cranial-bone-quiz-pins.json', JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pinsHash: hash(pins), beforeHash: pins.previousAllLessonsAndRecipesHash, placements: entries.length }));
