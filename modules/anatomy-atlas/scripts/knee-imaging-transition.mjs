import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
import { authoringBeforeXray } from './xray-history.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Exact offline history only; runtime/export never substitute earlier lessons. */
export async function authoringBeforeKneeImaging({ api, catalog }) {
  api = authoringBeforeXray({ api, catalog });
  const before = await readContentJson('content/knee-imaging.before.json');
  const after = await readContentJson('content/knee-imaging.transition.json');
  assert.equal(
    hash(before),
    'bb3c2d20d20aa766adc7920de8133b9cebfca4973924f04da2767304cbadff07',
  );
  assert.equal(
    hash(after),
    'ef8c87762d99da167210f99c970ad71873f42377fba12a5fef175192b679cb2e',
  );
  assert.equal(before.sourceCommit, 'e4c83c099239b1e41126ad19f90012a8207262f6');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.deepEqual(
    before.entries.map((e) => e.fmaId),
    ['FMA24475', 'FMA24487', 'FMA24478', 'FMA24474', 'FMA24486', 'FMA24477'],
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
      'Knee source identity must not change with teaching',
    );
    const tabs = /patella$/.test(s.name)
      ? ['ct', 'mri', 'ultrasound']
      : ['ct', 'mri'];
    assert.deepEqual(Object.keys(entry.sections), tabs);
    assert.deepEqual(Object.keys(after.entries[i].sections), tabs);
    for (const tab of tabs) {
      assert.equal(entry.sections[tab].readiness, 'pending');
      const lesson = api.bodyLesson(s, tab);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[tab],
        'Unrecorded knee imaging edit: ' + entry.id + '/' + tab,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(api.bodyContent(s, tab), shown);
      originals.set(entry.id + '|' + tab, entry.sections[tab]);
    }
  }
  assert.equal(originals.size, 14);
  const bodyLesson = (s, tab) =>
    originals.has(s.id + '|' + tab)
      ? structuredClone(originals.get(s.id + '|' + tab))
      : api.bodyLesson(s, tab);
  const bodyContent = (s, tab) => {
    if (!originals.has(s.id + '|' + tab)) return api.bodyContent(s, tab);
    const { readiness: _r, ...shown } = bodyLesson(s, tab);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
