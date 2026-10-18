import test from 'node:test';
import assert from 'node:assert/strict';
import { createLatestViewRequest } from '../lib/latest-view-request.ts';

test('unmounted and obsolete contexts cannot begin work', () => {
  const gate = createLatestViewRequest();
  assert.equal(gate.begin('case-a'), null);
  gate.setContext('case-b');
  assert.equal(gate.begin('case-a'), null);
  assert.ok(gate.begin('case-b'));
});

test('latest request owns result, error and completion even if abort is ignored', async () => {
  const gate = createLatestViewRequest();
  gate.setContext('case-a');
  let completeOld!: (result: string) => void;
  let visible = '', busy = false;
  const old = gate.begin('case-a')!;
  const delayed = new Promise<string>((resolve) => { completeOld = resolve; });
  const pending = delayed.then((result) => {
    if (old.isCurrent()) visible = result;
  }).finally(() => { if (old.finish()) busy = false; });
  const current = gate.begin('case-a')!;
  busy = true;
  completeOld('obsolete crosshair');
  await pending;
  assert.equal(old.signal.aborted, true);
  assert.equal(visible, '');
  assert.equal(busy, true);
  assert.equal(current.isCurrent(), true);
  assert.equal(current.finish(), true);
  assert.equal(current.finish(), false);
});

test('case, workbook, role, exam, manifest and cursor changes invalidate pending work', () => {
  const initial = ['case-a', 'workbook-a', 'learner', 'teaching', 'manifest-1', 'frame-4'];
  initial.forEach((_, index) => {
    const gate = createLatestViewRequest();
    const context = JSON.stringify(initial);
    gate.setContext(context);
    const request = gate.begin(context)!;
    const changed = [...initial]; changed[index] += '-changed';
    gate.setContext(JSON.stringify(changed));
    assert.equal(request.signal.aborted, true);
    assert.equal(request.isCurrent(), false);
    assert.equal(request.finish(), false);
  });
});

test('reset at the same position cancels and allows a fresh selection', () => {
  const gate = createLatestViewRequest();
  gate.setContext('same-position');
  const old = gate.begin('same-position')!;
  gate.cancel();
  const fresh = gate.begin('same-position')!;
  assert.equal(old.isCurrent(), false);
  assert.equal(old.finish(), false);
  assert.equal(fresh.isCurrent(), true);
});

test('leave, return and Strict Mode cleanup cannot resurrect a response', () => {
  const gate = createLatestViewRequest();
  gate.setContext('a');
  const old = gate.begin('a')!;
  gate.setContext(null);
  gate.setContext('a');
  const current = gate.begin('a')!;
  gate.setContext('a'); // An unchanged committed context does not cancel.
  assert.equal(old.isCurrent(), false);
  assert.equal(current.isCurrent(), true);
  gate.setContext(null);
  assert.equal(current.signal.aborted, true);
});

test('saved-view reads and localizer requests do not cancel one another', () => {
  const localizer = createLatestViewRequest(), saved = createLatestViewRequest();
  localizer.setContext('a'); saved.setContext('a');
  const mapping = localizer.begin('a')!, read = saved.begin('a')!;
  saved.begin('a');
  assert.equal(read.isCurrent(), false);
  assert.equal(mapping.isCurrent(), true);
});
