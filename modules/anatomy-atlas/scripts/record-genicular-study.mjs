import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dissectionProfiles as currentProfiles } from '../app/dissection-data.ts';
import { preDeferentDuctProfiles } from './deferent-duct-study-history.mjs';
const dissectionProfiles = preDeferentDuctProfiles(currentProfiles);
import { genicularStudy, genicularStudyReferences } from '../content/genicular-study.ts';
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const previous = structuredClone(dissectionProfiles), patches = [];
for (const region of genicularStudy.regions) {
  const added = previous[region].focuses.filter((s) => s.id === genicularStudy.id);
  assert.equal(added.length, 1);
  assert(!previous[region].stages.some((s) => s.id === genicularStudy.id));
  previous[region].focuses = previous[region].focuses.filter((s) => s.id !== genicularStudy.id);
  const referencesAfter = structuredClone(previous[region].references);
  assert.deepEqual(referencesAfter.slice(-genicularStudyReferences.length), genicularStudyReferences);
  previous[region].references = previous[region].references.slice(0, -genicularStudyReferences.length);
  patches.push({ region, added, referencesBefore: previous[region].references, referencesAfter });
}
assert.equal(hash(previous), 'afba80ef8e232d6dd21f9b4c00b73284db7dcb7a8778c520fd4096d9990e9176', 'Every prior recipe retained');
const record = { sourceCommit: 'f5460a4548b7ba4761220c791ea6673b5c7ebb6f', before: hash(previous), after: hash(dissectionProfiles), patches };
const output = JSON.stringify(record, null, 2) + '\n', path = 'content/genicular-study-transition.json';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ before: record.before, after: record.after, recordHash: hash(record), previousRecipesUnchanged: true }));
