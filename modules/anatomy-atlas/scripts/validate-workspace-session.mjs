import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Run the actual hook with persistent hook slots and fresh render callbacks.
// Browser/component checks separately cover the React/3D integration.
const source = await readFile('app/workspace-session.ts', 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
function fixture() {
  const slots = []; let cursor = 0;
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((v,j) => v !== slots[i].deps[j])) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    useMemo(fn, deps) { return hooks.useCallback(fn, deps)(); },
  };
  const exports = {};
  runInNewContext(code, { exports, structuredClone, require: name => {
    assert.equal(name, 'react'); return hooks;
  } });
  let display = { explode: 0, hidden: [], history: [], camera: null };
  let restores = 0;
  return {
    get display() { return display; },
    set display(value) { display = value; },
    get restores() { return restores; },
    render() {
      cursor = 0;
      const captured = display;
      return exports.useWorkspaceSession(() => captured, value => {
        display = value; restores++;
      }, () => ({ explode: 0, hidden: [], history: [], camera: null }));
    },
  };
}
const a = fixture(); let session = a.render();
assert.equal(session.mode, 'explore');
const choose = session.chooseMode;
choose('explore'); assert.equal(a.restores, 0);
a.display = { explode: 0, hidden: ['vessel-type-filter'], history: [], camera: { zoom: 2 } };
session = a.render(); assert.equal(session.chooseMode, choose);
choose('dissect'); session = a.render();
assert.equal(session.mode, 'dissect'); assert.equal(a.display.explode, 0);
assert.deepEqual(a.display.hidden, []);
a.display = { explode: 60, hidden: ['platysma'], history: [{ hidden: [] }], camera: { zoom: 3 } };
session = a.render(); choose('explore');
assert.deepEqual(a.display, { explode: 0, hidden: ['vessel-type-filter'], history: [], camera: { zoom: 2 } });
session = a.render(); choose('dissect'); session = a.render();
assert.equal(a.display.explode, 60); assert.equal(a.display.camera.zoom, 3);
assert.deepEqual(a.display.history, [{ hidden: [] }]);
const detached = a.display;
choose('practice'); session = a.render(); assert.equal(session.mode, 'practice');
// Quiz changes, including accidental nested mutation, cannot alter stored dissection.
detached.hidden.push('quiz'); detached.history[0].hidden.push('quiz');
a.display = { explode: 0, hidden: ['quiz'], history: [], camera: null };
session = a.render(); choose('explore'); session = a.render();
assert.deepEqual(a.display.hidden, ['vessel-type-filter']);
choose('dissect'); session = a.render();
assert.deepEqual(a.display.hidden, ['platysma']);
assert.deepEqual(a.display.history, [{ hidden: [] }]);
const restores = a.restores;
choose('explore'); choose('explore'); assert.equal(a.restores, restores + 1);
const b = fixture(); b.render().chooseMode('dissect');
assert.equal(b.display.explode, 0); assert.deepEqual(b.display.hidden, []);
console.log('Workspace sessions: mode defaults, latest capture, stable callback, independent states, history/camera retention, cloned quiz isolation and duplicate-event guards pass.');
