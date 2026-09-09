import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-component-test-build.mjs';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const require = createRequire(new URL('package.json', root));
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = await build({
  stdin: {
    contents: `export * from './lib/atlas-practice';
export * from './lib/reasoning-questions';
export { ReasoningFeedback } from './app/reasoning-feedback';
export * as base from './lib/anatomy-practice';`,
    resolveDir: fileURLToPath(root),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const testModule = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  require,
  module: testModule,
  exports: testModule.exports,
});
const api = testModule.exports;
const read = (path) => readFile(new URL(path, root), 'utf8');
const hash = (text) => createHash('sha256').update(text).digest('hex');
const catalogBytes = await read(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(catalogBytes);
const indexBytes = await read(
  'LICENSES/bodyparts3d-v4-index/isa_element_parts.txt',
);
const rows = indexBytes
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split('\t'));
const loaded = catalog.bundles.map((b) => b.id);
const all = catalog.structures;
const definitionsBefore = JSON.stringify(api.reasoningConcepts);
let checks = 0,
  serial = 0,
  negativeCases = 0;
const same = (a, b, message) => {
  checks++;
  // Executed source lives in a VM realm; compare cloned values, not prototypes.
  assert.deepEqual(structuredClone(a), structuredClone(b), message);
};
const check = (condition, message) => {
  checks++;
  assert(condition, message);
};
const options = (extra) => ({
  id: ++serial,
  mode: 'reason',
  sampling: 'all',
  count: 20,
  ...extra,
});
const create = (
  scope = all,
  extra = {},
  bundles = loaded,
  random = () => 0.314159,
) => api.createPracticeSession(scope, bundles, options(extra), random);
const bound = all.filter(api.reasoningConceptFor);
same(api.reasoningConcepts.length, 38);
same(bound.length, 76);
same(bound.filter((s) => s.region === 'shoulder-arm').length, 20);
same(bound.filter((s) => s.region === 'forearm').length, 12);
same(bound.filter((s) => s.region === 'hand').length, 20);
same(bound.filter((s) => s.region === 'thigh').length, 24);
same(new Set(api.reasoningConcepts.map((c) => c.key)).size, 38);
same(
  hash(
    JSON.stringify(
      api.reasoningConcepts.filter(
        (c) => !['hand', 'thigh'].includes(c.region),
      ),
    ),
  ),
  'f4003687431080f6978cfd5fec6400cb0ee309d0a2c62119251558e3d647089e',
  'Existing shoulder/forearm question records are unchanged',
);
same(
  hash(
    JSON.stringify(api.reasoningConcepts.filter((c) => c.region !== 'thigh')),
  ),
  '4d38a5948cf93eb4e58d5666805d02b00f0d4d844fb5528e5d7208b9d93dc60b',
  'All 26 earlier question records are unchanged',
);
same(
  hash(catalogBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
  'Catalogue remains source-audited, not repinned for this feature',
);
for (const concept of api.reasoningConcepts) {
  same(concept.readiness, 'draft');
  same(concept.revision, 1);
  same(concept.bindings.length, 2);
  same(new Set(concept.bindings.map((b) => b.side)).size, 2);
  same(new Set(concept.distractors).size, 3);
  check(!concept.distractors.includes(concept.key));
  check(concept.prompt.length > 40 && concept.explanation.length > 40);
  check(concept.references.length > 0);
  for (const ref of concept.references)
    check(new URL(ref.url).protocol === 'https:');
  for (const binding of concept.bindings) {
    same(
      rows.filter((row) => row[0] === binding.fma).map((row) => row[2]),
      [binding.file],
      'Complete official element-file membership',
    );
    const s = bound.find((s) => s.fmaId === binding.fma);
    check(s && s.laterality === binding.side);
    same(s.region, concept.region);
    same(s.regions, concept.sourceRegions ?? [concept.region]);
    same(api.reasoningConceptFor(s)?.key, concept.key);
    same(
      api.reasoningConceptFor({
        ...s,
        name: 'Unrelated display label',
        sourceName: 'Changed display label',
      })?.key,
      concept.key,
      'No display-name matching',
    );
    for (const mutation of [
      { fmaId: 'FMA000000' },
      { laterality: 'unpaired' },
      { system: 'organs' },
      { category: 'unknown' },
      { sourceTree: 'partof' },
      { region: 'foot' },
      { region: concept.region === 'forearm' ? 'shoulder-arm' : 'forearm' },
      { regions: [concept.region === 'forearm' ? 'shoulder-arm' : 'forearm'] },
      { regions: ['shoulder-arm', 'hand'] },
      { regions: ['foot'] },
      { regions: [] },
      { regions: [...s.regions, 'spine'] },
      ...(s.regions.length > 1
        ? [
            { regions: [s.regions[0]] },
            { regions: [...s.regions].reverse() },
            { regions: [s.regions[0], s.regions[0]] },
          ]
        : []),
      { sources: [] },
      { sources: [...s.sources, ...s.sources] },
      { sources: [{ ...s.sources[0], file: 'FJ0000' }] },
    ]) {
      negativeCases++;
      same(
        api.reasoningConceptFor({ ...s, ...mutation }),
        undefined,
        'Changed identity/scope/component rejected',
      );
    }
  }
}
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
  for (const side of ['both', 'left', 'right']) {
    const scope = all.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' || s.laterality === side),
    );
    const session = create(scope);
    const count = api.practiceQuestionCount(scope, 'reason');
    same(
      session?.questions.length ?? 0,
      Math.min(20, count),
      'Available concept count respects the existing 20-question session cap',
    );
    same(api.practiceCanStart(scope, 'reason'), count > 0);
    if (
      ![
        'whole-body',
        'shoulder-arm',
        'forearm',
        'hand',
        'thigh',
        'pelvis',
      ].includes(region)
    )
      same(session, null, 'No unbound regional question is invented');
    if (!session) continue;
    const expected =
      region === 'whole-body'
        ? 20
        : region === 'forearm'
          ? 6
          : region === 'thigh'
            ? 12
            : region === 'pelvis'
              ? 2
              : 10;
    same(session.questions.length, expected);
    same(
      new Set(session.questions.map((q) => q.reasoning.key)).size,
      expected,
      'Do not repeat contralateral versions',
    );
    for (const q of session.questions) {
      const target = scope.find((s) => s.id === q.target),
        concept = api.reasoningConceptFor(target);
      same(q.choices.length, region === 'pelvis' ? 2 : 4);
      same(new Set(q.choices).size, q.choices.length);
      check(q.choices.includes(q.target));
      for (const id of q.choices) {
        const choice = scope.find((s) => s.id === id);
        check(choice && choice.laterality === target.laterality);
        check(
          id === q.target ||
            concept.distractors.includes(api.reasoningConceptFor(choice)?.key),
        );
      }
    }
  }
}
same(create(all, {}, []), null, 'Unloaded questions excluded');
same(create(all, { sampling: 'focus', focusIds: [] }), null);
same(create([bound[0]]), null, 'No single-answer question');
const target = bound.find((s) => s.fmaId === 'FMA32544');
const alternative = bound.find((s) => s.fmaId === 'FMA32547');
const pair = [target, alternative];
const targetIds = pair.map((s) => s.id);
same(
  create(all, { sampling: 'focus', focusIds: targetIds })?.questions.length,
  2,
);
same(
  create(pair)?.questions.every((q) => q.choices.length === 2),
  true,
  'Narrow focus still has honest alternatives',
);
same(create(all, { sampling: 'focus', focusIds: [target.id] }), null);
same(create(all, { retryIds: [] }), null);
same(create(all, { retryIds: ['not-in-catalogue'] }), null);
const twoSides = bound
  .filter((s) => api.reasoningConceptFor(s).key === 'supraspinatus')
  .map((s) => s.id);
