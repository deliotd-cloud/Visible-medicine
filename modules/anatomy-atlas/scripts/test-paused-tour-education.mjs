import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const built = await build({ stdin: { contents: "export {useBodyEducationLink} from './app/body-education-link'; export {createPausedTourImaging} from './lib/paused-tour-imaging'; export {imagingBridge,createAtlasReceiver} from './lib/imaging-sync';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const listeners = new Map();
const page = { addEventListener(name, callback) { const set = listeners.get(name) ?? new Set(); set.add(callback); listeners.set(name, set); }, removeEventListener(name, callback) { listeners.get(name)?.delete(callback); }, fire(name) { for (const callback of [...(listeners.get(name) ?? [])]) callback(); } };
let slots = [], cursor = 0, effects = [], pending = [], replay = false;
const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const React = { useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; }, useLayoutEffect(fn, deps) { pending.push({ type: 'layout', fn, deps }); }, useEffect(fn, deps) { pending.push({ type: 'effect', fn, deps }); } };
const module = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module, exports: module.exports, window: page, structuredClone, crypto, AbortController, TextEncoder, URLSearchParams, require: (id) => id === 'react' ? React : require(id) });
const api = module.exports;
let checks = 0;
function equal(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function yes(value) { equal(value, true); }
function no(value) { equal(value, false); }
function render(props) {
  cursor = 0; pending = []; api.useBodyEducationLink(props);
  for (const type of ['layout', 'effect']) pending.forEach((item, index) => {
    if (item.type !== type) return;
    const prior = effects[index];
    if (!replay && prior && same(prior.deps, item.deps)) return;
    prior?.cleanup?.();
    effects[index] = { deps: item.deps, cleanup: item.fn() };
  });
  replay = false;
}
function cleanup() { for (const effect of effects) effect?.cleanup?.(); effects = []; slots = []; }
function strictReplay(props) { for (const effect of effects) effect?.cleanup?.(); effects = []; replay = true; render(props); }
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const hash = 'a'.repeat(64), staleHash = 'b'.repeat(64);
const id = 'vm:anatomy:body:shoulder-arm:right:muscle:synthetic';
const sources = [{ file: 'SYNTHETIC', sha256: hash }];
const entry = { id, name: 'Synthetic muscle', sources, reference: { frame: 'synthetic', kind: 'surface-bounds-centre', point: [0, 0, 0] } };
const stop = { tourId: 'synthetic-tour', revision: 'rev-1', stepId: 'step-1', structureId: id, sources };
const anatomy = { scope: 'body', structureId: id, sources };
const kinds = {
  ct: { type: 'volume', id: 'anchor', seriesId: 'series', frameId: 'frame', annotationId: 'annotation', geometry: 'point' },
  mri: { type: 'volume', id: 'anchor', seriesId: 'series', frameId: 'frame', annotationId: 'annotation', geometry: 'point' },
  xray: { type: 'projection', id: 'anchor', imageId: 'image', annotationId: 'annotation', projectionId: 'projection' },
  ultrasound: { type: 'ultrasound', id: 'anchor', clipId: 'clip', annotationId: 'annotation', viewId: 'view', frameIndex: 1, timeMs: null },
};
function scenario(kind, rules = {}) {
  const resource = { id: 'vm:resource:synthetic', revision: 1, kind, title: 'Synthetic fixture', ageGroup: 'adult', laterality: 'right', regionIds: ['shoulder-arm'], material: { sha256: hash, origin: 'synthetic' }, anchors: [kinds[kind]] };
  const link = { id: 'vm:link:synthetic', revision: 1, anatomy, resourceId: resource.id, resourceRevision: 1, materialSha256: hash, anchorId: 'anchor', relation: 'exact' };
  const document = { schemaVersion: 1, resources: [resource], links: [link] };
  const gate = api.createPausedTourImaging({ entries: [entry], allowedIds: [id] });
  let observers = 0;
  const subscribeInvalidation = gate.subscribeInvalidation;
  gate.subscribeInvalidation = (listener) => { observers++; const unsubscribe = subscribeInvalidation(listener); return () => { observers--; unsubscribe(); }; };
  const props = { entries: [entry], allowedIds: [id], disabled: true, contextKey: 'shoulder-arm/right', enabled: true, pausedTour: gate, allowPausedTour: true };
  let selected = 0, selection, context, resolveFlight, viewerCanNavigate = true;
  const guards = [], media = [], statuses = [];
  const detach = api.imagingBridge.attachAtlas(api.createAtlasReceiver(() => ({ enabled: false, disabled: true, entries: [entry], allowedIds: [id], onSelect: () => selected++ }), () => {}));
  render(props);
  const facade = page.visibleMedicineBodyEducation;
  assert(facade); checks++;
  const policy = { canNavigate: () => rules.navigate !== false, canAccessAnatomy: () => rules.anatomy !== false, canAccess: () => rules.resource !== false, resourceCleared: () => rules.resourceCleared !== false, correspondenceCleared: () => rules.correspondenceCleared !== false };
  const viewer = { getStudy: () => ({ resourceId: resource.id, revision: 1, materialSha256: hash }), canNavigate: () => viewerCanNavigate,
    async reveal(match, guard) { guards.push(guard); await new Promise((resolve) => { resolveFlight = resolve; }); if (guard.isCurrent()) media.push(match); },
    subscribeSelection(listener) { selection = listener; return () => { selection = null; }; },
    subscribeContext(listener) { context = listener; return () => { context = null; }; } };
  const connection = facade.connect({ document, policy, viewer, onStatus: (status) => statuses.push(status) });
  connection.setEnabled(rules.hostEnabled !== false);
  gate.setStop(stop, true);
  return { gate, props, facade, connection, guards, media, statuses, document, policy, viewer,
    observers: () => observers,
    getSelected: () => selected, incoming: (messageId = 'manual') => selection({ messageId, locator: { version: 1, linkId: link.id, linkRevision: 1, resourceId: resource.id, resourceRevision: 1, anchorId: 'anchor' } }),
    context: () => context(), release: () => { resolveFlight?.(); resolveFlight = null; }, setViewerNavigation: (value) => { viewerCanNavigate = value; },
    close() { connection.dispose(); gate.dispose(); detach(); cleanup(); } };
}

for (const kind of Object.keys(kinds)) {
  const f = scenario(kind);
  yes(f.gate.snapshot().eligible); f.gate.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 1);
  equal(f.incoming('manual-disabled').status, 'paused'); equal(f.getSelected(), 0);
  f.gate.setStop({ ...stop, sources: [{ file: 'SYNTHETIC', sha256: staleHash }] }, true);
  yes(f.guards[0].signal.aborted); no(f.guards[0].isCurrent()); no(f.gate.send());
  f.release(); await tick(); equal(f.media.length, 0); f.close();
}
for (const denied of ['navigate', 'anatomy', 'resource', 'resourceCleared', 'correspondenceCleared', 'viewer']) {
  const rules = denied === 'viewer' ? {} : { [denied]: false };
  const f = scenario('ct', rules); if (denied === 'viewer') f.setViewerNavigation(false);
  f.gate.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 0); equal(f.media.length, 0);
  f.close();
}
{
  const f = scenario('mri');
  f.gate.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 1);
  render({ ...f.props, allowedIds: [], contextKey: 'shoulder-arm/left' });
  yes(f.guards[0].signal.aborted); no(f.guards[0].isCurrent()); f.release(); await tick(); equal(f.media.length, 0);
  yes(f.gate.send()); equal(f.guards.length, 1); f.close();
}
{
  const f = scenario('xray');
  equal(f.observers(), 1); strictReplay(f.props); equal(f.observers(), 1); equal(page.visibleMedicineBodyEducation !== undefined, true);
  const replayApi = page.visibleMedicineBodyEducation; assert(replayApi !== f.facade); checks++;
  const replayConnection = replayApi.connect({ document: f.document, policy: f.policy, viewer: f.viewer }); replayConnection.setEnabled(true);
  f.gate.setStop(stop, true); f.gate.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 1);
  page.fire('pagehide'); equal(page.visibleMedicineBodyEducation, undefined); yes(f.guards[0].signal.aborted); no(f.gate.send());
  f.release(); await tick(); equal(f.media.length, 0);
  page.fire('pageshow'); const nextApi = page.visibleMedicineBodyEducation; assert(nextApi && nextApi !== f.facade); checks++;
  no(f.gate.send()); const next = nextApi.connect({ document: f.document, policy: f.policy, viewer: f.viewer }); next.setEnabled(true);
  no(f.gate.send()); f.gate.setStop(stop, true); f.gate.setEnabled(true); yes(f.gate.send());
  next.dispose(); replayConnection.dispose(); f.close(); equal(f.observers(), 0);
}
{
  const f = scenario('ultrasound');
  f.gate.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 1);
  render({ ...f.props, contextKey: 'assessment', allowPausedTour: false });
  yes(f.guards[0].signal.aborted); no(f.gate.send()); f.release(); await tick(); equal(f.media.length, 0);
  f.close();
}
{
  const f = scenario('ct', { hostEnabled: false });
  f.gate.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 0);
  render({ ...f.props, contextKey: 'shoulder-arm/left' });
  render({ ...f.props, contextKey: 'shoulder-arm/right' });
  yes(f.gate.send()); equal(f.guards.length, 0);
  f.connection.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 1);
  f.gate.suspend(); yes(f.guards[0].signal.aborted); f.release(); await tick(); equal(f.media.length, 0);
  f.close();
}
{
  const f = scenario('mri');
  f.gate.setEnabled(true); yes(f.gate.send()); equal(f.guards.length, 1);
  const changedEntry = { ...entry, sources: [{ file: 'SYNTHETIC-NEW', sha256: staleHash }] };
  const nextGate = api.createPausedTourImaging({ entries: [changedEntry], allowedIds: [id] });
  nextGate.setStop({ ...stop, revision: 'rev-2', sources: changedEntry.sources }, true);
  nextGate.setEnabled(true);
  render({ ...f.props, entries: [changedEntry], pausedTour: nextGate, contextKey: 'shoulder-arm/left' });
  equal(page.visibleMedicineBodyEducation !== f.facade, true);
  assert.throws(() => f.facade.connect({ document: f.document, policy: f.policy, viewer: f.viewer })); checks++;
  yes(f.guards[0].signal.aborted); no(nextGate.canNavigate()); no(nextGate.send());
  assert.throws(() => page.visibleMedicineBodyEducation.connect({ document: f.document, policy: f.policy, viewer: f.viewer })); checks++;
  f.release(); await tick(); equal(f.media.length, 0);
  nextGate.dispose(); f.close();
}
console.log(JSON.stringify({ passed: true, checks, productionHookAndRootApi: true, syntheticModalities: Object.keys(kinds) }));
