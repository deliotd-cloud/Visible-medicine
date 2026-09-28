// Explicit stdout generator: capture and review pins; never silently rewrite them.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { pelvicOrganQuizGroups } from '../content/pelvic-organ-quiz.ts';
const parentCommit = '367ec85339ef2f7bd11df43a96514ac85712f4ab';
const { api, catalog } = await contentContext();
const parent = await exactSourceHistoryApi(parentCommit, 'display-content');
const display = parent.bodyDisplayCatalog(catalog);
assert.deepEqual(api.bodyDisplayCatalog(catalog), display);
const entries = Object.entries(pelvicOrganQuizGroups).flatMap(([group, fmas]) => fmas.map(fma => {
  const matches = display.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1, fma + ' must have one current displayed identity');
  const identity = matches[0];
  return { identity, group, topics: ['quiz'], previous: { quiz: parent.bodyLesson(identity, 'quiz') } };
}));
const bundleIds = new Set(entries.map(entry => entry.identity.bundle));
const snapshot = { body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(parent.contentTabs.map(t => [t, parent.bodyLesson(s, t)])) })), shoulder: parent.structures, recipes: parent.dissectionProfiles };
console.log(JSON.stringify({ parentCommit, coordinateSystem: display.coordinateSystem,
  bundles: display.bundles.filter(b => bundleIds.has(b.id)),
  previousAllLessonsAndRecipesHash: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), entries }, null, 2));
