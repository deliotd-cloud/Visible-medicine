import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';
import { fileURLToPath } from 'node:url';
let checks = 0;
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/anatomy-practice'; export * from './app/dissection-data'; export { structures as shoulderStructures, quizQuestions } from './app/anatomy-data';",
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const bytes = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(bytes),
  loaded = catalog.bundles.map((b) => b.id);
const digest = createHash('sha256').update(bytes).digest('hex');
same(
  digest,
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
  'Current source-audited anatomy and source bindings',
);
const hashBefore = JSON.stringify(catalog);
let serial = 0;
const random = () => 0.314159;
for (const [region, profile] of Object.entries(api.dissectionProfiles))
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['unpaired', 'midline', 'unspecified'].includes(s.laterality)),
    );
    for (const sampling of ['all', 'landmarks'])
      for (const mode of ['find', 'name'])
        for (const count of [5, 10, 20]) {
          const session = api.createPracticeSession(
            scope,
            loaded,
            { id: ++serial, mode, sampling, count },
            random,
          );
          check(session);
          same(session.questions.length, Math.min(scope.length, count));
          same(
            new Set(session.questions.map((q) => q.target)).size,
            session.questions.length,
          );
          for (const q of session.questions) {
            const target = scope.find((s) => s.id === q.target);
            check(target);
            if (mode === 'name') {
              check(q.choices.includes(q.target));
              check(q.choices.length >= 2 && q.choices.length <= 4);
              same(new Set(q.choices).size, q.choices.length);
              const entries = q.choices.map((id) =>
                scope.find((s) => s.id === id),
              );
              check(entries.every(Boolean));
              same(
                new Set(entries.map((s) => s.name.toLowerCase())).size,
                entries.length,
              );
              if (
                scope.filter(
                  (s) =>
                    s.id !== target.id &&
                    s.system === target.system &&
                    s.laterality === target.laterality,
                ).length >= 3
              )
                check(
                  entries.every(
                    (s) =>
                      s.system === target.system &&
                      s.laterality === target.laterality,
                  ),
                  'Comparable distractors preferred',
                );
            } else same(q.choices, []);
          }
          let state = api.practiceReducer(api.initialPractice, {
            type: 'start',
            session,
          });
          const snapshot = JSON.stringify(session);
          const firstQuestion = state.questions[0];
          same(
            api.practiceReducer(state, {
              type: 'start',
              session: { ...session, id: ++serial },
            }),
            state,
            'Double start ignored while active',
          );
          same(
            api.practiceReducer(state, {
              type: 'next',
              sessionId: state.id,
              index: 0,
            }),
            state,
            'Cannot advance unanswered',
          );
          same(
            api.practiceReducer(state, {
              type: 'answer',
              sessionId: -1,
              index: 0,
              chosen: firstQuestion.target,
            }),
            state,
          );
          same(
            api.practiceReducer(state, {
              type: 'answer',
              sessionId: state.id,
              index: 999,
              chosen: firstQuestion.target,
            }),
            state,
          );
          same(
            api.practiceReducer(state, {
              type: 'answer',
              sessionId: state.id,
              index: 0,
              chosen: 'foreign',
            }),
            state,
          );
          for (let i = 0; i < session.questions.length; i++) {
            const q = state.questions[i];
            same(
              api.practiceRenderIds(state),
              mode === 'name' ? [q.target] : session.renderedIds,
              'Naming shows only current surface',
            );
            const chosen =
              i % 3 === 0
                ? q.target
                : i % 3 === 1
                  ? null
                  : ((mode === 'name' ? q.choices : state.renderedIds).find(
                      (id) => id !== q.target,
                    ) ?? null);
            const action = {
              type: 'answer',
              sessionId: state.id,
              index: i,
              chosen,
            };
            state = api.practiceReducer(state, action);
            same(state.responses.length, i + 1);
            same(
              api.practiceReducer(state, { ...action, chosen: q.target }),
              state,
              'Answer cannot change or double score',
            );
            const priorId = state.id;
            const next = { type: 'next', sessionId: priorId, index: i };
            state = api.practiceReducer(state, next);
            same(api.practiceReducer(state, next), state, 'Stale next ignored');
            if (i + 1 < session.questions.length)
              same(
                api.practiceReducer(state, action),
                state,
                'Previous question answer ignored',
              );
          }
          same(JSON.stringify(session), snapshot, 'Session input not mutated');
          same(state.status, 'complete');
          same(api.practiceRenderIds(state), []);
          same(api.practiceScore(state), Math.ceil(state.questions.length / 3));
          const missed = api.missedPracticeIds(state.responses);
          same(
            missed.length,
            state.questions.length - api.practiceScore(state),
          );
          const retry = api.createPracticeSession(
            scope,
            loaded,
            {
              id: ++serial,
              mode,
              sampling,
              count: missed.length,
              retryIds: missed,
            },
            random,
          );
          same(
            retry.questions
              .map((q) => q.target)
              .sort((a, b) => a.localeCompare(b)),
            [...missed].sort((a, b) => a.localeCompare(b)),
            'Every eligible missed/skipped entry included in retry',
          );
          same(api.practiceReducer(state, { type: 'dismiss' }), {
            ...api.initialPractice,
            id: state.id,
          });
        }
    for (const focus of profile.focuses) {
      const visible = api.stageStructures(scope, profile, 'free', focus.id);
      const targets = visible
        .filter((s) => api.matchesRule(s, focus.rule))
        .map((s) => s.id);
      const sample = api.practiceTargets(visible, loaded, 20, random, {
        sampling: 'focus',
        focusIds: targets,
      });
      check(sample.length > 0);
      check(
        sample.every((s) => targets.includes(s.id)),
        'Focus practice excludes added context',
      );
      same(
        api.practiceTargets(visible, loaded, 5, random, {
          sampling: 'focus',
          focusIds: [],
        }),
        [],
        'Missing focus never falls back',
      );
    }
  }
