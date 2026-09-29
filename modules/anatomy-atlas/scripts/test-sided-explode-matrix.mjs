import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';

// Real catalogue + exact BodyScene memo statements; no GPU or mesh mutation.
const compiled = await build({
  stdin: { contents: `export * from 'three';
export * from './lib/body-display-catalog';
export * from './lib/body-presentation-parts';
export * from './lib/body-arrangement';
export * from './lib/explode-layout.mjs';
export * from './lib/anatomy-load-state';
export * from './app/body-types';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const a = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const bytes = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const raw = JSON.parse(bytes);
const catalog = a.bodyDisplayCatalog(raw);
const original = JSON.stringify({ raw, catalog });
const source = await readFile('app/body-scene.tsx', 'utf8');
const parsed = ts.createSourceFile('body-scene.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const scene = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'BodyScene');
assert(scene?.body, 'Actual BodyScene function exists');
const statements = [];
for (const statement of scene.body.statements) {
  statements.push(statement.getText(parsed));
  if (ts.isVariableStatement(statement) && statement.declarationList.declarations.some(d => d.name.getText(parsed) === 'offsets')) break;
}
assert(statements.at(-1).includes('const offsets'), 'Execute through actual offsets memo');
const code = transformSync(`function pipeline(props) { ${statements.join('\n')} return { rendered, frame, center, tray, offsets }; }`, { loader: 'ts', format: 'cjs' }).code;
function renderer() {
  const memo = [];
  let index = 0;
  const pipeline = runInNewContext(code + ';pipeline', {
    ...a, THREE: a, Map,
    useMemo(fn, deps) {
      const slot = index++;
      const previous = memo[slot];
      if (previous && deps.length === previous.deps.length && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return previous.value;
      const value = fn();
      memo[slot] = { deps, value };
      return value;
    },
  });
  return props => { index = 0; return pipeline(props); };
}
const views = ['anterior', 'posterior', 'left', 'right', 'superior', 'inferior'];
const sides = ['both', 'left', 'right'];
const systems = Object.fromEntries(Object.keys(a.bodySystems).map(id => [id, true]));
let checks = 0, trayCases = 0, extractCases = 0, transitionCases = 0, compoundCases = 0;
function check(condition, message) { assert.ok(condition, message); checks++; }
function same(actual, expected, message) { assert.deepEqual(actual, expected, message); checks++; }
function extent(box, axis) {
  const center = box.getCenter(new a.Vector3()).dot(axis), size = box.getSize(new a.Vector3());
  const half = (Math.abs(axis.x) * size.x + Math.abs(axis.y) * size.y + Math.abs(axis.z) * size.z) / 2;
  return [center - half, center + half];
}
function scope(region, side) {
  return catalog.structures.filter(item => (region === 'whole-body' || item.regions.includes(region)) && a.bodySideMatches(item, side))
    .map(item => {
      const projected = a.bodyPresentationStructure(item, side);
      if (item.presentationParts && side !== 'both') {
        const part = item.presentationParts.find(p => p.displaySide === side);
        same(projected.bounds, part.bounds, `${item.id}/${side}: split bounds`);
        same(projected.center, part.center, `${item.id}/${side}: split center`);
        same(projected.nodeName, part.nodeName, `${item.id}/${side}: split node`);
        same(projected.id, item.id, 'Compound source identity retained');
        compoundCases++;
      }
      return projected;
    });
}
function propsFor(structures, view, layout, selectedId, extra = {}) {
  return { structures, systems, hiddenIds: [], ghostRemoved: false, exam: false,
    focus: false, inspectionBounds: undefined, view, layout, selectedId,
    explode: 100, anchorSkeleton: true, ...extra };
}
function keysCheck(result, expected, label) {
  same([...result.offsets.keys()], expected.map(item => item.id), `${label}: only rendered IDs receive offsets`);
  check([...result.offsets.values()].every(v => v.toArray().every(Number.isFinite)), `${label}: finite offsets`);
}
function trayCheck(result, view, label) {
  const target = a.arrangeBodyStructures(result.rendered, result.center, view);
  const axes = a.arrangementAxes(view);
  const projected = result.rendered.map(item => {
    const offset = result.offsets.get(item.id);
    check(offset.distanceTo(target.offsets.get(item.id)) < 1e-7, `${label}/${item.id}: 100% tray destination`);
    const box = a.translatedBox(item.bounds, offset);
    return [extent(box, axes.right), extent(box, axes.up)];
  });
  for (let i = 0; i < projected.length; i++) for (let j = i + 1; j < projected.length; j++)
    check(projected[i].some((x, axis) => {
      const y = projected[j][axis];
      return Math.max(x[0] - y[1], y[0] - x[1]) >= target.gap - 1e-7;
    }), `${label}: projected Tray clearance ${result.rendered[i].id}/${result.rendered[j].id}`);
  trayCases++;
}
function extractCheck(result, props, label) {
  const context = result.rendered.filter(item => !props.hiddenIds.includes(item.id));
  const selected = context.find(item => item.id === props.selectedId);
  const others = context.filter(item => item.id !== props.selectedId);
  same([...result.tray.keys()], selected && others.length ? [selected.id] : [], `${label}: extraction target identity`);
  for (const item of result.rendered) {
    if (!selected || !others.length || item.id !== selected.id)
      check(result.offsets.get(item.id).length() < 1e-7, `${label}/${item.id}: nonselected or hidden stays assembled`);
  }
  if (selected && others.length) {
    const axis = a.arrangementAxes(props.view).right;
    const moved = extent(a.translatedBox(selected.bounds, result.offsets.get(selected.id)), axis);
    const rest = extent(a.arrangementBounds(others, new Map()), axis);
    check(moved[1] < rest[0] - 1e-7 || moved[0] > rest[1] + 1e-7, `${label}/${selected.id}: Extract clears complete rendered context`);
  }
  extractCases++;
}
const scopes = [];
for (const region of ['whole-body', ...new Set(catalog.regions.map(r => r.id))]) {
  const render = renderer(); // Reuse memo slots across actual side/view/layout transitions.
  for (const side of sides) {
    const structures = scope(region, side);
    check(structures.length > 0, `${region}/${side}: populated real display scope`);
    scopes.push({ region, side, entries: structures.length });
    for (const view of views) {
      const label = `${region}/${side}/${view}`;
      const chosen = structures[0];
      const variants = [
        {},
        { systems: { ...systems, [chosen.system]: false } },
        { hiddenIds: [chosen.id], ghostRemoved: false },
        { hiddenIds: [chosen.id], ghostRemoved: true },
        { systems: Object.fromEntries(Object.keys(systems).map(id => [id, false])) },
      ];
      for (const [variant, extra] of variants.entries()) {
        const props = propsFor(structures, view, 'tray', chosen.id, extra);
        const result = render(props);
        const expected = structures.filter(item => props.systems[item.system] && (!props.hiddenIds.includes(item.id) || props.ghostRemoved));
        keysCheck(result, expected, `${label}/variant${variant}`);
        trayCheck(result, view, `${label}/variant${variant}`);
        const fresh = renderer()(props);
        for (const [id, offset] of result.offsets)
          check(offset.distanceTo(fresh.offsets.get(id)) < 1e-7, `${label}/${id}: transitioned memo equals fresh calculation`);
        transitionCases++;
        const extractProps = { ...props, layout: 'extract' };
        const extracted = render(extractProps);
        keysCheck(extracted, expected, `${label}/extractVariant${variant}`);
        extractCheck(extracted, extractProps, `${label}/extractVariant${variant}`);
      }
      // Every selection in every registered region, side and standard projection.
      for (const selectedId of [...structures.map(item => item.id), null, 'absent-id']) {
        const props = propsFor(structures, view, 'extract', selectedId);
        extractCheck(render(props), props, label);
      }
    }
  }
}
same(JSON.stringify({ raw, catalog }), original, 'Canonical and projected source coordinates/metadata remain unchanged');
console.log(JSON.stringify({ passed: true, checks, trayCases, extractCases, transitionCases, compoundCases,
  displayEntries: catalog.structures.length, scopes,
  catalogSha256: createHash('sha256').update(bytes).digest('hex'),
  bodySceneSha256: createHash('sha256').update(source).digest('hex'),
  sourceGeometryModified: false, clinicalValidation: false,
  limits: 'CPU execution of actual scene memo pipeline with injected useMemo. Conservative entry-bounds clearance at 100% in six aligned standard views only; no arbitrary orbit, intermediate amount, within-compound, GPU/browser or clinical nonoverlap claim.' }, null, 2));
