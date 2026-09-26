import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with { type: 'json' };
import transition from '../content/esophagus-external-ultrasound.transition.json' with { type: 'json' };
import { beforeLaryngealFrameworkImaging } from './laryngeal-framework-imaging-history.mjs';

export const esophagusUltrasoundHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeEsophagusExternalUltrasound(context) {
  context = { ...context, api: beforeLaryngealFrameworkImaging(context.api) };
  const { api } = context;
  assert.equal(esophagusUltrasoundHash(transition), '6635d8d640e6b9411ad41d4f7ff8d2d2ce00a7b91293dab7f2716c4c36c7368b');
  assert.equal(transition.parentCommit, '6cbeafbf85430e02e569a3bdd3a5d7e16b0a1467');
  assert.equal(esophagusUltrasoundHash(pins), transition.originalPinsHash);
  const entry = pins.entries.find(e => e.identity.id === transition.id);
  assert.equal(entry.group, 'esophagus');
  assert.equal(entry.identity.fmaId, transition.fmaId);
  assert.equal(entry.identity.sources[0].file, transition.sourceFile);
  assert.equal(esophagusUltrasoundHash(api.thoracoabdominalOrganImagingLesson(entry.identity, 'ultrasound')), transition.draftHash);
  const current = api.bodyLesson(entry.identity, 'ultrasound');
  if (esophagusUltrasoundHash(current) !== transition.draftHash) {
    assert.deepEqual(current, transition.previous, 'Unrecorded esophagus external ultrasound change');
    return context;
  }
  const bodyLesson = (structure, tab) => {
    if (tab !== 'ultrasound' || structure.id !== transition.id) return api.bodyLesson(structure, tab);
    assert.deepEqual(structure, entry.identity);
    return structuredClone(transition.previous);
  };
  const groups = structuredClone(api.thoracoabdominalOrganImagingGroups);
  delete groups.esophagus.focus.ultrasound;
  return { ...context, api: { ...api, bodyLesson, thoracoabdominalOrganImagingGroups: groups,
    bodyContent(structure, tab) {
      const { readiness: _readiness, ...content } = bodyLesson(structure, tab);
      return content;
    },
  } };
}
