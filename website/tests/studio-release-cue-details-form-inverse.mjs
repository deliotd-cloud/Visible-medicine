import assert from 'node:assert/strict';

// Later harness bytes followed by their exact current-queue preimage bytes.
export const releaseCueDetailsFormSeams = Object.freeze([
  [
    '  const editorSlots = [], editorLayouts = new Map(); let editorCursor = 0;\n',
    '  const editorSlots = []; let editorCursor = 0;\n',
  ],
  [
    '    useMemo(factory, deps) { const slot = editorCursor++, old = editorSlots[slot];\n' +
    '      if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) editorSlots[slot] = {deps, value: factory()};\n' +
    '      return editorSlots[slot].value;\n' +
    '    },\n',
    '',
  ],
  [
    '    useEffect() { editorCursor++; },\n' +
    '    useLayoutEffect(effect, deps) { const slot = editorCursor++, old = editorLayouts.get(slot);\n' +
    '      if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) editorLayouts.set(slot, {deps, effect, cleanup: old?.cleanup, pending: true});\n' +
    '    },\n',
    '    useEffect: () => {},\n',
  ],
  [
    '  return {forms, editor, requests, routes, historyWrites, renderEditor() {\n' +
    '    editorCursor = 0;\n' +
    '    const tree = editor.StudioCourseEditor({course, workbooks: [], releases: [], recoveryScope});\n' +
    '    for (const layout of editorLayouts.values()) if (layout.pending) {layout.pending = false; layout.cleanup?.(); layout.cleanup = layout.effect();}\n' +
    '    return tree;\n' +
    "  }, get refreshes() {return refreshes;}, dispose() {for(const layout of editorLayouts.values())layout.cleanup?.();globalThis.fetch = oldFetch;if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete globalThis.window;}};\n",
    "  return {forms, editor, requests, routes, historyWrites, renderEditor() {editorCursor = 0; return editor.StudioCourseEditor({course, workbooks: [], releases: [], recoveryScope});}, get refreshes() {return refreshes;}, dispose() {globalThis.fetch = oldFetch;if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete globalThis.window;}};\n",
  ],
]);

export function restoreReleaseCueDetailsForm(source, expectedPrior) {
  let prior = source.replaceAll('\r\n', '\n');
  for (const [later, earlier] of releaseCueDetailsFormSeams) {
    assert.equal(prior.split(later).length, 2, `One exact release-cue hook seam: ${later.slice(0, 72)}`);
    prior = prior.replace(later, earlier);
  }
  if (expectedPrior !== undefined) assert.equal(prior, expectedPrior, 'Whole current-queue source restored');
  return prior;
}
