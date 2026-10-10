// Test-only exact reversal; never import into learner dispatch.
import assert from 'node:assert/strict';
import {beforeFootSurfaceEpoch} from './late-teaching-epoch-history.mjs';
import {createHash} from 'node:crypto';
import pins from '../content/foot-surface-imaging-pins.json' with {type: 'json'};
import transition from '../content/foot-surface-imaging.transition.json' with {type: 'json'};
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function authoringBeforeFootSurfaceImaging({api, catalog}) {
  api=beforeFootSurfaceEpoch(api,catalog);
  assert.equal(hash(pins), '8dddeb76bd3578bc9c8494ffed9c0d580ebd1ff2c1e11ad6b76f77932f2fda85');
  assert.equal(hash(transition), '06521330390060e0b65b6a101ebf58b26183cc1b8d11db3751eacd27ac136bee');
  assert.equal(transition.sourcePinsHash, hash(pins)); assert.equal(transition.baseline, pins.baseline);
  const originals = new Map(); let drafts = 0, previous = 0;
  const display = api.bodyDisplayCatalog(catalog);
  const snapshot = value => ({catalog:display,body:display.structures.map(s=>({id:s.id,topics:Object.fromEntries(value.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
  const verifyPrior = value => assert.equal(hash(snapshot(value)),pins.beforeAllTeachingSnapshotHash,'Unrecorded complete foot-surface baseline');
  for (const entry of pins.entries) {
    assert.deepEqual(display.structures.find(s => s.id === entry.identity.id), entry.identity, 'Unrecorded foot-surface identity');
    for (const [tab, lesson] of Object.entries(entry.previous)) {
      assert.equal(lesson.readiness, 'pending');
      const recorded = transition.entries.find(e => e.id === entry.identity.id && e.tab === tab);
      assert(recorded); assert.equal(recorded.fmaId, entry.identity.fmaId);
      assert.equal(hash(api.footSurfaceImagingLesson(entry.identity, tab)), recorded.draftHash, 'Unrecorded foot-surface draft');
      const current = api.bodyLesson(entry.identity, tab);
      if (hash(current) === recorded.draftHash) drafts++;
      else {assert.deepEqual(current, lesson, 'Unrecorded foot-surface history'); previous++;}
      const {readiness, ...shown} = current; assert.deepEqual(api.bodyContent(entry.identity, tab), shown);
      originals.set(entry.identity.id + ':' + tab, {identity: entry.identity, lesson});
    }
  }
  assert(drafts === 8 || previous === 8, 'Mixed foot-surface history');
  if (previous === 8) {verifyPrior(api);return api;}
  const bodyLesson = (s, tab) => {
    const entry = originals.get(s.id + ':' + tab);
    if (!entry) return api.bodyLesson(s, tab);
    assert.deepEqual(s, entry.identity, 'Historical foot-surface lesson requires exact source identity');
    return structuredClone(entry.lesson);
  };
  const bodyContent = (s, tab) => {if (!originals.has(s.id + ':' + tab)) return api.bodyContent(s, tab); const {readiness, ...shown} = bodyLesson(s, tab); return shown;};
  const restored = {...api, bodyLesson, bodyContent};
  verifyPrior(restored);
  return restored;
}