same(JSON.stringify(catalog), hashBefore, 'Catalogue input not mutated');
// All-visible mode must make even the smallest geometry reachable across seeds.
const fixtures = Array.from({ length: 70 }, (_, i) => ({
  ...catalog.structures[0],
  id: 'test-' + i,
  name: 'Test ' + i,
  bundle: 'test',
  bounds: { min: [0, 0, 0], max: [i + 1, i + 1, i + 1] },
}));
const landmark = api.practiceTargets(fixtures, ['test'], 5, () => 0);
check(!landmark.some((s) => s.id === 'test-0'));
check(
  api
    .practiceTargets(fixtures, ['test'], 5, () => 0.999999, { sampling: 'all' })
    .some((s) => s.id === 'test-0'),
  'Smallest surface eligible without volume cutoff',
);
for (const rng of [() => NaN, () => -1, () => Infinity, () => 4])
  for (const count of [-3, 0, NaN, Infinity, 99]) {
    const list = api.practiceTargets(
      [...fixtures, fixtures[0]],
      ['test'],
      count,
      rng,
      { sampling: 'all' },
    );
    check(list.length > 0 && list.length <= 20);
    same(new Set(list.map((s) => s.id)).size, list.length);
  }
same(
  api.createPracticeSession(fixtures, [], {
    id: ++serial,
    mode: 'find',
    sampling: 'all',
    count: 5,
  }),
  null,
);
same(
  api.createPracticeSession([fixtures[0]], ['test'], {
    id: ++serial,
    mode: 'name',
    sampling: 'all',
    count: 5,
  }),
  null,
);
same(
  api.createPracticeSession(fixtures, ['test'], {
    id: ++serial,
    mode: 'find',
    sampling: 'focus',
    count: 5,
    focusIds: [],
  }),
  null,
);
same(
  api.createPracticeSession(fixtures, ['test'], {
    id: ++serial,
    mode: 'find',
    sampling: 'all',
    count: 5,
    retryIds: ['gone'],
  }),
  null,
);
const partial = api.createPracticeSession(
  fixtures,
  ['test'],
  { id: ++serial, mode: 'find', sampling: 'all', count: 5 },
  random,
);
same(api.practiceReducer(partial, { type: 'exit' }).status, 'idle');
const partialAnswered = api.practiceReducer(partial, {
  type: 'answer',
  sessionId: partial.id,
  index: 0,
  chosen: null,
});
same(
  api.practiceReducer(partialAnswered, { type: 'exit' }).responses.length,
  1,
);
same(api.practiceReducer(partialAnswered, { type: 'exit' }).status, 'complete');
// Dedicated shoulder keeps its three existing prompts but uses the same answer-once engine.
const fixed = (id) => ({
  id,
  mode: 'find',
  status: 'active',
  index: 0,
  questions: api.quizQuestions.map((q) => ({ target: q.answer, choices: [] })),
  renderedIds: api.shoulderStructures.map((s) => s.id),
  responses: [],
});
let shoulder = api.practiceReducer(api.initialPractice, {
  type: 'start',
  session: fixed(++serial),
});
for (let i = 0; i < api.quizQuestions.length; i++) {
  const a = {
    type: 'answer',
    sessionId: shoulder.id,
    index: i,
    chosen: api.quizQuestions[i].answer,
  };
  shoulder = api.practiceReducer(shoulder, a);
  same(api.practiceReducer(shoulder, a), shoulder);
  shoulder = api.practiceReducer(shoulder, {
    type: 'next',
    sessionId: shoulder.id,
    index: i,
  });
}
same(api.practiceScore(shoulder), 3);
same(shoulder.status, 'complete');
const oldId = shoulder.id;
shoulder = api.practiceReducer(shoulder, {
  type: 'start',
  session: fixed(++serial),
});
same(api.practiceScore(shoulder), 0);
same(shoulder.index, 0);
same(
  api.practiceReducer(shoulder, {
    type: 'answer',
    sessionId: oldId,
    index: 0,
    chosen: api.quizQuestions[0].answer,
  }),
  shoulder,
);
const evidence = JSON.parse(
  await fs.readFile('content/abdominal-wall-audit.json', 'utf8'),
);
// This diagnostic audit is historical evidence for the pre-dental catalogue.
same(
  evidence.catalogSha256,
  'a1c6e33bea4c228558d7fc79b8537c9a83fe03fcb296a3f22ee8b2ab688af1f7',
);
same(evidence.results.length, 6);
for (const r of evidence.results) {
  same(r.admitted, false);
  same(r.currentV4Definitions, []);
  check(r.legacyV3Components.length > 0);
  check(!catalog.structures.some((s) => s.fmaId === r.fmaId));
}
same(evidence.controls.length, 3);
for (const c of evidence.controls)
  check(c.boundingCenterDeltaMm.every(Number.isFinite));
console.log({
  passed: true,
  checks,
  regions: 12,
  modes: 2,
  samplingPolicies: 3,
  shoulderPrompts: 3,
  practiceDoesNotMutateAnatomy: true,
  browserInteractionTesting: false,
  clinicalValidation: false,
});
