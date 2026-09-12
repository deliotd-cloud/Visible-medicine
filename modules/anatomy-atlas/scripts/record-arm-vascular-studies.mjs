import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import {
  armVascularStudies,
  armVascularReferences,
} from '../content/arm-vascular-studies.ts';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const previous = structuredClone(dissectionProfiles),
  patches = [];
for (const region of ['shoulder-arm', 'whole-body']) {
  const ids = armVascularStudies.map((s) => s.id);
  const added = previous[region].focuses.filter((s) => ids.includes(s.id));
  assert.equal(added.length, 2);
  assert(!previous[region].stages.some((s) => ids.includes(s.id)));
  previous[region].focuses = previous[region].focuses.filter(
    (s) => !ids.includes(s.id),
  );
  const referencesAfter = structuredClone(previous[region].references);
  assert.deepEqual(
    referencesAfter.slice(-armVascularReferences.length),
    armVascularReferences,
  );
  previous[region].references = previous[region].references.slice(
    0,
    -armVascularReferences.length,
  );
  patches.push({
    region,
    added,
    referencesBefore: previous[region].references,
    referencesAfter,
  });
}
assert.equal(
  hash(previous),
  'e6cf75cd2ec70caffe461344b7d401c930102b77bcf0021e67a1dd28aadf6b7e',
  'Every prior recipe retained',
);
const record = {
  sourceCommit: '73ca79cea92f435fe40212c602dad407b4b3acd6',
  before: hash(previous),
  after: hash(dissectionProfiles),
  patches,
};
const text = JSON.stringify(record, null, 2) + '\n',
  path = 'content/arm-vascular-study-transition.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), text);
else await writeFile(path, text, { flag: 'wx' });
console.log(
  JSON.stringify({
    before: record.before,
    after: record.after,
    recordHash: hash(record),
    priorRecipesUnchanged: true,
  }),
);
