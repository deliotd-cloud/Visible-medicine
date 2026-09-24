import assert from 'node:assert/strict';
import { contentContext, readContentJson } from './content-contract-tools.mjs';
import { preLiverAnatomyCoverage } from './liver-anatomy-coverage-history.mjs';

const { api, catalog } = await contentContext();
const sourceNote =
  'Display aggregate excludes the separately selectable hepatic artery proper surface. Source coordinates are unchanged. Display aggregate excludes the separately selectable right hepatic vein surface. Source coordinates are unchanged. Display aggregate excludes the separately selectable left hepatic vein surface. Source coordinates are unchanged.';
const displayNote =
  'The liver display aggregate excludes the separately selectable hepatic artery proper, right hepatic vein and left hepatic vein surfaces. Source coordinates are unchanged; segment boundaries and clinical accuracy are unvalidated.';

const liver = catalog.structures.find((s) => s.fmaId === 'FMA7197');
assert(liver, 'Liver source selection exists');
assert.equal(liver.coverageNote, sourceNote);
for (const path of [
  'content/abdominal-organ-imaging-pins.json',
  'content/core-organ-function-pins.json',
]) {
  const pins = await readContentJson(path);
  assert.equal(
    pins.entries.find((entry) => entry.identity.fmaId === 'FMA7197')?.identity.coverageNote,
    sourceNote,
    `${path} preserves the archived source note`,
  );
}

const anatomy = api.bodyLesson(liver, 'anatomy');
assert.equal(anatomy.note, `Independent anatomical and clinical review pending. Explode and clipping controls are teaching aids, not physiological motion, acquired imaging or procedure guidance. ${displayNote}`);
assert.equal((anatomy.note.match(/Source coordinates are unchanged/g) ?? []).length, 1);
assert(!anatomy.note.includes(sourceNote));
assert(anatomy.bullets.some((bullet) => bullet.includes('not a validated segmental resection map')));
assert.equal(
  api.bodyLesson({ ...liver, coverageNote: 'Future source revision requires review.' }, 'anatomy').note.endsWith('Future source revision requires review.'),
  true,
);
const historical = preLiverAnatomyCoverage(api, catalog);
assert.equal(historical.bodyLesson(liver, 'anatomy').note.endsWith(sourceNote), true);
assert.throws(
  () => preLiverAnatomyCoverage({
    ...api,
    bodyLesson: (structure, tab) => {
      const lesson = api.bodyLesson(structure, tab);
      return structure.fmaId === 'FMA7197' && tab === 'anatomy'
        ? { ...lesson, note: lesson.note + ' Unrecorded revision.' }
        : lesson;
    },
  }, catalog),
  /Unrecorded Liver Anatomy display note/,
);
console.log('Liver Anatomy coverage: archived source retained; one display caveat with three exclusions and review limits.');
