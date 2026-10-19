import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createExactEducationCaseAuthorizer } from '../lib/education-media-access.ts';

const hash = 'a'.repeat(64);
function fixture() {
  const state = {
    actor: { id: 'edu:learner-1', roles: ['learner'] },
    record: { id: 'assessment-v1', integrityHash: hash, manifest: {
      product: 'Visible Medicine', intendedPurpose: 'education-only',
      workbook: { id: 'workbook-1' }, cases: [{ id: 'case-1' }],
    } },
    members: new Set(['workbook-1/case-1', 'workbook-2/case-1']),
    eligible: new Set(['workbook-1']),
    reads: [],
  };
  const dependencies = {
    async loadAuthenticatedActor() { state.reads.push('actor'); return state.actor; },
    async loadVerifiedAssessment(versionId) { state.reads.push(['version', versionId]); return state.record; },
    async hasCurrentWorkbookCase(workbookId, caseId) {
      state.reads.push(['member', workbookId, caseId]);
      return state.members.has(`${workbookId}/${caseId}`);
    },
    async canAccessPublishedWorkbook(actorId, roles, workbookId) {
      state.reads.push(['eligible', actorId, roles, workbookId]);
      return state.eligible.has(workbookId);
    },
  };
  const authorize = createExactEducationCaseAuthorizer('assessment-v1', hash, dependencies);
  const check = () => authorize('edu:learner-1', 'workbook-1', 'case-1');
  return { state, dependencies, authorize, check };
}

test('exact verified assessment, frozen case, current membership and same-workbook eligibility permit access', async () => {
  const f = fixture();
  assert.equal(await f.check(), true);
  assert.deepEqual(f.state.reads.at(-1), ['eligible', 'edu:learner-1', ['learner'], 'workbook-1']);
});

test('case grant through another workbook cannot substitute for requested workbook eligibility', async () => {
  const f = fixture();
  f.state.eligible = new Set(['workbook-2']);
  assert.equal(f.state.members.has('workbook-2/case-1'), true);
  assert.equal(await f.check(), false);
  assert.deepEqual(f.state.reads.at(-1).at(-1), 'workbook-1');
});

test('verified version, digest and workbook must match the exact request', async () => {
  for (const mutation of [
    f => { f.state.record.id = 'assessment-v2'; },
    f => { f.state.record.integrityHash = 'b'.repeat(64); },
    f => { f.state.record.manifest.workbook.id = 'workbook-2'; },
    f => { f.state.record = null; },
  ]) {
    const f = fixture(); mutation(f);
    assert.equal(await f.check(), false);
    assert.equal(f.state.reads.some(read => Array.isArray(read) && read[0] === 'eligible'), false);
  }
});

test('missing and duplicate frozen cases deny', async () => {
  for (const cases of [[], [{ id: 'case-1' }, { id: 'case-1' }]]) {
    const f = fixture(); f.state.record.manifest.cases = cases;
    assert.equal(await f.check(), false);
  }
});

test('withdrawn current workbook-case membership denies even when old manifest retains case', async () => {
  const f = fixture(); f.state.members.delete('workbook-1/case-1');
  assert.equal(await f.check(), false);
  assert.equal(f.state.reads.some(read => Array.isArray(read) && read[0] === 'eligible'), false);
});

test('actor mismatch, malformed identity, role spoof strings and malformed input deny', async () => {
  const f = fixture();
  assert.equal(await f.authorize('edu:someone-else', 'workbook-1', 'case-1'), false);
  assert.equal(await f.authorize('edu:learner-1', '../workbook-1', 'case-1'), false);
  assert.equal(await f.authorize('edu:learner-1', 'workbook-1', 'case-1\n'), false);
  f.state.actor.roles = ['learner,administrator'];
  assert.equal(await f.check(), false);
  f.state.actor.roles = [' administrator'];
  assert.equal(await f.check(), false);
  f.state.actor.roles = ['administrator'];
  f.state.actor.id = 'edu:someone-else';
  assert.equal(await f.check(), false);
});

test('missing actor and dependency errors fail closed', async () => {
  const f = fixture(); f.state.actor = null;
  assert.equal(await f.check(), false);
  for (const method of ['loadAuthenticatedActor', 'loadVerifiedAssessment', 'hasCurrentWorkbookCase', 'canAccessPublishedWorkbook']) {
    const g = fixture(); g.dependencies[method] = async () => { throw Error('synthetic failure'); };
    assert.equal(await g.check(), false);
  }
});

test('each call rereads and denies after eligibility or membership revocation', async () => {
  const f = fixture();
  assert.equal(await f.check(), true);
  f.state.eligible.clear();
  assert.equal(await f.check(), false);
  f.state.eligible.add('workbook-1');
  assert.equal(await f.check(), true);
  f.state.members.clear();
  assert.equal(await f.check(), false);
  assert.equal(f.state.reads.filter(read => read === 'actor').length, 4);
  assert.equal(f.state.reads.filter(read => Array.isArray(read) && read[0] === 'version').length, 4);
});

test('non-Education roles and empty roles cannot substitute for a case role', async () => {
  for (const roles of [[], ['atlas-subscriber'], ['lecture-subscriber']]) {
    const f = fixture(); f.state.actor.roles = roles;
    assert.equal(await f.check(), false);
    assert.equal(f.state.reads.some(read => Array.isArray(read) && read[0] === 'eligible'), false);
  }
});

test('authenticated actor primitives are snapshotted before awaiting the manifest', async () => {
  const f = fixture();
  f.dependencies.loadVerifiedAssessment = async () => {
    f.state.actor.id = 'edu:other'; f.state.actor.roles.splice(0, 1, 'administrator');
    return f.state.record;
  };
  assert.equal(await f.check(), true);
  assert.deepEqual(f.state.reads.at(-1), ['eligible', 'edu:learner-1', ['learner'], 'workbook-1']);
});
