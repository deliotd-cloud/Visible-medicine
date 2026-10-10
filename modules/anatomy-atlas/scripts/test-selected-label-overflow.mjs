import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectedLabelNeedsCompact } from '../lib/scene-label-size.ts';
import ts from 'typescript';
import { structures, quizQuestions } from '../app/anatomy-data.ts';
import { currentReviewDocument, reviewDocumentForDisplay } from './review-revision-evidence.mjs';

// A DOM-size fixture: the displayed button can shorten independently, while
// the off-layout name keeps its natural full-text height at the same width.
function fixture(nameHeight, depthVisible = false) {
  const name = { offsetHeight: nameHeight, style: { width: '' } };
  const depth = { offsetHeight: 35 };
  const button = {
    clientWidth: 149,
    offsetHeight: nameHeight + 20,
    querySelector(selector) {
      return selector === '.scene-label-measure' ? name : depth;
    },
  };
  const original = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (element) => element === button
    ? { paddingLeft: '8px', paddingRight: '8px', paddingTop: '5px',
      paddingBottom: '5px', borderTopWidth: '1px', borderBottomWidth: '1px' }
    : { display: depthVisible ? 'block' : 'none', marginTop: '3px' };
  return { button, name, restore: () => { globalThis.getComputedStyle = original; } };
}

test('the observed 402px selected name compacts against a 412px canvas', () => {
  const dom = fixture(390);
  try {
    assert.equal(selectedLabelNeedsCompact(dom.button, 392), true);
    assert.equal(dom.name.style.width, '133px');
    dom.button.offsetHeight = 82; // two visible lines after clamping
    assert.equal(selectedLabelNeedsCompact(dom.button, 392), true,
      'compact display must not toggle back based on its shortened box');
    assert.equal(selectedLabelNeedsCompact(dom.button, 700), false,
      'a taller canvas restores the full name');
  } finally { dom.restore(); }
});

test('normal labels remain full and covered depth is included', () => {
  const dom = fixture(95, true);
  try {
    assert.equal(selectedLabelNeedsCompact(dom.button, 200), false);
    assert.equal(selectedLabelNeedsCompact(dom.button, 144), true);
  } finally { dom.restore(); }
});

test('component keeps full accessible name, selected-only fallback and offscreen dot hiding', async () => {
  const source = await readFile(new URL('../app/scene-label-layer.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../app/scene-label-layer.css', import.meta.url), 'utf8');
  assert.match(source, /aria-label=\{entry\.name\}/);
  assert.match(source, /entry\.selected &&\s*selectedLabelNeedsCompact/);
  assert.match(source, /if \(projectedPoint\) \{/);
  assert.match(source, /label \? 'visible' : 'hidden'/);
  assert.match(source, /<span className="scene-label-depth"/);
  assert.match(source, /className="scene-label-measure-clip" aria-hidden="true"/);
  assert.match(css, /\.scene-label-measure-clip\s*\{[^}]*height: 0;[^}]*overflow: hidden;/);
  assert.match(css, /button\.scene-label\.selected\[data-compact='true'\]/);
  assert.match(css, /-webkit-line-clamp: 2/);
});

test('every local label-layer dependency is bound into all nine shoulder display reviews', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/models/bodyparts3d/manifest.json', import.meta.url), 'utf8'));
  const current = await currentReviewDocument(manifest, structures, quizQuestions);
  const display = new Map(current.display);
  const source = await readFile(new URL('../app/scene-label-layer.tsx', import.meta.url), 'utf8');
  for (const { fileName } of ts.preProcessFile(source, true, true).importedFiles) {
    const path = fileName.startsWith('@/') ? fileName.slice(2) + '.ts'
      : fileName.startsWith('./') ? 'app/' + fileName.slice(2) : null;
    if (path) assert(display.has(path), 'Unbound local label dependency: ' + path);
  }
  assert.equal(structures.length, 9);
  for (const path of ['lib/scene-label-size.ts', 'lib/scene-label-focus.ts']) {
    const altered = current.display.map(([name, hash]) => [name, name === path ? '0'.repeat(64) : hash]);
    const changed = reviewDocumentForDisplay(manifest, structures, quizQuestions, altered,
      // Use the same teaching tour binding as the actual generator.
      (await import('node:crypto')).createHash('sha256').update(
        (await readFile(new URL('../lib/shoulder-tours.ts', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')).digest('hex'));
    for (const { id } of structures) {
      assert.notEqual(changed.revisions[id].geometry, current.revisions[id].geometry, path + ': ' + id);
      assert.equal(changed.revisions[id].teaching, current.revisions[id].teaching);
      assert.equal(changed.revisions[id].imaging, null);
    }
  }
});
