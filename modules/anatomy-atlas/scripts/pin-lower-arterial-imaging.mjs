import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import {
  lowerArterialImagingGroups,
  lowerArterialImagingTopics,
  lowerArterialImagingSelectionNotes,
} from '../content/lower-arterial-imaging.ts';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const { api } = await contentContext();
const catalog = api.bodyDisplayCatalog(JSON.parse(raw)),
  ids = Object.values(lowerArterialImagingGroups).flat();
assert.equal(ids.length, 12);
assert.equal(new Set(ids).size, 12);
assert.deepEqual(
  lowerArterialImagingSelectionNotes.flatMap((n) => n.fmaIds).sort(),
  [...ids].sort(),
);
const entries = catalog.structures
  .filter((s) => ids.includes(s.fmaId))
  .map((identity) => {
    const group = Object.entries(lowerArterialImagingGroups).find(([, ids]) =>
      ids.includes(identity.fmaId),
    )[0];
    return {
      identity,
      group,
      topics: Object.keys(lowerArterialImagingTopics[group]),
    };
  });
assert.equal(entries.length, 12);
assert(entries.every((e) => e.identity.system === 'vessels'));
const bundles = catalog.bundles.filter((b) =>
  entries.some((e) => e.identity.bundle === b.id),
);
for (const b of bundles)
  assert.equal(
    createHash('sha256')
      .update(await readFile('public' + b.url.split('?')[0]))
      .digest('hex'),
    b.sha256,
  );
const path = 'content/lower-arterial-imaging-pins.json';
const base = {
  sourceCommit: 'b5725a6b8cf2fa9028b93a9e3853d864bc874bc3',
  sourceVersion: catalog.sourceVersion,
  coordinateSystem: catalog.coordinateSystem,
  bundles,
  entries,
};
if (process.argv.includes('--check')) {
  const p = JSON.parse(await readFile(path));
  assert.deepEqual(
    p.entries.map(({ previous, ...e }) => e),
    entries,
  );
  for (const key of [
    'sourceCommit',
    'sourceVersion',
    'coordinateSystem',
    'bundles',
  ])
    assert.deepEqual(p[key], base[key]);
} else {
  await assert.rejects(access(path), 'Never overwrite source admission');
  const previousAllLessonsAndRecipesHash = hash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        api.contentTabs.map((t) => [t, api.bodyLesson(s, t)]),
      ),
    })),
    shoulder: api.structures,
    recipes: api.dissectionProfiles,
  });
  const record = {
    ...base,
    previousAllLessonsAndRecipesHash,
    entries: entries.map((e) => ({
      ...e,
      previous: Object.fromEntries(
        e.topics.map((t) => {
          const lesson = api.bodyLesson(e.identity, t);
          assert.equal(lesson.readiness, 'pending');
          return [t, lesson];
        }),
      ),
    })),
  };
  await writeFile(path, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
}
console.log(
  JSON.stringify({
    entries: entries.length,
    topics: entries.reduce((n, e) => n + e.topics.length, 0),
    bundles: bundles.length,
    noGeometryChange: true,
  }),
);
