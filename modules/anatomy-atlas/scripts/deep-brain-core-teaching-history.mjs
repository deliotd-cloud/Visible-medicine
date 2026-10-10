// Test-only exact reversal; never import into learner dispatch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/deep-brain-core-teaching-pins.json' with {type: 'json'};
import transition from '../content/deep-brain-core-teaching.transition.json' with {type: 'json'};
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function authoringBeforeDeepBrainCore({api, catalog}) {
  assert.equal(hash(pins), '9a054a45f4fc1237c806bcaed6c8df54386d74a06dc78cddb5fcd25fa70ce0ef');
  assert.equal(hash(transition), 'b44acdd2394354a6ded078668937a188309dc3d10e78eedd6a90818c01ee41c0');
  assert.equal(transition.sourcePinsHash, hash(pins)); assert.equal(transition.baseline, pins.baseline);
  const originals = new Map(); let drafts = 0, previous = 0;
  const display = api.bodyDisplayCatalog(catalog);
  for (const entry of pins.entries) {
    assert.deepEqual(display.structures.find(s => s.id === entry.identity.id), entry.identity, 'Unrecorded deep-brain identity');
    for (const [tab, lesson] of Object.entries(entry.previous)) {
      assert.equal(lesson.readiness, 'pending');
      const recorded = transition.entries.find(e => e.id === entry.identity.id && e.tab === tab);
      assert(recorded); assert.equal(recorded.fmaId, entry.identity.fmaId);
      assert.equal(hash(api.deepBrainCoreLesson(entry.identity, tab)), recorded.draftHash, 'Unrecorded deep-brain draft');
      const current = api.bodyLesson(entry.identity, tab);
      if (hash(current) === recorded.draftHash) drafts++;
      else {assert.deepEqual(current, lesson, 'Unrecorded deep-brain history'); previous++;}
      const {readiness, ...shown} = current; assert.deepEqual(api.bodyContent(entry.identity, tab), shown);
      originals.set(entry.identity.id + ':' + tab, {identity: entry.identity, lesson});
    }
  }
  assert(drafts === 10 || previous === 10, 'Mixed deep-brain history');
  if (previous === 10) return api;
  const bodyLesson = (s, tab) => {
    const entry = originals.get(s.id + ':' + tab);
    if (!entry) return api.bodyLesson(s, tab);
    assert.deepEqual(s, entry.identity, 'Historical deep-brain lesson requires exact source identity');
    return structuredClone(entry.lesson);
  };
  const bodyContent = (s, tab) => {if (!originals.has(s.id + ':' + tab)) return api.bodyContent(s, tab); const {readiness, ...shown} = bodyLesson(s, tab); return shown;};
  return {...api, bodyLesson, bodyContent};
}
