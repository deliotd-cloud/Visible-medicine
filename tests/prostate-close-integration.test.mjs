import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { restoreStudyFocus } from '../source/app/study-return-focus.ts';

const source = readFileSync(new URL('../source/app/prostate-zones.tsx', import.meta.url), 'utf8');
const begin = source.indexOf('  const closeFromStudy = () => {');
assert.ok(begin >= 0, 'actual TSX close wrapper exists');
const end = source.indexOf('\n  };', begin);
assert.ok(end > begin, 'actual TSX close wrapper terminates');
const wrapper = source.slice(begin, end + '\n  };'.length);

function renderClose({ onClose, root }) {
  const frames = [];
  const calls = [];
  const studyRegion = { current: { closest: selector => {
    assert.equal(selector, '.body-app');
    calls.push('capture');
    return root;
  } } };
  const context = {
    studyRegion,
    onClose: () => { calls.push('close'); onClose(); studyRegion.current = null; },
    requestAnimationFrame: callback => { calls.push('schedule'); frames.push(callback); },
    restoreStudyFocus: value => { calls.push('fallback'); return restoreStudyFocus(value); },
  };
  const close = vm.runInNewContext(`${stripTypeScriptTypes(wrapper)}\ncloseFromStudy`, context);
  return { close, frames, calls };
}

function focusFixture() {
  const body = { isConnected: true, getClientRects: () => [{}] };
  const doc = { body, activeElement: body };
  const target = {
    isConnected: true, calls: [],
    getClientRects: () => [{}], closest: () => null, matches: () => false,
    focus(options) { this.calls.push(options); doc.activeElement = this; },
  };
  const root = { isConnected: true, ownerDocument: doc, querySelector: () => target };
  return { body, doc, target, root };
}

test('actual close wrapper calls parent before frame fallback', () => {
  const { root, target } = focusFixture();
  const flow = renderClose({ onClose: () => {}, root });
  flow.close();
  assert.deepEqual(flow.calls, ['capture', 'close', 'schedule']);
  assert.equal(target.calls.length, 0);
  flow.frames[0]();
  assert.deepEqual(flow.calls, ['capture', 'close', 'schedule', 'fallback']);
  assert.deepEqual(target.calls, [{ preventScroll: true }]);
});

test('parent restored visible launcher retains focus', () => {
  const { doc, root, target } = focusFixture();
  const launcher = { isConnected: true, getClientRects: () => [{}] };
  const flow = renderClose({ onClose: () => { doc.activeElement = launcher; }, root });
  flow.close();
  flow.frames[0]();
  assert.equal(doc.activeElement, launcher);
  assert.equal(target.calls.length, 0);
});

test('captured root disconnected during unmount is skipped', () => {
  const { root, target } = focusFixture();
  const flow = renderClose({ onClose: () => { root.isConnected = false; }, root });
  flow.close();
  flow.frames[0]();
  assert.equal(target.calls.length, 0);
});

test('Back and Escape use only the explicit close wrapper', () => {
  assert.match(source, /if \(event\.key === 'Escape' && !event\.defaultPrevented\)\s*\{\s*event\.stopPropagation\(\);\s*closeFromStudy\(\);/);
  assert.match(source, /className="prostate-zones-close" onClick=\{closeFromStudy\}/);
  assert.equal((source.match(/requestAnimationFrame\(\(\) => restoreStudyFocus\(root\)\)/g) ?? []).length, 1);
  assert.doesNotMatch(source, /useEffect\([^]*?return\s*\(\)\s*=>\s*restoreStudyFocus/);
});
