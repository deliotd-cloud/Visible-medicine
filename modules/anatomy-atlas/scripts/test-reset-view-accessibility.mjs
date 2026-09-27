import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../app/body-explorer.tsx', import.meta.url), 'utf8');
const resetView = source.match(/function resetView\(\) \{([\s\S]*?)\n  \}/)?.[1];
const resetButton = source.match(/<Button\s+size="icon"\s+variant="ghost"\s+aria-label="([^"]+)"\s+aria-describedby="reset-view-help"\s+title="([^"]+)"\s+onClick=\{resetView\}/);

test('reset control describes the state reset by its handler', () => {
  assert.ok(resetView, 'resetView handler exists');
  assert.ok(resetButton, 'reset button has an accessible name and hover help');

  const [button, label, help] = resetButton;
  assert.match(button, /onClick=\{resetView\}/);
  for (const [state, description] of [
    ['setReset', 'camera'],
    ['setLayout', 'layout'],
    ['setInspection', 'cutaway'],
    ['setFocus', 'focus'],
    ['setIsolated', 'isolation'],
    ['setExplode', 'separation'],
  ]) {
    assert.match(resetView, new RegExp(`\\b${state}\\(`), `${description} is reset`);
    assert.match(label, new RegExp(`\\b${description}\\b`, 'i'), `${description} is named`);
  }
  assert.doesNotMatch(resetView, /\bset(?:Systems|Dissection)\(/);
  assert.match(help, /system visibility/i);
  assert.match(help, /removed structures/i);
  for (const state of ['setShowOrigins', 'setAnchorSkeleton'])
    assert.match(resetView, new RegExp(`\\b${state}\\(false\\)`));
  assert.match(source, /<span id="reset-view-help" className="sr-only">\s*Original-position guides and bone pinning are reset\. System visibility and removed structures remain unchanged\.\s*<\/span>/);
});
