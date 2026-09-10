import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const result = await build({ stdin: { contents: "export * from './lib/specimen-links.ts'; export * from './lib/um-limb-navigation.ts'; export { limbDefinitions } from './lib/um-limb-studies.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { parseSpecimenLink, makeSpecimenLink, resolveSpecimenLink, limbDefinitions, specimenReturnPath, specimenLinkKeys, specimenLinkKey, canonicalSpecimenValue, specimenNavigationPayload } = api;
let checks = 0, links = 0;
const same = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
const fromHref = href => Object.fromEntries(new URL(href, 'https://atlas.example').searchParams);
const clone = x => JSON.parse(JSON.stringify(x));
const pins = JSON.parse(await readFile('content/um-limb-navigation.v1.json', 'utf8'));
const before = JSON.stringify(limbDefinitions);
for (const [scope, definition] of Object.entries(limbDefinitions)) {
  const pin = pins.scopes.find(p => p.scope === scope);
  same(pin.revision, createHash('sha256').update(canonicalSpecimenValue(specimenNavigationPayload(definition))).digest('hex'));
  for (const surface of definition.surfaces) {
    const href = makeSpecimenLink(definition, { selectedId: surface.id, view: 'posterior', topic: 'function' }); links++;
    same(href.startsWith('/specimens/lower-limb?'), true);
    const params = fromHref(href), parsed = parseSpecimenLink(params), resolved = resolveSpecimenLink(parsed);
    same(resolved.status, 'ready'); same(resolved.scope, scope); same(resolved.selectedId, surface.id);
    same(resolved.view, 'posterior'); same(resolved.topic, 'function'); same(resolved.structureOnly, true);
    same(resolved.state.selectedId, surface.id); same(resolved.state.hidden, []); same(resolved.state.history, []); same(resolved.state.future, []);
    same(Object.keys(params).every(k => specimenLinkKeys.includes(k)), true);
    same(parseSpecimenLink({ ...params, paid: 'true', token: 'not-copied', redirect: 'https://elsewhere.example' }), parsed);
    same(resolveSpecimenLink(parseSpecimenLink({ ...params, specimenSource: '0'.repeat(64) })).status, 'rejected');
    same(resolveSpecimenLink(parseSpecimenLink({ ...params, specimenRevision: '0'.repeat(64) })).status, 'rejected');
  }
  for (const study of definition.studies) for (const id of study.ids) {
    const href = makeSpecimenLink(definition, { selectedId: id, studyId: study.id, view: study.view }); links++;
    const parsed = parseSpecimenLink(fromHref(href)), ready = resolveSpecimenLink(parsed);
    same(ready.status, 'ready'); same(ready.structureOnly, false);
    same(definition.surfaces.filter(s => !ready.state.hidden.includes(s.id)).map(s => s.id).sort(), [...study.ids].sort());
    same(ready.state.selectedId, id);
  }
  const selected = definition.surfaces[0], params = fromHref(makeSpecimenLink(definition, { selectedId: selected.id, view: 'anterior' }));
  for (const key of ['specimen', 'specimenScope', 'specimenPart', 'specimenSource', 'specimenRevision', 'specimenView']) {
    const missing = { ...params }; delete missing[key]; same(parseSpecimenLink(missing).status, 'invalid');
    same(parseSpecimenLink({ ...params, [key]: [params[key], params[key]] }).status, 'invalid');
  }
  for (const bad of [{ specimenScope: '__proto__' }, { specimenPart: 'FMA24474' }, { specimenPart: 'x'.repeat(4096) }, { specimenStudy: '' }, { specimenView: 'javascript:alert(1)' }, { specimenTopic: 'unvalidated-scan' }, { specimenAccess: 'paid' }, { structure: selected.id }]) same(parseSpecimenLink({ ...params, ...bad }).status, 'invalid');
  same(resolveSpecimenLink(parseSpecimenLink({ ...params, specimenStudy: 'not-a-study' })).status, 'rejected');
  const changed = clone(definition); changed.surfaces[0].bounds.min[0] += .1;
  same(makeSpecimenLink(changed, { selectedId: selected.id, view: 'anterior' }), null);
  same(resolveSpecimenLink(parseSpecimenLink(params), { ...limbDefinitions, [scope]: changed }).reason, 'revision-changed');
  const changedRecipe = clone(definition); changedRecipe.studies[0].ids.pop();
  same(makeSpecimenLink(changedRecipe, { selectedId: selected.id, view: 'anterior' }), null);
  same(makeSpecimenLink(definition, { selectedId: 'FMA24474', view: 'anterior' }), null);
}
same(JSON.stringify(limbDefinitions), before);
same(parseSpecimenLink({}), { status: 'none' }); same(parseSpecimenLink(null), { status: 'invalid' });
same(parseSpecimenLink({ study: '1' }), { status: 'invalid' }); same(parseSpecimenLink({ specimen: ['um-limb-1'] }).status, 'invalid');
same(specimenReturnPath('whole'), '/regions/leg'); same(specimenReturnPath('hip-thigh'), '/regions/thigh'); same(specimenReturnPath('foot'), '/regions/foot');
const knee = limbDefinitions.knee, acl = knee.surfaces.find(s => s.slug === 'acl');
same(makeSpecimenLink(knee, { selectedId: acl.id, studyId: 'extensor', view: 'anterior' }), null);
const kneeHref = makeSpecimenLink(knee, { selectedId: acl.id, studyId: 'cruciates', view: 'posterior', topic: 'function' });
const foreign = fromHref(kneeHref); foreign.specimenPart = limbDefinitions.foot.surfaces.find(s => s.slug === 'talus').id;
same(resolveSpecimenLink(parseSpecimenLink(foreign)).reason, 'out-of-scope');
const require = createRequire(import.meta.url), React = require('react');
const built = await componentBuild({ entryPoints: ['app/um-knee-study.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'scene-boundary', setup(api) {
  api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene(props) { globalThis.sceneProps = props; return null; } export function retryBodyAssets() {}' }));
} }] });
const mod = { exports: {} }, context = { module: mod, exports: mod.exports, require, URL, URLSearchParams, console, process: { env: { NODE_ENV: 'test' } } };
runInNewContext(built.outputFiles[0].text, context);
for (const definition of Object.values(limbDefinitions)) {
  const selected = definition.surfaces.at(-1), href = makeSpecimenLink(definition, { selectedId: selected.id, view: 'right', topic: 'function' });
  const navigation = resolveSpecimenLink(parseSpecimenLink(fromHref(href)));
  const html = require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.KneeSpecimenView, { specimen: definition, initialNavigation: navigation }));
  same(html.includes('Link to this study'), true); same(/<button\b(?=[^>]*aria-selected="true")[^>]*>Function<\/button>/.test(html), true, 'Requested Function tab must actually be selected');
  same(context.sceneProps.selectedId, selected.id); same(context.sceneProps.view, 'right');
  same(context.sceneProps.explode, 0); same(context.sceneProps.focus, true); same(context.sceneProps.isolated, true);
  same(JSON.stringify(context.sceneProps.hiddenIds), '[]'); same(context.sceneProps.exam, false);
}
// Exercise the server route boundary without mounting a browser-only viewer.
const route = await componentBuild({ entryPoints: ['app/specimens/lower-limb/page.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'client-boundary', setup(api) {
  api.onLoad({ filter: /specimen-linked-page\.tsx$/ }, () => ({ loader: 'js', contents: 'export default function ClientBoundary(){ return null; }' }));
} }] });
const page = { exports: {} }; runInNewContext(route.outputFiles[0].text, { module: page, exports: page.exports, require, console });
const parsed = parseSpecimenLink(fromHref(kneeHref));
const element = await page.exports.default({ searchParams: Promise.resolve(fromHref(kneeHref)) });
same(JSON.stringify(element.props.link), JSON.stringify(parsed)); same(element.key, specimenLinkKey(parsed));
const invalid = await page.exports.default({ searchParams: Promise.resolve({ specimen: ['um-limb-1', 'um-limb-1'] }) });
same(invalid.props.link.status, 'invalid');
const standalone = await readFile('app/specimens/lower-limb/specimen-linked-page.tsx', 'utf8');
same(standalone.includes('BodyExplorer'), false); same(standalone.includes('specimenReturnPath('), true);
console.log(JSON.stringify({ checks, generatedRoundTrips: links, scopes: 5, currentSourcesAndRecipes: true, sourceOnlyAndStudyState: 'verified', routeBoundaryAndControlMarkup: 'passed', browserOrClinicalAcceptance: false }));