same(api.practiceQuestionCount(all, 'reason', twoSides), 1);
same(
  create(all, { retryIds: twoSides })?.questions.length,
  1,
  'Retry count is concept-based',
);
same(
  api.practiceQuestionCount([target], 'reason', [target.id]),
  0,
  'Lost distractor disables retry',
);
same(create([target], { retryIds: [target.id] }), null);
for (const count of [1, 5, 10, 20, 100, NaN, Infinity, -10]) {
  same(
    create(all, { count }).questions.length,
    Math.min(
      38,
      Math.max(1, Math.min(20, Math.floor(Number.isFinite(count) ? count : 5))),
    ),
  );
}
for (const value of [NaN, Infinity, -Infinity, -1, 0, 1, 20])
  check(
    create(all, {}, loaded, () => value)?.questions.length === 20,
    'Random edge remains finite',
  );
same(create(all, { id: 0 }), null);
same(create(all, { id: 1.5 }), null);
const session = create(all, { count: 10 });
const markup = (session, index) =>
  renderToStaticMarkup(
    createElement(api.ReasoningFeedback, { session, index }),
  );
same(
  markup(session),
  '',
  'Real React component reveals no feedback before an answer',
);
same(
  api.practiceRenderIds(session),
  session.questions[0].choices,
  'Reasoning renders all alternatives, not just the correct answer',
);
for (const chosen of [
  session.questions[0].target,
  session.questions[0].choices.find((id) => id !== session.questions[0].target),
  null,
]) {
  const answered = api.practiceReducer(session, {
    type: 'answer',
    sessionId: session.id,
    index: 0,
    chosen,
  });
  same(answered.responses.length, 1);
  check(markup(answered).includes('Sources &amp; scope'));
  check(markup(answered).includes('educator review pending'));
  check(
    markup(answered).includes(session.questions[0].reasoning.references[0].url),
  );
  same(
    api.practiceReducer(answered, {
      type: 'answer',
      sessionId: session.id,
      index: 0,
      chosen,
    }),
    answered,
    'Answer once',
  );
  const next = api.practiceReducer(answered, {
    type: 'next',
    sessionId: session.id,
    index: 0,
  });
  same(next.index, 1);
  same(markup(next), '', 'Next unanswered explanation stays hidden');
  check(markup(next, 0).length > 0, 'Answered result remains reviewable');
  same(api.practiceRenderIds(next), next.questions[1].choices);
}
for (const action of [
  { type: 'answer', sessionId: session.id + 1, index: 0, chosen: null },
  { type: 'answer', sessionId: session.id, index: 1, chosen: null },
  { type: 'answer', sessionId: session.id, index: 0, chosen: 'foreign-choice' },
  { type: 'next', sessionId: session.id, index: 0 },
  { type: 'start', session: create() },
])
  same(
    api.practiceReducer(session, action),
    session,
    'Stale/foreign/premature action ignored',
  );
