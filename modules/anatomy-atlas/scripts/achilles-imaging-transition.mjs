import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline history only. Runtime and exports always use the current lessons. */
export async function authoringBeforeAchillesImaging({ api, catalog }) {
  const before = await readContentJson('content/achilles-imaging.before.json');
  const after = await readContentJson(
    'content/achilles-imaging.transition.json',
  );
  assert.equal(
    hash(before),
    '5cc03450383362b9c9d19c41b733408d910f321bd59c8f17326d9d132bdf3e38',
  );
  assert.equal(
    hash(after),
    '6724d48eaf6cf1c1dc056e92e19f7dbb8161daf7ac54b2c5f0de188e797f6dfd',
  );
  assert.equal(before.sourceCommit, 'cb3d29bef8f48b27c18e302e6f66ed7354e36060');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.deepEqual(
    before.entries.map((e) => e.fmaId),
    ['FMA258847', 'FMA264844'],
  );
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert.deepEqual(
      s,
      entry.identity,
      'Source representation must not change with a lesson',
    );
    assert.deepEqual(Object.keys(entry.sections), ['mri', 'ultrasound']);
    assert.deepEqual(Object.keys(after.entries[i].sections), [
      'mri',
      'ultrasound',
    ]);
    for (const tab of ['mri', 'ultrasound']) {
      assert.equal(entry.sections[tab].readiness, 'pending');
      const lesson = api.bodyLesson(s, tab);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[tab],
        'Unrecorded Achilles imaging edit: ' + entry.id + '/' + tab,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(api.bodyContent(s, tab), shown);
      originals.set(entry.id + '|' + tab, entry.sections[tab]);
    }
  }
  const bodyLesson = (s, tab) =>
    originals.has(s.id + '|' + tab)
      ? structuredClone(originals.get(s.id + '|' + tab))
      : api.bodyLesson(s, tab);
  const bodyContent = (s, tab) => {
    if (!originals.has(s.id + '|' + tab)) return api.bodyContent(s, tab);
    const { readiness: _r, ...section } = bodyLesson(s, tab);
    return section;
  };
  return { ...api, bodyLesson, bodyContent };
}
