// Offline teaching-copy reversal only. Current runtime and source records stay unchanged.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceNote =
  'Display aggregate excludes the separately selectable hepatic artery proper surface. Source coordinates are unchanged. Display aggregate excludes the separately selectable right hepatic vein surface. Source coordinates are unchanged. Display aggregate excludes the separately selectable left hepatic vein surface. Source coordinates are unchanged.';
const displayNote =
  'The liver display aggregate excludes the separately selectable hepatic artery proper, right hepatic vein and left hepatic vein surfaces. Source coordinates are unchanged; segment boundaries and clinical accuracy are unvalidated.';
const prefix =
  'Independent anatomical and clinical review pending. Explode and clipping controls are teaching aids, not physiological motion, acquired imaging or procedure guidance. ';
const recordedLessonHash =
  '225716ea7a5ebcdf5303c7c9dc89155fa479a5c309ba42975eaa47981bb0d9e0';

export function preLiverAnatomyCoverage(api, catalog) {
  const liver = api.bodyDisplayCatalog(catalog).structures.find((s) => s.fmaId === 'FMA7197');
  assert(liver && liver.id === 'vm:anatomy:body:abdomen:unpaired:organ:liver');
  assert.equal(liver.coverageNote, sourceNote, 'Liver source coverage changed');
  const current = api.bodyLesson(liver, 'anatomy');
  const recorded = { ...current, note: prefix + sourceNote };
  assert.equal(hash(recorded), recordedLessonHash, 'Unrecorded Liver Anatomy lesson edit');
  if (current.note === recorded.note) return api;
  assert.equal(current.note, prefix + displayNote, 'Unrecorded Liver Anatomy display note');
  const bodyLesson = (structure, tab) =>
    structure.id === liver.id && tab === 'anatomy'
      ? { ...api.bodyLesson(structure, tab), note: prefix + sourceNote }
      : api.bodyLesson(structure, tab);
  return {
    ...api,
    bodyLesson,
    bodyContent(structure, tab) {
      if (structure.id !== liver.id || tab !== 'anatomy') return api.bodyContent(structure, tab);
      const { readiness: _readiness, ...shown } = bodyLesson(structure, tab);
      return shown;
    },
  };
}
