import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mayAutosaveDraft, rememberReviewer, reviewContext, withRememberedReviewer,
} from '../app/review/review-working-state.ts';

const ready = {
  loaded: true, dirty: true, busy: false, blocked: false,
  current: true, status: 'draft', attested: false,
};

test('autosave requires a dirty, current, unattested draft and no failure lock', () => {
  assert.equal(mayAutosaveDraft(ready), true);
  for (const patch of [
    { loaded: false }, { dirty: false }, { busy: true }, { blocked: true },
    { current: false }, { status: 'approved' },
    { status: 'changes-required' }, { attested: true },
  ]) assert.equal(mayAutosaveDraft({ ...ready, ...patch }), false);
});

test('reviewer reuse requires explicit context and never copies review content', () => {
  const header = new Response('{}', {
    headers: { 'X-Clinical-Review-Context': 'opaque-context-A' },
  });
  const context = reviewContext(header);
  assert.equal(context, 'opaque-context-A');
  rememberReviewer(context, [{ reviewer: 'Dr Example', qualification: 'Radiologist' }]);
  const blank = { reviewer: '', qualification: '', scope: '', attested: false };
  assert.deepEqual(withRememberedReviewer(context, blank), {
    ...blank, reviewer: 'Dr Example', qualification: 'Radiologist',
  });
  assert.deepEqual(withRememberedReviewer(null, blank), blank);
  assert.deepEqual(withRememberedReviewer('opaque-context-B', blank), blank);
  assert.equal(reviewContext(new Response('{}')), null);
  assert.equal(reviewContext(new Response('{}', {
    headers: { 'X-Clinical-Review-Context': 'bad context' },
  })), null);
});
