import assert from 'node:assert/strict';

// A single cell can bypass the preserved historical fallback only after every
// source, predecessor, current lesson and Review binding is proved.
export function assertTonguePalateQuizTransition({row, structure, tab, priorLesson,
  before, predecessor, predecessorTopic, after, introduced, topic,
  introducedTopic, currentResolver, worksheet}) {
  assert.equal(tab, 'quiz');
  assert.deepEqual(structure, row.identity, 'complete pinned source identity');
  assert.equal(row.previous.readiness, 'generated-identification');
  assert.deepEqual(priorLesson, row.previous, 'f1 historical quiz predecessor');
  assert.deepEqual(before, row.previous, 'original baseline quiz predecessor');
  assert.deepEqual(predecessor, row.previous, 'exact a247 quiz predecessor');
  assert.deepEqual(predecessorTopic, {tab, ...row.previous}, 'a247 Review predecessor');
  assert.equal(introduced.readiness, 'draft');
  assert.notDeepEqual(introduced, row.previous, 'source-backed quiz transition');
  assert.deepEqual(after, introduced, 'exact 6036 quiz lesson');
  assert.deepEqual(after, currentResolver(structure, tab), 'current source-bound resolver');
  assert.deepEqual(topic, {tab, ...after}, 'current Review quiz topic');
  assert.deepEqual(topic, introducedTopic, '6036 Review quiz topic');
  assert.equal(worksheet.approval, false, 'no carried clinical approval');
  assert.equal(worksheet.status, 'worksheet-not-submitted', 'unsigned Review worksheet');
}
