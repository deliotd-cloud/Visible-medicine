import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import {
  limbVascularStudySets,
  limbVascularReferences,
} from '../content/limb-vascular-studies.ts';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const previous = structuredClone(dissectionProfiles),
  patches = [];
for (const region of ['leg', 'thigh']) {
  const ids = limbVascularStudySets
    .filter((s) => s.regions.includes(region))
    .map((s) => s.id);
  const added = previous[region].focuses.filter((s) => ids.includes(s.id));
  assert.equal(added.length, ids.length);
  assert(!previous[region].stages.some((s) => ids.includes(s.id)));
  previous[region].focuses = previous[region].focuses.filter(
    (s) => !ids.includes(s.id),
  );
  assert.deepEqual(
    previous[region].references.slice(-3),
    limbVascularReferences,
  );
  const referencesAfter = structuredClone(previous[region].references);
  previous[region].references = previous[region].references.slice(0, -3);
  patches.push({
    region,
    added,
    referencesBefore: previous[region].references,
    referencesAfter,
  });
}
assert.equal(
  hash(previous),
  '81415083e7c3c46814191e79137160b90892a33f91191ca732dd7dff397c1dcc',
  'All previous recipes retained exactly',
);
const record = {
  sourceCommit: 'fa4959b0c641e77086f2bc0228bb2f4231683bf7',
  before: hash(previous),
  after: hash(dissectionProfiles),
  patches,
};
const output = JSON.stringify(record, null, 2) + '\n',
  path = 'content/limb-vascular-recipe-transition.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(
  JSON.stringify({
    before: record.before,
    after: record.after,
    recordHash: hash(record),
    focuses: 3,
    existingRecipesUnchanged: true,
  }),
);
