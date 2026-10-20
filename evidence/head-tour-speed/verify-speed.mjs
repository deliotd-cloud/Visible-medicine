import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from './files/node_modules/typescript/lib/typescript.js';

const stage = 'F:/VisibleMedicine/staging/20261020-head-tour-speed';
const candidate = 'F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const paths = ['lib/head-tour-playback.ts', 'components/HeadTourPlayback.tsx', 'components/head-tour-playback.css', 'tests/head-tour-playback.test.ts', 'tests/head-tour-playback-ui.test.ts'];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');
const before = file => read(path.join(stage, 'before'), file);
const after = file => read(path.join(stage, 'files'), file);
function replaceOnce(text, from, to) {
  assert.equal(text.split(from).length, 2, `expected one exact inverse token: ${from.slice(0, 80)}`);
  return text.replace(from, to);
}
for (const file of paths) assert.equal(read(candidate, file), before(file), `frozen baseline changed: ${file}`);
let controller = after(paths[0]);
controller = replaceOnce(controller, `export const HEAD_TOUR_SPEEDS = Object.freeze([0.5, 1, 1.5, 2, 3] as const);
export type HeadTourSpeed = (typeof HEAD_TOUR_SPEEDS)[number];
function isHeadTourSpeed(value: number): value is HeadTourSpeed {
  return HEAD_TOUR_SPEEDS.some(speed => speed === value);
}`, 'export type HeadTourSpeed = 0.5 | 1 | 1.5 | 2;');
controller = replaceOnce(controller, 'if (!isHeadTourSpeed(speed) || speed === state.speed) return;', 'if (speed !== 0.5 && speed !== 1 && speed !== 1.5 && speed !== 2 || speed === state.speed) return;');
assert.equal(controller, before(paths[0]), 'controller has changes outside speed definition/validation');
let component = after(paths[1]);
component = replaceOnce(component, 'createHeadTourPlaybackController, HEAD_TOUR_SPEEDS, type HeadTourPlaybackContext', 'createHeadTourPlaybackController, type HeadTourPlaybackContext');
component = replaceOnce(component, "{HEAD_TOUR_SPEEDS.map(speed => <option key={speed} value={speed}>{`${speed}×${speed === 0.5 ? ' · slow' : speed === 2 ? ' · fast' : speed === 3 ? ' · fastest' : ''}`}</option>)}", '<option value={0.5}>0.5× · slow</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2× · fast</option>');
assert.equal(component, before(paths[1]), 'UI has changes outside import/option list');
assert.equal(after(paths[2]), before(paths[2]), 'CSS must remain unchanged');
let tests = after(paths[3]);
tests = replaceOnce(tests, '  HEAD_TOUR_SPEEDS,\n', '');
tests = replaceOnce(tests, '[0.5, 1, 1.5, 2, 3] as const', '[0.5, 1, 1.5, 2] as const');
tests = replaceOnce(tests, '[0, -1, 0.75, 4, NaN, Infinity]', '[0, -1, 0.75, 3, NaN, Infinity]');
const unitNew = "test('3x retains readiness, exact next-step confirmation and the final reading hold'";
assert.equal(tests.split(unitNew).length, 2);
assert.equal(tests.slice(0, tests.indexOf(unitNew)).trimEnd(), before(paths[3]).trimEnd(), 'all original unit assertions retained with only two speed-list updates');
const uiNew = "test('offers all five tour speeds and 3x preserves ready-step and final-note behaviour'";
const uiTests = after(paths[4]);
assert.equal(uiTests.split(uiNew).length, 2);
assert.equal(uiTests.slice(0, uiTests.indexOf(uiNew)).trimEnd(), before(paths[4]).trimEnd(), 'all original UI assertions retained');

const options = {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true, types: ['node'], lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts']};
const current = process.cwd();
process.chdir(path.join(stage, 'files'));
try {
  const program = ts.createProgram([paths[0], paths[1], paths[3], paths[4]], options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCurrentDirectory: () => process.cwd(), getCanonicalFileName: f => f, getNewLine: () => '\n'}));
} finally { process.chdir(current); }
const rows = paths.map(file => ({file, before: sha(before(file)), after: sha(after(file)), changed: before(file) !== after(file)}));
assert.equal(rows.filter(row => row.changed).length, 4);
console.log(JSON.stringify({scope: 'four changed source/test paths; exact full-file inverses and bounded four-file TypeScript check', rows, originalAssertionsRetained: true, types: 'pass', fullProjectTypes: false, browserAccepted: false, installed: false}, null, 2));