let completed = session;
for (let i = 0; i < session.questions.length; i++) {
  const chosen =
    i % 3 === 0
      ? completed.questions[i].target
      : i % 3 === 1
        ? null
        : completed.questions[i].choices.find(
            (id) => id !== completed.questions[i].target,
          );
  completed = api.practiceReducer(completed, {
    type: 'answer',
    sessionId: session.id,
    index: i,
    chosen,
  });
  completed = api.practiceReducer(completed, {
    type: 'next',
    sessionId: session.id,
    index: i,
  });
}
same(completed.status, 'complete');
same(api.practiceScore(completed), 4);
same(api.missedPracticeIds(completed.responses).length, 6);
same(api.practiceRenderIds(completed), []);
same(
  create(all, { retryIds: api.missedPracticeIds(completed.responses) })
    .questions.length,
  6,
);
for (let i = 0; i < 10; i++) check(markup(completed, i).length > 0);
for (const index of [-1, 0.5, 10, NaN, Infinity])
  same(markup(completed, index), '', 'Invalid/unanswered index stays hidden');
same(api.practiceReducer(session, { type: 'exit' }).status, 'idle');
same(api.practiceReducer(completed, { type: 'dismiss' }), {
  ...api.initialPractice,
  id: completed.id,
});
same(
  api.practiceReducer(completed, { type: 'start', session }),
  completed,
  'Same session cannot restart',
);
session.questions[0].reasoning.references[0].title = 'Session-local edit';
same(
  JSON.stringify(api.reasoningConcepts),
  definitionsBefore,
  'Session references are detached',
);
same(
  JSON.stringify(catalog),
  JSON.stringify(JSON.parse(catalogBytes)),
  'Catalogue untouched',
);
for (const mode of ['find', 'name'])
  for (const sampling of ['all', 'landmarks', 'focus']) {
    const opts = options({ mode, sampling, count: 5, focusIds: targetIds });
    const actual = api.createPracticeSession(all, loaded, opts, () => 0.31);
    const expected = api.base.createPracticeSession(
      all,
      loaded,
      opts,
      () => 0.31,
    );
    same(actual, expected, 'Existing modes preserve original algorithm');
    same(api.practiceRenderIds(actual), api.base.practiceRenderIds(expected));
    for (const action of [
      { type: 'answer', sessionId: actual.id, index: 0, chosen: null },
      { type: 'exit' },
      { type: 'dismiss' },
    ])
      same(
        api.practiceReducer(actual, action),
        api.base.practiceReducer(expected, action),
      );
  }
