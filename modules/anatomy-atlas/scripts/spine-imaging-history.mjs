// Exact offline authoring reconstruction, never runtime content or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import before from '../content/spine-imaging.before.json' with { type: 'json' };
import after from '../content/spine-imaging.transition.json' with { type: 'json' };
import pins from '../content/spine-imaging-pins.json' with { type: 'json' };
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');

export function authoringBeforeSpineImaging({ api, catalog }) {
  assert.equal(
    hash(before),
    '4efe17d830f8442d48bba78cfe9cb690f4f3fa08a4ebc9adfabd0a8bd134803f',
  );
  assert.equal(
    hash(after),
    '37c5a6f9b3eaef694187ec2c57ce726093fbc6193ea0a73ac63dcfdd96489bd1',
  );
  assert.equal(
    hash(pins),
    'a455b8ec9be49820f02c728c49cabbcebc6eb4504c64d1ce2d7766cfc844e7a6',
  );
  assert.equal(before.sourceCommit, '59a567c7fb76c954cf3d91eeec62124e207bbbf9');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(pins.sourceCommit, before.sourceCommit);
  assert.equal(before.entries.length, 47);
  assert.deepEqual(before.tabs, ['ct', 'mri', 'xray']);
  assert.deepEqual(
    before.entries.map(({ group, identity }) => ({ group, identity })),
    pins.entries,
  );
  assert.deepEqual(
    after.entries.map((e) => e.id),
    before.entries.map((e) => e.identity.id),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.identity.id);
    assert.deepEqual(
      s,
      entry.identity,
      'Spinal source identity must not change with teaching',
    );
    assert.deepEqual(Object.keys(entry.sections), before.tabs);
    assert.deepEqual(Object.keys(after.entries[i].sections), before.tabs);
    for (const tab of before.tabs) {
      assert.equal(entry.sections[tab].readiness, 'pending');
      const lesson = api.bodyLesson(s, tab);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[tab],
        'Unrecorded spinal imaging edit: ' + s.id + '/' + tab,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(api.bodyContent(s, tab), shown);
      originals.set(s.id + '|' + tab, {
        identity: entry.identity,
        lesson: entry.sections[tab],
      });
    }
  }
  assert.equal(originals.size, 141);
  const bodyLesson = (s, tab) => {
    const old = originals.get(s.id + '|' + tab);
    if (!old) return api.bodyLesson(s, tab);
    assert.deepEqual(
      s,
      old.identity,
      'Historical lessons also require exact source identity',
    );
    return structuredClone(old.lesson);
  };
  const bodyContent = (s, tab) => {
    const { readiness: _r, ...shown } = bodyLesson(s, tab);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
