import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import {
  longusColliStudySets,
  longusColliReferences,
} from '../content/longus-colli-studies.ts';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const previous = structuredClone(dissectionProfiles),
  patches = [];
for (const region of ['head-neck', 'spine', 'whole-body']) {
  const ids = longusColliStudySets
    .filter((s) => s.regions.includes(region))
    .map((s) => s.id);
  const added = previous[region].focuses.filter((s) => ids.includes(s.id));
  assert.equal(added.length, ids.length);
  assert(!previous[region].stages.some((s) => ids.includes(s.id)));
  previous[region].focuses = previous[region].focuses.filter(
    (s) => !ids.includes(s.id),
  );
  assert.deepEqual(
    previous[region].references.slice(-2),
    longusColliReferences,
  );
  const referencesAfter = structuredClone(previous[region].references);
  previous[region].references = previous[region].references.slice(0, -2);
  patches.push({
    region,
    added,
    referencesBefore: previous[region].references,
    referencesAfter,
  });
}
assert.equal(
  hash(previous),
  '15affa2fb0d39e48b08809891e24e10ac2487ef73d6cc2d9cb4e646a309766ed',
  'All previous recipes retained exactly',
);
const record = {
  sourceCommit: '1f9413f581fd35da56561001e23b803ce94951af',
  before: hash(previous),
  after: hash(dissectionProfiles),
  patches,
};
const output = JSON.stringify(record, null, 2) + '\n',
  path = 'content/longus-colli-recipe-transition.json';
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
