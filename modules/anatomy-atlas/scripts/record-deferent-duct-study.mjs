import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import { deferentDuctStudy, deferentDuctReferences } from '../content/deferent-duct-study.ts';
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const previous = structuredClone(dissectionProfiles), patches = [];
for (const region of deferentDuctStudy.regions) {
  const added = previous[region].focuses.filter((s) => s.id === deferentDuctStudy.id);
  assert.equal(added.length, 1);
  assert(!previous[region].stages.some((s) => s.id === deferentDuctStudy.id));
  previous[region].focuses = previous[region].focuses.filter((s) => s.id !== deferentDuctStudy.id);
  const referencesAfter = structuredClone(previous[region].references);
  assert.deepEqual(referencesAfter.slice(-deferentDuctReferences.length), deferentDuctReferences);
  previous[region].references = previous[region].references.slice(0, -deferentDuctReferences.length);
  patches.push({ region, added, referencesBefore: previous[region].references, referencesAfter });
}
assert.equal(hash(previous), '90643b1e4dc8d14e46f333235363ec6f9003aebeecf2925398e4e4f8b8ca3983', 'Every prior recipe retained');
const record = { sourceCommit: '0b3c1fd3d80849a3cc3e7e860430f610c265eea7', before: hash(previous), after: hash(dissectionProfiles), patches };
const output = JSON.stringify(record, null, 2) + '\n', path = 'content/deferent-duct-study-transition.json';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ before: record.before, after: record.after, recordHash: hash(record), previousRecipesUnchanged: true }));
