// Exercise actual BodyExplorer handlers with the real practice reducer.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, runInContext, runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';

const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['startExam', 'restorePracticeView', 'exitPractice', 'nextQuestion'];
const handlers = [];
const printer = ts.createPrinter();
function visit(node) {
  if (ts.isFunctionDeclaration(node) && names.includes(node.name?.text)) handlers.push(printer.printNode(ts.EmitHint.Unspecified, node, ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(handlers.length, names.length);
const code = ts.transpileModule(handlers.join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
assert.match(source, /exam \? exitPractice\(\) : startExam\(\)/, 'Actual exit button uses restoration handler');
const built = await build({ stdin: {
  contents: "export {practiceReducer,initialPractice} from './lib/atlas-practice'; export {copyRecoveryCamera} from './lib/renderer-health';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, platform: 'node', format: 'cjs', write: false });
const compiled = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: compiled, exports: compiled.exports });
const { practiceReducer, initialPractice, copyRecoveryCamera } = compiled.exports;
const plain = x => JSON.parse(JSON.stringify(x));

function setup(mode = 'name', layout = 'tray', camera = { direction: [1, 0, 0], up: [0, 1, 0], pan: [0.2, 0, 0], scale: 0.8 }) {
  const state = {
    selectedId: 'diaphragm', isolated: true, focus: true, explode: 65, layout,
    plate: layout === 'tray', zoom: 1.7, view: 'posterior', reset: 0,
    cameraCapture: { current: camera }, cameraRestore: { current: camera },
    practiceReturnView: { current: null }, practiceSerial: { current: 0 },
    practice: initialPractice, exam: false, practiceBlocked: false, practicePaused: false,
    available: [], practiceLoadStatus: { loaded: [] }, practiceMode: mode,
    practiceCount: 2, practiceSampling: 'landmarks', focusTargetIds: [], retryIds: ['a'], retryCount: 1,
    question: 0, answered: false,
    copyRecoveryCamera,
    createPracticeSession(_items, _loaded, options) {
      return { ...initialPractice, id: options.id, status: 'active', mode,
        questions: [{ target: 'a', choices: ['a', 'b'] }, { target: 'b', choices: ['a', 'b'] }],
        renderedIds: ['a', 'b'], responses: [], index: 0 };
    },
  };
  for (const key of ['selectedId', 'isolated', 'focus', 'explode', 'layout', 'plate', 'zoom', 'view', 'reset']) {
    state['set' + key[0].toUpperCase() + key.slice(1)] = value => { state[key] = typeof value === 'function' ? value(state[key]) : value; };
  }
  state.practiceDispatch = action => { state.practice = practiceReducer(state.practice, action); };
  const context = createContext(state);
  runInContext(code, context);
  const call = expression => runInContext(expression, context);
  // React rerenders refresh closed-over exam/question flags between UI events.
  const render = () => {
    state.exam = state.practice.status === 'active'; state.question = state.practice.index;
    state.answered = !!state.practice.responses[state.question];
  };
  return { state, call, render };
}
const keys = ['selectedId', 'isolated', 'focus', 'explode', 'layout', 'plate', 'zoom', 'view'];
const snapshot = state => Object.fromEntries(keys.map(key => [key, state[key]]));
let scenarios = 0;
for (const mode of ['find', 'name', 'reason']) for (const layout of ['spatial', 'extract', 'tray']) {
  for (const finish of [false, true]) {
    const { state, call, render } = setup(mode, layout);
    const before = snapshot(state), camera = plain(state.cameraCapture.current);
    call('startExam()'); render();
    assert.equal(state.selectedId, null, 'No study selection leaked into active quiz');
    assert.equal(state.cameraRestore.current, null, 'Old restoration cannot override quiz camera');
    state.cameraCapture.current.pan[0] = 99;
    state.view = 'anterior'; state.zoom = 0.5;
    if (finish) {
      for (let i = 0; i < 2; i++) {
        state.practiceDispatch({ type: 'answer', sessionId: state.practice.id, index: i, chosen: null }); render();
        call('nextQuestion()'); render();
        if (!i) assert.equal(state.selectedId, null, 'Intermediate question does not restore');
      }
      assert.equal(state.practice.status, 'complete');
      assert.equal(state.practice.responses.length, 2, 'Results retained');
    } else { call('exitPractice()'); render(); assert.notEqual(state.practice.status, 'active'); }
    assert.deepEqual(snapshot(state), before, `${mode}/${layout}/${finish ? 'finish' : 'exit'}`);
    assert.deepEqual(plain(state.cameraRestore.current), camera, 'Camera captured by value before quiz');
    assert.equal(state.practiceReturnView.current, null, 'Restore consumed exactly once');
    state.selectedId = 'new-selection'; call('restorePracticeView()');
    assert.equal(state.selectedId, 'new-selection', 'No stale second restore');
    scenarios++;
  }
}
for (const guard of ['practiceBlocked = true', 'exam = true', 'createPracticeSession = () => null']) {
  const { state, call } = setup();
  const before = snapshot(state); call(guard); call('startExam()');
  assert.deepEqual(snapshot(state), before);
  assert.equal(state.practiceReturnView.current, null);
  scenarios++;
}
{
  const { state, call, render } = setup('name', 'spatial', null);
  call('startExam()'); render(); call('exitPractice()'); render();
  assert.equal(state.cameraRestore.current, null, 'No camera snapshot is valid');
  state.selectedId = 'heart'; state.explode = 12;
  call('startExam(true)'); render(); call('exitPractice()');
  assert.equal(state.selectedId, 'heart'); assert.equal(state.explode, 12, 'Retry captures latest study state');
  scenarios++;
}
console.log(`PASS ${scenarios} actual-handler practice return scenarios; quiz reducer, camera copy and exit wiring checked.`);
