import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTeachingGapReport, teachingReadiness} from './teaching-gap-report.mjs';

const structures = [
  {id: 'b', name: 'Beta', region: 'thorax', system: 'vessels', fmaId: 'FMA2'},
  {id: 'c', name: 'Alpha', region: 'abdomen', system: 'organs', fmaId: 'FMA3'},
  {id: 'a', name: 'Alpha', region: 'thorax', system: 'vessels', fmaId: 'FMA1'},
];
const states = {
  a: {quiz: 'generated-identification', ct: 'draft'},
  b: {quiz: 'pending', ct: 'identity-only'},
  c: {quiz: 'draft', ct: 'pending'},
};
const lessonFor = (structure, topic) => ({readiness: states[structure.id][topic]});
const input = () => ({structures, topics: ['quiz', 'ct'], lessonFor, sourceRevision: 'test-revision'});

test('reports every readiness total and sorted non-draft rows from the resolver', () => {
  const beforeStructures = structuredClone(structures);
  const beforeTopics = ['quiz', 'ct'];
  const report = buildTeachingGapReport({...input(), topics: beforeTopics});
  assert.equal(report.scope, 'root-body');
  assert.equal(report.sourceRevision, 'test-revision');
  assert.equal(report.structureCount, 3);
  assert.equal(report.placementCount, 6);
  assert.deepEqual(report.topics, ['ct', 'quiz']);
  assert.deepEqual(report.totals, {
    draft: 2, 'identity-only': 1, pending: 2, 'generated-identification': 1,
  });
  assert.deepEqual(report.byTopic.ct, {
    draft: 1, 'identity-only': 1, pending: 1, 'generated-identification': 0,
  });
  assert.deepEqual(report.byRegion.thorax, {
    draft: 1, 'identity-only': 1, pending: 1, 'generated-identification': 1,
  });
  assert.deepEqual(report.rows.map(row => [row.region, row.topic, row.name, row.id, row.readiness]), [
    ['abdomen', 'ct', 'Alpha', 'c', 'pending'],
    ['thorax', 'ct', 'Beta', 'b', 'identity-only'],
    ['thorax', 'quiz', 'Alpha', 'a', 'generated-identification'],
    ['thorax', 'quiz', 'Beta', 'b', 'pending'],
  ]);
  assert.deepEqual(report.rows[0], {
    id: 'c', name: 'Alpha', region: 'abdomen', system: 'organs', fmaId: 'FMA3',
    topic: 'ct', readiness: 'pending',
  });
  assert.deepEqual(structures, beforeStructures);
  assert.deepEqual(beforeTopics, ['quiz', 'ct']);
  assert.equal(JSON.stringify(buildTeachingGapReport({
    ...input(), structures: [...structures].reverse(), topics: ['ct', 'quiz'],
  })), JSON.stringify(report));
});

test('supports a zero-structure root-body inventory', () => {
  const report = buildTeachingGapReport({...input(), structures: []});
  assert.equal(report.placementCount, 0);
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.byRegion, {});
  assert.deepEqual(report.byTopic.ct, Object.fromEntries(teachingReadiness.map(state => [state, 0])));
});

test('fails closed on duplicate identities, topics and readiness', () => {
  assert.throws(() => buildTeachingGapReport({...input(), structures: [structures[0], {...structures[0]}]}), /duplicate structure id/);
  assert.throws(() => buildTeachingGapReport({...input(), topics: ['ct', 'ct']}), /duplicate topic/);
  assert.throws(() => buildTeachingGapReport({...input(), lessonFor: () => ({readiness: 'held'})}), /unknown or missing readiness/);
  assert.throws(() => buildTeachingGapReport({...input(), lessonFor: () => ({})}), /unknown or missing readiness/);
  assert.throws(() => buildTeachingGapReport({...input(), lessonFor: () => undefined}), /unknown or missing readiness/);
});
