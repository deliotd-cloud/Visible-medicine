import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import {
  pelvicOrganImagingGroups,
  pelvicOrganImagingTopics,
} from '../content/pelvic-organ-imaging.ts';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const { api, catalog: raw } = await contentContext(),
  catalog = api.bodyDisplayCatalog(raw);
const ids = Object.values(pelvicOrganImagingGroups).flat();
assert.equal(new Set(ids).size, 11);
const entries = catalog.structures.flatMap((identity) => {
  const group = Object.entries(pelvicOrganImagingGroups).find(([, ids]) =>
    ids.includes(identity.fmaId),
  )?.[0];
  return group
    ? [
        {
          identity,
          group,
          topics: Object.keys(pelvicOrganImagingTopics[group]),
        },
      ]
    : [];
});
assert.equal(entries.length, 11);
assert(
  entries.every(
    (e) =>
      e.identity.system === 'organs' && e.identity.regions.includes('pelvis'),
  ),
);
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
const path = 'content/pelvic-organ-imaging-pins.json';
const base = {
  sourceCommit: 'b1e371033ce1ad851d57badea5d7a72ced78d23d',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
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
    'license',
    'coordinateSystem',
    'bundles',
  ])
    assert.deepEqual(p[key], base[key]);
} else {
  await assert.rejects(access(path), 'Never overwrite source admissions');
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
  const output = {
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
  await writeFile(path, JSON.stringify(output, null, 2) + '\n', { flag: 'wx' });
}
console.log(
  JSON.stringify({
    selections: entries.length,
    placements: 44,
    bundles: bundles.length,
  }),
);
