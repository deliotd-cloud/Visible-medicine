import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';

const baseline = process.argv.includes('--baseline');
const built = await build({ stdin: {
  contents: (baseline ? '' : "export {parseBodyCatalog} from './lib/body-catalog-input'; ") + "export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLinkEntries} from './lib/anatomy-link-registry';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, platform: 'node', format: 'esm', write: false });
const { parseBodyCatalog, bodyDisplayCatalog, bodyLinkEntries } = await import(
  'data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const toothIndex = raw.structures.findIndex(s => s.fmaId === 'FMA55680');
assert(toothIndex >= 0, 'actual tooth independent of addition contexts');
const copy = value => structuredClone(value);
const source = baseline
  ? execFileSync('git', ['show', '3c935b4:app/body-explorer.tsx'], { encoding: 'utf8' })
  : await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect'
    && node.getText(ast).includes('Catalog unavailable')) {
    assert.equal(effect, undefined); effect = node.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast); assert(effect, 'actual catalogue fetch effect');
const code = ts.transpileModule(effect, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  const calls = { catalogs: [], parses: 0, links: 0, resolutions: 0, errors: [], requests: [], timers: new Map() };
  let cleanup, serial = 0;
  const context = {
    catalogAttempt: 0, initialRegion: 'head-neck', studyLink: { status: 'ready' }, assetBase: '',
    dispatch() {}, chooseWorkspaceMode() {}, appliedStudyLink: { current: false },
    allBodySystems: {}, modelDeliveryUrl: path => path, bodyDisplayCatalog,
    parseBodyCatalog(value) { calls.parses++; return parseBodyCatalog(value); },
    bodyLinkEntries(value) { calls.links++; return bodyLinkEntries(value); },
    resolveStudyLink(value) { calls.resolutions++; return { status: 'ready', selected: value.structures.find(s => s.fmaId === 'FMA55680'), side: 'right', view: 'anterior' }; },
    setCatalog: value => calls.catalogs.push(value), setError: value => calls.errors.push(value),
    setLinkedStudyReady() {}, setLinkIssue() {}, setSide() {}, setSystems() {}, setView() {},
    setSelectionNotice() {}, setSelectedIdState() {}, setNestedSelection() {}, setEyeParent() {}, setVentricleParent() {},
    AbortController,
    setTimeout(callback, milliseconds) { assert.equal(milliseconds, 30000); const id = ++serial; calls.timers.set(id, callback); return id; },
    clearTimeout(id) { calls.timers.delete(id); },
    fetch(url, options) {
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      calls.requests.push({ url, signal: options.signal, resolve, reject });
      return promise;
    },
    useEffect(callback) { cleanup = callback(); },
  };
  return { calls, context, render() { runInNewContext(code, context); },
    cleanup() { cleanup(); }, respond(value, index = calls.requests.length - 1) {
      calls.requests[index].resolve({ ok: true, json: async () => value });
    }, timeout() { const callbacks = [...calls.timers.values()]; assert.equal(callbacks.length, 1); callbacks[0](); } };
}
const malformed = mutate => { const value = copy(raw); mutate(value, value.structures[toothIndex]); return value; };
const cases = [
  ['null root', () => null], ['array root', () => []],
  ['missing structures', () => malformed(value => { delete value.structures; })],
  ['non-array structures', () => malformed(value => { value.structures = {}; })],
  ['non-array bundles', () => malformed(value => { value.bundles = null; })],
  ['non-array regions', () => malformed(value => { value.regions = 'head-neck'; })],
  ['empty structures', () => malformed(value => { value.structures = []; })],
  ['empty bundles', () => malformed(value => { value.bundles = []; })],
  ['empty catalogue regions', () => malformed(value => { value.regions = []; })],
  ['invalid version', () => malformed(value => { value.version = NaN; })],
  ['missing source version', () => malformed(value => { delete value.sourceVersion; })],
  ['invalid credit', () => malformed(value => { value.credit = 42; })],
  ['missing coverage', () => malformed(value => { delete value.coverage; })],
  ['invalid excluded array', () => malformed(value => { value.excluded = {}; })],
  ['null record', () => malformed(value => { value.structures[toothIndex] = null; })],
  ['missing sources', () => malformed((_value, s) => { delete s.sources; })],
  ['empty sources', () => malformed((_value, s) => { s.sources = []; })],
  ['invalid source hash', () => malformed((_value, s) => { s.sources[0].sha256 = 'foreign'; })],
  ['non-array source', () => malformed((_value, s) => { s.sources = {}; })],
  ['null source', () => malformed((_value, s) => { s.sources[0] = null; })],
  ['duplicate source within record', () => malformed((_value, s) => { s.sources.push(copy(s.sources[0])); })],
  ['invalid source filename', () => malformed((_value, s) => { s.sources[0].file = null; })],
  ['missing regions', () => malformed((_value, s) => { delete s.regions; })],
  ['empty regions', () => malformed((_value, s) => { s.regions = []; })],
  ['non-array record regions', () => malformed((_value, s) => { s.regions = 'head-neck'; })],
  ['unknown region', () => malformed((_value, s) => { s.regions = ['foreign']; })],
  ['unknown primary region', () => malformed((_value, s) => { s.region = 'foreign'; })],
  ['primary region outside membership', () => malformed((_value, s) => { s.regions = ['thorax']; })],
  ['unknown bundle reference', () => malformed((_value, s) => { s.bundle = 'foreign'; })],
  ['missing bundle', () => malformed((value, s) => { value.bundles = value.bundles.filter(b => b.id !== s.bundle); })],
  ['duplicate structure id', () => malformed(value => { value.structures.push(copy(value.structures[toothIndex])); })],
  ['duplicate FMA identity', () => malformed((value, s) => { s.fmaId = value.structures[0].fmaId; })],
  ['duplicate node within bundle', () => malformed((value, s) => {
    s.nodeName = value.structures.find(other => other.bundle === s.bundle && other.id !== s.id).nodeName;
  })],
  ['duplicate bundle id', () => malformed(value => { value.bundles.push(copy(value.bundles[0])); })],
  ['duplicate region id', () => malformed(value => { value.regions.push(copy(value.regions[0])); })],
  ['unknown system', () => malformed((_value, s) => { s.system = 'foreign'; })],
  ['unknown laterality', () => malformed((_value, s) => { s.laterality = 'foreign'; })],
  ['invalid presentation parts', () => malformed((_value, s) => { s.presentationParts = [{}]; })],
  ['non-string name', () => malformed((_value, s) => { s.name = 42; })],
  ['null provenance', () => malformed((_value, s) => { s.provenance = null; })],
  ['invalid provenance method', () => malformed((_value, s) => { s.provenance.method = 'foreign'; })],
  ['invalid provenance recovery flag', () => malformed((_value, s) => { s.provenance.recovered = 'true'; })],
  ['invalid provenance license', () => malformed((_value, s) => { s.provenance.license = ''; })],
  ['invalid validation status', () => malformed((_value, s) => { s.validation.status = 'approved'; })],
  ['invalid validation approval', () => malformed((_value, s) => { s.validation.anatomicalReview = true; })],
  ['invalid representation', () => malformed((_value, s) => {
    s.representation = { coverage: 'complete', sourceLaterality: 'unspecified', displayLaterality: 'right', description: 'Fixture' };
  })],
  ['invalid center', () => malformed((_value, s) => { s.center = [NaN, 0, 0]; })],
  ['invalid anchor', () => malformed((_value, s) => { s.anchor = [Infinity, 0, 0]; })],
  ['short vector', () => malformed((_value, s) => { s.center = [0, 0]; })],
  ['string vector entry', () => malformed((_value, s) => { s.center[0] = '0'; })],
  ['inverted bounds', () => malformed((_value, s) => { s.bounds.min[0] = s.bounds.max[0] + 1; })],
  ['missing bounds', () => malformed((_value, s) => { delete s.bounds; })],
  ['nonfinite bounds', () => malformed((_value, s) => { s.bounds.max[0] = NaN; })],
  ['missing coordinates', () => malformed(value => { delete value.coordinateSystem; })],
  ['short transform', () => malformed(value => { value.coordinateSystem.sourceToSceneColumnMajor.pop(); })],
  ['nonfinite transform', () => malformed(value => { value.coordinateSystem.sourceToSceneColumnMajor[0] = Infinity; })],
  ['singular transform', () => malformed(value => { value.coordinateSystem.sourceToSceneColumnMajor[0] = 0; })],
  ['invalid coordinate units', () => malformed(value => { value.coordinateSystem.unitsPerMillimetre = 0; })],
  ['invalid bundle bytes', () => malformed(value => { value.bundles[0].bytes = -1; })],
  ['invalid bundle hash', () => malformed(value => { value.bundles[0].sha256 = 'foreign'; })],
  ['invalid bundle count', () => malformed(value => { value.bundles[0].structures = 1.5; })],
  ['external bundle URL', () => malformed(value => { value.bundles[0].url = 'https://example.invalid/model.glb'; })],
  ['traversal bundle URL', () => malformed(value => { value.bundles[0].url = '/models/../secret.glb'; })],
];

if (baseline) {
  test('baseline actual effect admits malformed tooth source hash through real display/link pipeline', async () => {
    const h = harness(); h.render();
    const value = malformed((_value, s) => { s.sources[0].sha256 = 'foreign'; });
    h.respond(value); await flush();
    assert.equal(h.calls.catalogs.length, 1);
    assert.equal(h.calls.resolutions, 1);
    assert.equal(h.calls.catalogs[0].structures.find(s => s.fmaId === 'FMA55680').sources[0].sha256, 'foreign');
    assert.deepEqual(h.calls.errors, []); h.cleanup();
  });
  test('baseline timeout reports error but actual old effect still commits a valid late response', async () => {
    const h = harness(); h.render(); h.timeout();
    assert(h.calls.requests[0].signal.aborted); h.respond(copy(raw)); await flush();
    assert.deepEqual(h.calls.errors, [true]); assert.equal(h.calls.catalogs.length, 1);
    assert.equal(h.calls.resolutions, 1); h.cleanup();
  });
} else {
  test('real raw and display catalogue parse without mutation or substitution', () => {
    for (const value of [raw, bodyDisplayCatalog(copy(raw))]) {
      const before = copy(value), parsed = parseBodyCatalog(value);
      assert.deepEqual(value, before); assert.deepEqual(parsed, before);
      assert.doesNotThrow(() => bodyLinkEntries(bodyDisplayCatalog(parsed)));
    }
  });
  test('real compound presentation metadata is accepted intact and rejects source, side and bounds mutations', () => {
    const display = bodyDisplayCatalog(copy(raw));
    const index = display.structures.findIndex(s => /short ciliary/i.test(s.name) && s.presentationParts);
    assert(index >= 0, 'real short-ciliary bilateral compound');
    const original = copy(display);
    assert.deepEqual(parseBodyCatalog(display), original);
    assert.deepEqual(display, original);
    for (const mutate of [
      s => { s.presentationParts[0].source.sha256 = 'a'.repeat(64); },
      s => { s.presentationParts[0].source.file = 'foreign'; },
      s => { s.presentationParts[0].displaySide = s.presentationParts[1].displaySide; },
      s => { s.presentationParts[0].bounds.min[0] = s.presentationParts[0].bounds.max[0] + 1; },
      s => { s.presentationParts[0].center[0] = Infinity; },
      s => { s.presentationParts[0].nodeName = s.presentationParts[1].nodeName; },
    ]) {
      const invalid = copy(display); mutate(invalid.structures[index]);
      const before = copy(invalid);
      assert.throws(() => parseBodyCatalog(invalid), error => error.name === 'Error');
      assert.deepEqual(invalid, before);
    }
  });
  test('valid optional representation metadata is retained; wrong side, source or description is rejected', () => {
    const value = malformed((_value, s) => {
      s.representation = { coverage: 'partial', sourceLaterality: 'unspecified', displayLaterality: 'right', description: 'Fixture partial source' };
    });
    assert.deepEqual(parseBodyCatalog(value), value);
    for (const [key, replacement] of [['sourceLaterality', 'left'], ['displayLaterality', 'left'], ['description', '']]) {
      const invalid = copy(value); invalid.structures[toothIndex].representation[key] = replacement;
      assert.throws(() => parseBodyCatalog(invalid), error => error.name === 'Error');
    }
  });
  test('structural hash validation does not claim cryptographic source authenticity', () => {
    const value = malformed((_value, s) => { s.sources[0].sha256 = 'a'.repeat(64); });
    assert.deepEqual(parseBodyCatalog(value), value, 'well-formed hash is structural metadata only');
  });
  for (const [label, fixture] of cases) test(`parser and actual effect reject ${String(label)} before commit or initial link`, async () => {
    const value = fixture(), before = copy(value);
    assert.throws(() => parseBodyCatalog(value), error => error.name === 'Error');
    assert.deepEqual(value, before, 'rejection does not repair input');
    const h = harness(); h.render(); h.respond(value); await flush();
    assert.equal(h.calls.catalogs.length, 0); assert.equal(h.calls.links, 0);
    assert.equal(h.calls.resolutions, 0); assert.equal(h.context.appliedStudyLink.current, false);
    assert.deepEqual(h.calls.errors, [true]); h.cleanup();
  });
  test('actual effect loads valid catalogue; error then retry resolves initial link once', async () => {
    const h = harness(); h.render();
    h.calls.requests[0].resolve({ ok: false }); await flush();
    assert.deepEqual(h.calls.errors, [true]); assert.equal(h.calls.catalogs.length, 0);
    h.cleanup(); h.context.catalogAttempt++; h.render(); h.respond(copy(raw)); await flush();
    assert.equal(h.calls.catalogs.length, 1); assert.equal(h.calls.links, 1); assert.equal(h.calls.resolutions, 1);
    h.cleanup(); h.context.catalogAttempt++; h.render(); h.respond(copy(raw)); await flush();
    assert.equal(h.calls.catalogs.length, 2); assert.equal(h.calls.resolutions, 1); h.cleanup();
  });
  test('unmounted request cannot commit or resolve an initial link after a late response', async () => {
    const h = harness(); h.render(); h.cleanup(); assert(h.calls.requests[0].signal.aborted);
    h.respond(copy(raw)); await flush();
    assert.equal(h.calls.catalogs.length, 0); assert.equal(h.calls.resolutions, 0); assert.deepEqual(h.calls.errors, []);
  });
  test('unmounted malformed late response cannot parse, link or report an error', async () => {
    const h = harness(); h.render(); h.cleanup(); h.respond(null); await flush();
    assert.equal(h.calls.parses, 0); assert.equal(h.calls.links, 0);
    assert.equal(h.calls.catalogs.length, 0); assert.equal(h.calls.resolutions, 0);
    assert.deepEqual(h.calls.errors, []);
  });
  test('timed-out request cannot commit or resolve an initial link even if transport resolves late', async () => {
    const h = harness(); h.render(); h.timeout(); assert(h.calls.requests[0].signal.aborted);
    h.respond(copy(raw)); await flush();
    assert.equal(h.calls.catalogs.length, 0); assert.equal(h.calls.resolutions, 0);
    assert.deepEqual(h.calls.errors, [true]); h.cleanup();
  });
  test('timeout then successful retry cannot be overwritten or relinked by the old response', async () => {
    const h = harness(); h.render(); h.timeout(); h.cleanup();
    h.context.catalogAttempt++; h.render(); h.respond(copy(raw), 1); await flush();
    assert.equal(h.calls.catalogs.length, 1); assert.equal(h.calls.resolutions, 1);
    const committed = h.calls.catalogs[0];
    h.respond(copy(raw), 0); await flush();
    assert.equal(h.calls.catalogs.length, 1); assert.equal(h.calls.catalogs[0], committed);
    assert.equal(h.calls.parses, 1); assert.equal(h.calls.links, 1); assert.equal(h.calls.resolutions, 1);
    assert.deepEqual(h.calls.errors, [true]); h.cleanup();
  });
  test('JSON rejection reports failure without commit; retry loads and resolves the initial link', async () => {
    const h = harness(); h.render();
    h.calls.requests[0].resolve({ ok: true, json: async () => { throw new Error('Malformed response JSON'); } });
    await flush(); assert.deepEqual(h.calls.errors, [true]);
    assert.equal(h.calls.parses, 0); assert.equal(h.calls.links, 0); assert.equal(h.calls.resolutions, 0);
    assert.equal(h.calls.catalogs.length, 0);
    h.cleanup(); h.context.catalogAttempt++; h.render(); h.respond(copy(raw)); await flush();
    assert.equal(h.calls.catalogs.length, 1); assert.equal(h.calls.resolutions, 1); h.cleanup();
  });
}
