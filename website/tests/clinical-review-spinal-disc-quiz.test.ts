import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {gunzipSync} from 'node:zlib';
import test from 'node:test';
import {build} from 'esbuild';

const wire = (value: any): any => JSON.parse(JSON.stringify(value));
const sha = (value: any): string => createHash('sha256').update(JSON.stringify(wire(value))).digest('hex');
// Immutable 2f21cc4 -> d517b77 transition; offline source history stays outside
// the website import closure. The parsed JSON hash guards this compact fixture.
const transitionFixture =
  'H4sIAAAAAAAACu2d3W5jyZHnX4XgNaWOz8yM6otFT88a2wvbO2h7d7AY+CI/qzimSJmkurp20IDfwQ8z9/MofpJFHEoqqUqqr2l1TdkH6ItqkSc/DjPzxO9E' +
  'xD/+bXmoL/pF/j99f1jvtstnuFqWfOib9bZ/u7u4WB+Xz5Y0CGsVJaq1UYwaiKAGLpY6ZmodifrgsFwtD3V32ZfPlr9a/9AXu/36+XqbN4vffP/d4k9X6/rH' +
  's/qi1z8ujv3icpOP/bDYbRdEi/7j+nBcb58vXr7YbfpZWx/q4tA3vR7Xu+3h60Xb53FcLba74yJv83F38WqR28X64ENe7PaLullv1zVvFvnycr/7IW+Wq+VN' +
  '57+7XG/7P623h/952G1/9yKThuWzZRbVknq10sUSwQCqkVIVq7mU2ksNvYiC1CANa6cWYwh11CTSY/ap1nzMm93z2yaH9orDOmtsEFLMrYTeWreeNUO3zi2U' +
  'UJQUy6CWSEZiHU3ZOAdOy9Xyct9/WO+uDt9sNr/uh8Nue/hm277vdX3ZD/8jH14sny0rhFpS72ylFInozSPXlnCUFoCwkjVosWNX7hrTAGDijMZJR/Renu93' +
  'V5eH23F3Ci0nGkoSJTcOEViyZm1DrOTQkmWxrlCtcBiMWA1DGkwmUGJerpZ/uuqH6ae6bTTmyppbxpZUyyhcS2tNrJdYBNIQMikacqehVqmZ5pp76UM7C5E3' +
  '2rfH/bofls/+5d+W69a3x/Xx1fKZ/3v5bPnDxbPrlfCs7NqrZwf/lZ9drJsv3Gc174/rTX7en623x77/oe+PvezzxlfWH8924yz/uD4sV8txkb/z1n71m29I' +
  'Qf3mbPOFr9/v7l238OsWu7G4vu6wu9rX/tvTV9fv/uqrw7Ff+A+32259Qf/QT2unP9/tX/nfb8a6XC19T+zzZpro8noyy9Vy359Pe3M5zfL2D35rbv/0oud2' +
  'tu31j8s/rJblats2/eaCs9ddnz3Plz6q7a7dDP/O3MvuatsOfo8v1tvls385g3NkERAADgQoMa7CuaCIGSVKHAxlBedoREiW2IKmyJH+sFpe5B+Xz/4FzhFD' +
  'YjOLEoFjSmkVzhWMzQQFAukKzjmSsgCHwIGVVP7w02pZu9/X0ygAUkwEwBAlJRFUH0dAE2NJIhYhruCcEnFkRWBAREb+w2qZt/XF7qYZwkigACGQEaXgrSRg' +
  'AKEgiVF9NmQAIVkSYAwxkv7h5gf//b5PP/gh366B0/Ic6+lu/+p/MgH5ZzfbAKGQtCoaYiohRZaepFNDqFGsalEu0htXtgrSCJRK66UCMWASWP70h9Wy7n7o' +
  '+/y8/3Z39F7++c4ZOY1hcbjaj1z7+eKb7fZqc3VYLbZXddOvDou8bYu+bdeHbd736Qxdb1u/7FvfU5tXi0N/fuH3up0vfndq7/Vi3uYLP5bXh8W+H/N629vX' +
  'i+OL9cH/Mp3Gix/yZt3ysbfFPrf1brN7Ph3Em/5D3yzydrs7Zj8Zzhff92kevS3GfnexOL7oix/kZgbr7WJ9PCyutvVF3j7vbVF3Fxe77aLudvu23uZjX4x9' +
  'vujni+9ej/36WTD15wdnf+nD8g/X2+fn03G6+6Fv87b2aU3344ud7/bNuvbtobezU+dnF/3wwjff6c/LZ8tvvz37h/97Judw+zPfPh6Xp7/ubyazfHbcX/Wf' +
  'Vsvr+zB96d+Wh2M+Xh2Wz5ZX29sbtPTFeDPg76fxLp+NvDn0n366PpT9wXQ6NnabdnoCeGv7ntt62w/e4PO+7Xtv7ux0Jo51PfW6Wh7Xx2kZfnfvg8XlPtfj' +
  'uvZpg7dX08N52xbvOLb8qey/z8Wu9c358qfVcttfPjyc6cl8t+93tPof/774R1+1t9bA4mQN/Me/L26auR7gP79Y1xenEV76wrueRz9424dpbDd2wG6cFuT1' +
  'b7nJpW82vZ169E3y37zZq82mH6fz8rvjYrPuh0Xpm93Lxbfk67nv+2lBL77Fv/75L9/SAzenLld+7frU+7T7Sj++7H27+BanffYtTV+5GcpiGsqiH465bNaH' +
  'F77/Fpf5uPaV67dg2iK3rebX+/Detw6+LJfTKbDf93r8Znt46cfif2oi/cfLjd/A05L+x5PxdbU+vDjd2uMmH/76579Mt/Bfd+vt8fWWvZ74qcvzxe9f3Dka' +
  '7k/8+oTwR9XhuD/9hMfdnXvQf/TDZfrg60Xdbcd6f3H74fbqovT9dPbcPax8V9f1aUFMP+eL4/Hy8Oyrrw5X++d9/2rfR9/3be3neTf8aXY6fHb7519Nj8Kv' +
  'jvt8dZG/2tW6vlwfd7Xvf/Dt+NW42vvtOzut7edf5d3Z6dl5dXnZ92c33ztbb//1yq2Ss7rJh8PtJju7fsz/wR+t0yn9v25s3xvb6OvFZr3942Hhh9K69cVp' +
  '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';
