import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  hipImagingGroups,
  hipImagingSelectionNotes,
} from '../content/hip-imaging-concepts.ts';
import { contentContext } from './content-contract-tools.mjs';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  ids = Object.values(hipImagingGroups).flat();
assert.equal(ids.length, 26);
assert.equal(new Set(ids).size, 26);
assert.deepEqual(
  hipImagingSelectionNotes.flatMap((n) => n.fmaIds).sort(),
  [...ids].sort(),
);
const entries = catalog.structures
  .filter((s) => ids.includes(s.fmaId))
  .map((identity) => ({
    identity,
    group: Object.entries(hipImagingGroups).find(([, ids]) =>
      ids.includes(identity.fmaId),
    )[0],
  }));
assert.equal(entries.length, 26);
assert(
  entries.every(
    (e) => e.identity.system === 'muscles' && e.identity.sources.length,
  ),
);
const pins = {
  sourceCommit: 'fa1ce62ee804e439ca55e987b79a16ce64a41cac',
  sourceVersion: catalog.sourceVersion,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((e) => e.identity.bundle === b.id),
  ),
  entries,
};
const path = 'content/hip-imaging-pins.json',
  output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  const { api } = await contentContext(),
    tabs = ['ct', 'mri', 'ultrasound'];
  const before = {
    sourceCommit: pins.sourceCommit,
    allLessonsAndRecipesHash: hash({
      body: catalog.structures.map((s) => ({
        id: s.id,
        sections: Object.fromEntries(
          api.contentTabs.map((t) => [t, api.bodyLesson(s, t)]),
        ),
      })),
      shoulder: api.structures,
      recipes: api.dissectionProfiles,
    }),
    tabs,
    entries: entries.map((e) => ({
      ...e,
      sections: Object.fromEntries(
        tabs.map((t) => {
          const lesson = api.bodyLesson(e.identity, t);
          assert.equal(lesson.readiness, 'pending');
          return [t, lesson];
        }),
      ),
    })),
  };
  for (const file of [path, 'content/hip-imaging.before.json'])
    await assert.rejects(
      access(file),
      'Never implicitly overwrite admission or teaching history',
    );
  await writeFile(path, output);
  await writeFile(
    'content/hip-imaging.before.json',
    JSON.stringify(before, null, 2) + '\n',
  );
}
console.log(
  JSON.stringify({
    selections: entries.length,
    groups: 6,
    check: process.argv.includes('--check'),
  }),
);