const explorer = await read('app/body-explorer.tsx');
// Execute the three changed real handler bodies with explicit state/callback
// fixtures. This is not a browser or a replacement implementation of the handlers.
const ast = ts.createSourceFile(
  'body.tsx',
  explorer,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const handlers = new Map();
let modeSelector;
function visit(node) {
  if (
    ts.isFunctionDeclaration(node) &&
    ['onSceneSelect', 'startExam', 'nextQuestion'].includes(node.name?.text)
  )
    handlers.set(node.name.text, node.getText(ast));
  if (
    ts.isJsxAttribute(node) &&
    node.name.text === 'onValueChange' &&
    node.initializer?.expression?.getText(ast).includes('setPracticeMode')
  )
    modeSelector = node.initializer.expression.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
function handler(name, env) {
  const text = handlers.get(name);
  check(text, 'Actual handler exists: ' + name);
  const code = ts.transpileModule(text, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return runInNewContext(code + '; ' + name, env);
}
for (const mode of ['find', 'name', 'reason'])
  for (const exam of [false, true])
    for (const displayReady of [false, true]) {
      const calls = [];
      handler('onSceneSelect', {
        displayReady,
        exam,
        practice: { mode },
        submitPractice: (id) => calls.push(['answer', id]),
        select: (id) => calls.push(['select', id]),
      })(target.id);
      same(
        calls,
        !displayReady || (exam && mode === 'name')
          ? []
          : [[exam ? 'answer' : 'select', target.id]],
        'Picking routes only to permitted practice modes',
      );
    }
for (const mode of ['find', 'name', 'reason'])
  for (const practicePaused of [false, true]) {
    const calls = [];
    handler('nextQuestion', {
      practicePaused,
      practice: { mode, id: 7 },
      question: 2,
      practiceDispatch: (a) => calls.push(a),
      setZoom: (z) => calls.push(z),
      setReset: (f) => calls.push(f(10)),
    })();
    same(
      calls,
      practicePaused
        ? []
        : [
            { type: 'next', sessionId: 7, index: 2 },
            ...(mode === 'find' ? [] : [1, 11]),
          ],
      'Next respects pause and resets reasoning camera',
    );
  }
for (const gate of ['ready', 'exam', 'blocked', 'no-retry']) {
  const calls = [];
  const env = {
    exam: gate === 'exam',
    practiceBlocked: gate === 'blocked',
    retryCount: gate === 'no-retry' ? 0 : 1,
    retryIds: [target.id],
    available: all,
    practiceLoadStatus: { loaded },
    practiceSerial: { current: 100 },
    practiceMode: 'reason',
    practiceCount: 5,
    practiceSampling: 'all',
    focusTargetIds: [],
    createPracticeSession: api.createPracticeSession,
    layout: 'tray',
    practiceDispatch: (a) => calls.push(['dispatch', a]),
  };
  for (const key of [
    'setPlate',
    'setLayout',
    'setSelectedId',
    'setIsolated',
    'setFocus',
    'setExplode',
    'setZoom',
    'setReset',
  ])
    env[key] = (value) =>
      calls.push([key, typeof value === 'function' ? value(3) : value]);
  handler('startExam', env)(true);
  if (gate !== 'ready') {
    same(calls, []);
    same(env.practiceSerial.current, 100);
  } else {
    const started = calls.find((c) => c[0] === 'dispatch')[1].session;
    same(started.mode, 'reason');
    same(started.questions.length, 1);
    same(started.questions[0].target, target.id);
    check(
      calls.some((c) => c[0] === 'setSelectedId' && c[1] === null),
      'Start clears answer highlighting',
    );
    check(calls.some((c) => c[0] === 'setExplode' && c[1] === 0));
    check(calls.some((c) => c[0] === 'setPlate' && c[1] === false));
  }
}
check(modeSelector, 'Actual practice selector found');
const selectorCode = ts.transpileModule('const selector = ' + modeSelector, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const selectedModes = [];
const selector = runInNewContext(selectorCode + '; selector', {
  setPracticeMode: (value) => selectedModes.push(value),
});
for (const mode of ['find', 'name', 'reason', 'unknown']) selector(mode);
same(selectedModes, ['find', 'name', 'reason']);
for (const guard of [
  'labels={labels && !exam}',
  'landmarks={exam ? [] : stageLandmarks}',
  'inspection={exam ? initialInspection : inspection}',
  'plate={plate && !exam}',
  'practiceBlocked || retryCount === 0',
])
  check(explorer.includes(guard), 'Preserved exam/scope guard: ' + guard);
const report = {
  schemaVersion: 1,
  checks,
  negativeIdentityCases: negativeCases,
  concepts: api.reasoningConcepts.length,
  exactRepresentations: bound.length,
  regionalConcepts: { 'shoulder-arm': 10, forearm: 6, hand: 10, thigh: 12 },
  sharedRegionConcepts: { pelvis: 2 },
  sourceHashes: {
    catalog: hash(catalogBytes),
    officialElementIndex: hash(indexBytes),
    questions: hash(definitionsBefore),
  },
  verification: [
    'Official complete FMA/file membership',
    'Exact identity/scope rejection',
    'Visible/loaded/focus/retry eligibility',
    'One question per concept',
    'Same-side curated alternatives',
    'Answer-once and stale-response guards',
    'Actual React server-rendered feedback gate',
    'Actual scene-pick, start, next and mode-selector handler execution',
    'Existing identification algorithm parity',
  ],
  boundaries: {
    clinicalApproval: false,
    educatorApproval: false,
    browserInteraction: false,
    spatialValidation: false,
    validatedAssessment: false,
  },
};
await writeFile(
  new URL('docs/reasoning-practice-validation.json', root),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