const transition = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(gunzipSync(Buffer.from(transitionFixture, 'base64'))));
assert.equal(sha(transition), '5ae2b41c4ede59eb796c7e30b79b0c3c86d182e593e581252dda13ac421e5fc2');
const leaves = (value: any, path: string[] = []): string[][] =>
  value === null || typeof value !== 'object' ? [path] :
    Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));

test('22 imported spinal-disc Quiz drafts retain five exact templates, source identity and review bindings', {timeout: 120000}, async () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  assert.equal(learner.sourceCommit, review.revision);
  assert.equal(learner.patientDataIncluded, false);
  assert.equal(learner.clinicalApproved, false);
  for (const path of ['content/spinal-disc-quiz.ts', 'lib/spinal-disc-quiz.ts']) {
    const record = review.files.find((file: any) => file.path === path);
    assert(record, path);
    assert.equal(inputs.find((file: any) => file.path === path)?.sha256, record.sourceSha256);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), record.importedSha256);
  }
  const compiled = await build({stdin: {contents: [
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {spinalDiscQuizLesson} from './atlas-review/lib/spinal-disc-quiz';",
    "export {spinalDiscQuizGroups,spinalDiscQuizQuestions} from './atlas-review/content/spinal-disc-quiz';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, format: 'esm', platform: 'node'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.equal(transition.entries.length, 22);
  assert.equal(Object.keys(api.spinalDiscQuizQuestions).length, 5);
  assert.deepEqual(Object.values(api.spinalDiscQuizQuestions).map((q: any) => q.choices.indexOf(q.correctAnswer)), [0, 1, 2, 3, 1]);
  assert.equal(sha(api.spinalDiscQuizGroups), transition.groupsSha256);
  assert.equal(sha(api.spinalDiscQuizQuestions), transition.questionsSha256);
  const seen = new Set<string>();
  const answerKeys = new Set<string>();
  for (const entry of transition.entries) {
    const {identity, group, oldLesson, newLesson} = entry;
    assert(!seen.has(identity.id), identity.id);
    seen.add(identity.id);
    assert(api.spinalDiscQuizGroups[group].includes(identity.fmaId));
    assert.equal(sha(oldLesson), entry.oldSha256);
    assert.equal(sha(newLesson), entry.newSha256);
    assert.deepEqual(api.spinalDiscQuizLesson(identity, 'quiz'), newLesson);
    assert.equal(api.spinalDiscQuizLesson(identity, 'mri'), undefined);
    assert.deepEqual(api.bodyLesson(identity, 'quiz'), newLesson);
    const {readiness: _readiness, ...shown} = newLesson;
    assert.deepEqual(api.bodyContent(identity, 'quiz'), shown);
    assert.equal(newLesson.readiness, 'draft');
    assert.equal(newLesson.bullets.length, 4);
    assert.equal(new Set(newLesson.bullets.map((x: string) => x.trim())).size, 4);
    assert.equal(newLesson.bullets.filter((x: string) => x === newLesson.correctAnswer).length, 1);
    assert.deepEqual(newLesson.citations, [api.spinalDiscQuizQuestions[group].reference]);
    assert.equal(newLesson.body, api.spinalDiscQuizQuestions[group].body);
    assert.equal(newLesson.explanation, api.spinalDiscQuizQuestions[group].explanation);
    assert.equal(newLesson.correctAnswer, api.spinalDiscQuizQuestions[group].correctAnswer);
    assert.match(newLesson.note, /Radiologist review pending for this source revision/);
    assert.match(newLesson.note, /Atlas, imaging-case and lecture access remain independent/);
    assert.equal(newLesson.note.includes('no C1–C2'), group === 'axis');
    if (group === 'thoracicCoverage' || group === 'surfaceLimits') assert.match(newLesson.note, /T12–L1 is unresolved/);
    answerKeys.add(JSON.stringify({body: newLesson.body, choices: newLesson.bullets, correctAnswer: newLesson.correctAnswer, explanation: newLesson.explanation}));
    const material = await api.bodyReviewMaterial(identity.id);
    assert(material, identity.id);
    assert.equal(material.approval, false);
    assert.equal(material.status, 'worksheet-not-submitted');
    assert.deepEqual(wire(material.source.structure), identity);
    assert.deepEqual(material.topics.find((topic: any) => topic.tab === 'quiz'), {tab: 'quiz', ...newLesson});
    assert.deepEqual(await api.parseBodyReviewResponse(wire(material), identity.id), wire(material));
    for (const mutate of [
      (q: any) => { q.body += ' foreign'; },
      (q: any) => { q.correctAnswer = q.bullets.find((x: string) => x !== q.correctAnswer); },
      (q: any) => { q.explanation += ' foreign'; },
      (q: any) => { q.citations[0] = 'https://foreign.example/'; },
    ]) {
      const altered = wire(material);
      mutate(altered.topics.find((topic: any) => topic.tab === 'quiz'));
      assert.equal(await api.parseBodyReviewResponse(altered, identity.id), null);
    }
    const alteredSource = wire(material);
    alteredSource.source.structure.name += ' foreign';
    assert.equal(await api.parseBodyReviewResponse(alteredSource, identity.id), null);
    for (const path of leaves(identity)) {
      const altered = wire(identity);
      let field = altered;
      for (const key of path.slice(0, -1)) field = field[key];
      const key = path.at(-1)!;
      const before = field[key];
      field[key] = typeof before === 'number' ? before + .01 : typeof before === 'boolean' ? !before : String(before) + '-foreign';
      assert.equal(api.spinalDiscQuizLesson(altered, 'quiz'), undefined, identity.fmaId + ' ' + path.join('.'));
    }
    const detached = api.spinalDiscQuizLesson(identity, 'quiz');
    detached.bullets.push('foreign');
    detached.citations.length = 0;
    assert.deepEqual(api.spinalDiscQuizLesson(identity, 'quiz'), newLesson);
  }
  assert.equal(seen.size, 22);
  assert.equal(answerKeys.size, 5);
});

test('imported spinal-disc Quiz uses lazy notes and the existing answer, retry and exam controls', {timeout: 120000}, async () => {
  const component = await build({
    stdin: {contents: "export {StructureQuickCheck} from './atlas-review/app/structure-quick-check'; export {QuizNotes,AtlasWorkspace} from './atlas-review/app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx'},
    bundle: true, platform: 'node', format: 'cjs', write: false,
    packages: 'external', alias: {'@': process.cwd()}, loader: {'.css': 'empty'},
    tsconfigRaw: {compilerOptions: {jsx: 'react-jsx'}},
  });
  const require = createRequire(import.meta.url);
  const React = require('react');
  const render = require('react-dom/server').renderToStaticMarkup;
  const document = {hidden: false, body: {}, activeElement: null as any};
  document.activeElement = document.body;
  const load = (react: any) => {
    const scope: {exports: any} = {exports: {}};
    runInNewContext(component.outputFiles[0].text, {module: scope, exports: scope.exports, require: (id: string) => id === 'react' ? react : id === 'next/link' ? () => { throw Error('Unrelated navigation'); } : require(id), console, structuredClone, document});
    return scope.exports;
  };
  const actual = load(React);
  let states: any[] = [], refs: any[] = [], cursor = 0, refCursor = 0, active = false, focusTarget = '';
  let layoutEffects: Array<() => void> = [];
  const contextDefaults = new WeakMap<object, any>();
  const shim = {...React,
    createContext(value: any) {const context = React.createContext(value); contextDefaults.set(context, value); return context;},
    useContext(context: object) {assert(contextDefaults.has(context)); return contextDefaults.get(context);},
    useId: () => active ? 'disc-quiz' : React.useId(),
    useState(initial: any) { if (!active) return React.useState(initial); const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], (value: any) => { states[i] = value; }]; },
    useRef(initial: any) { if (!active) return React.useRef(initial); const i = refCursor++; return refs[i] ?? (refs[i] = {current: initial}); },
    useLayoutEffect(effect: () => void) { if (!active) return React.useLayoutEffect(effect); layoutEffects.push(effect); },
  };
  const events = load(shim);
  const walk = (node: any, found: any[] = []): any[] => { if (React.isValidElement(node)) { found.push(node); React.Children.forEach(node.props.children, (child: any) => walk(child, found)); } return found; };
  const text = (node: any): string => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
  const apiBuild = await build({stdin: {contents: "export {bodyContent} from './atlas-review/app/body-content';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, platform: 'node', format: 'esm', write: false});
  const {bodyContent} = await import('data:text/javascript;base64,' + Buffer.from(apiBuild.outputFiles[0].text).toString('base64'));
  for (const {identity, newLesson: lesson} of transition.entries) {
    const props = {question: lesson.body, choices: lesson.bullets, correctAnswer: lesson.correctAnswer, explanation: lesson.explanation};
    const attempt = events.StructureQuickCheck(props);
    assert.equal(attempt.key, JSON.stringify(props));
    assert.notEqual(events.StructureQuickCheck({...props, explanation: props.explanation + ' revised'}).key, attempt.key);
    assert.notEqual(events.StructureQuickCheck({...props, correctAnswer: props.choices.find((x: string) => x !== props.correctAnswer)}).key, attempt.key);
    states = []; refs = []; cursor = 0; refCursor = 0; active = true;
    let note = events.QuizNotes({structure: identity}); active = false;
    assert.equal(note.type, 'details');
    assert.equal(walk(note).find((n: any) => n.type?.name === 'LazyBodyTeaching').props.enabled, false);
    note.props.onToggle({currentTarget: {open: true}});
    cursor = 0; active = true; note = events.QuizNotes({structure: identity}); active = false;
    const lazy = walk(note).find((n: any) => n.type?.name === 'LazyBodyTeaching');
    assert.equal(lazy.props.enabled, true);
    const loaded = lazy.props.children({bodyContent});
    const child = walk(loaded).find((n: any) => n.type?.name === 'StructureQuickCheck');
    assert(child);
    assert.equal(child.key, identity.id);
    assert.deepEqual(wire(child.props), props);
    assert.deepEqual(walk(loaded).filter((n: any) => n.type === 'a').map((n: any) => n.props.href), lesson.citations);
    const html = render(React.createElement(actual.StructureQuickCheck, props));
    assert.equal((html.match(/type="radio"/g) ?? []).length, 4);
    assert(!html.includes('Correct answer:'));
    const exam = render(React.createElement(actual.AtlasWorkspace, {exam: true}, React.createElement(actual.QuizNotes, {structure: identity})));
    assert(!exam.includes('atlas-quiz-notes'));
    states = []; refs = []; document.activeElement = document.body; let tree: any;
    const redraw = () => {
      cursor = 0; refCursor = 0; layoutEffects = []; active = true; tree = attempt.type(attempt.props); active = false;
      for (const node of walk(tree)) if (node.props.ref) {
        const target = {isConnected: true, focus(options: any) {
          assert.equal(options.preventScroll, true);
          document.activeElement = target;
          focusTarget = node.type === 'input' ? 'first-radio' : 'feedback';
        }};
        node.props.ref.current = target;
      }
      for (const effect of layoutEffects) effect();
    };
    const radios = () => walk(tree).filter((n: any) => n.type === 'input');
    const button = (label: string) => walk(tree).find((n: any) => n.type === 'button' && text(n) === label);
    const answer = (index: number) => {radios()[index].props.onChange(); redraw(); button('Check answer').props.onClick(); redraw();};
    redraw(); assert.equal(button('Check answer').props.disabled, true);
    // Answer by the rendered label: the learner receives deterministic shuffled choices.
    const labels=walk(tree).filter((n: any) => n.type === 'label');
    assert.deepEqual(labels.map(text).sort(), [...props.choices].sort());
    const correct = labels.findIndex((label: any) => text(label) === props.correctAnswer);
    assert(correct >= 0, 'Correct answer is present exactly once in displayed choices');
    answer(correct);
    assert(text(tree).includes('Correct. Correct answer: ' + props.correctAnswer));
    assert(text(tree).includes(props.explanation));
    assert.equal(focusTarget, 'feedback');
    button('Practise again').props.onClick(); redraw();
    assert.equal(focusTarget, 'first-radio');
    assert(radios().every((n: any) => !n.props.checked));
    answer((correct + 1) % 4);
    assert(text(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer));
    assert(text(tree).includes(props.explanation));
    button('Try again').props.onClick(); redraw();
    assert.equal(focusTarget, 'first-radio');
    assert(radios().every((n: any) => !n.props.checked));
    answer((correct + 1) % 4);
    radios()[correct].props.onChange(); redraw();
    assert(!text(tree).includes('Correct answer:'));
    assert(!text(tree).includes(props.explanation));
  }
});
