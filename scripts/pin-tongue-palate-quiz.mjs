// Explicit stdout generation or exact verification; never silently re-pin.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { tonguePalateQuizGroups } from '../content/tongue-palate-quiz.ts';

const parentCommit = 'a2475a37201bdd5fdd12f5849fc8ee043412d02f';
const { api, catalog } = await contentContext();
const parent = await exactSourceHistoryApi(parentCommit, 'display-content');
const display = parent.bodyDisplayCatalog(catalog);
assert.deepEqual(api.bodyDisplayCatalog(catalog), display);
const entries = Object.entries(tonguePalateQuizGroups).flatMap(([group, fmas]) => fmas.map(fma => {
  const matches = display.structures.filter(structure => structure.fmaId === fma);
  assert.equal(matches.length, 1, `Expected one displayed source identity: ${fma}`);
  const identity = matches[0];
  assert.equal(identity.bundle, 'head-neck-muscles');
  assert.equal(identity.system, 'muscles');
  assert.equal(identity.category, 'muscle');
  assert(['left', 'right'].includes(identity.laterality));
  const previous = parent.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification');
  return { identity, group, previous };
}));
assert.equal(entries.length, 8);
const snapshot = {
  body: display.structures.map(structure => ({ id: structure.id, sections: Object.fromEntries(parent.contentTabs.map(tab => [tab, parent.bodyLesson(structure, tab)])) })),
  shoulder: parent.structures, recipes: parent.dissectionProfiles,
};
const pins = {
  parentCommit, sourceVersion: display.sourceVersion, coordinateSystem: display.coordinateSystem,
  bundles: display.bundles.filter(bundle => bundle.id === 'head-neck-muscles'),
  previousAllLessonsAndRecipesSha256: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), entries,
};
if (process.argv.includes('--check')) {
  assert.equal(process.argv.length, 3, 'Verification accepts only --check.');
  assert.deepEqual(JSON.parse(await readFile(new URL('../content/tongue-palate-quiz-pins.json', import.meta.url), 'utf8')), pins);
  console.log('Verified eight exact source identities and their immutable prior quiz lessons. No approvals recorded.');
} else {
  assert.equal(process.argv.length, 2, 'Use no arguments for stdout generation or --check for verification.');
  console.log(JSON.stringify(pins, null, 2));
}
