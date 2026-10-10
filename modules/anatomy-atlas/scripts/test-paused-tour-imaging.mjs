import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';

const built = await build({ stdin: { contents: "export * from './lib/paused-tour-imaging'; export * from './lib/imaging-sync'; export * from './lib/learning-resources'; export * from './lib/didanix-atlas-adapter';", resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const hash = 'a'.repeat(64), otherHash = 'b'.repeat(64);
const id = 'vm:anatomy:body:shoulder-arm:right:muscle:test';
const sources = [{ file: 'SYNTHETIC', sha256: hash }];
const entry = { id, name: 'Synthetic muscle', sources, reference: { frame: 'synthetic', kind: 'surface-bounds-centre', point: [0, 0, 0] } };
const stop = { tourId: 'body-tour', revision: 'rev-1', stepId: 'step-1', structureId: id, sources };
const anatomy = { scope: 'body', structureId: id, sources };
const resource = { id: 'vm:resource:synthetic', revision: 1, kind: 'ct', title: 'Synthetic fixture', ageGroup: 'adult', laterality: 'right', regionIds: ['shoulder-arm'], material: { sha256: hash, origin: 'synthetic' }, anchors: [{ type: 'volume', id: 'anchor', seriesId: 'series', frameId: 'frame', annotationId: 'annotation', geometry: 'point' }] };
const link = { id: 'vm:link:synthetic', revision: 1, anatomy, resourceId: resource.id, resourceRevision: 1, materialSha256: hash, anchorId: 'anchor', relation: 'exact' };
const locator = { version: 1, linkId: link.id, linkRevision: 1, resourceId: resource.id, resourceRevision: 1, anchorId: 'anchor' };
let checks = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const yes = (value) => { assert.equal(value, true); checks++; };
const no = (value) => { assert.equal(value, false); checks++; };

function fixture() {
  const bridge = api.createImagingBridge();
  const gate = api.createPausedTourImaging({ entries: [entry], allowedIds: [id], bridge });
  let selected = 0, incoming, context, pendingResolve, viewerEnabled = true, manualEnabled = false;
  const guards = [], revealed = [], publications = [];
  const registry = api.createLearningRegistry({ schemaVersion: 1, resources: [resource], links: [link] }, [anatomy], {
    canNavigate: gate.canNavigate,
    canAccessAnatomy: gate.canAccessAnatomy,
    canAccess: () => true, resourceCleared: () => true, correspondenceCleared: () => true,
  });
  const receiver = api.createAtlasReceiver(() => ({ enabled: manualEnabled, disabled: false, entries: [entry], allowedIds: [id], onSelect: () => { selected++; } }), () => {});
  const detach = bridge.attachAtlas(receiver);
  const viewer = {
    getStudy: () => ({ resourceId: resource.id, revision: 1, materialSha256: hash }),
    canNavigate: () => viewerEnabled,
    async reveal(match, guard) { guards.push(guard); await new Promise((resolve) => { pendingResolve = resolve; }); if (guard.isCurrent()) revealed.push(match); },
    subscribeSelection: (listener) => { incoming = listener; return () => { incoming = null; }; },
    subscribeContext: (listener) => { context = listener; return () => { context = null; }; },
  };
  const education = api.connectDidanixEducation({ bridge, registry, viewer, scope: 'body' });
  education.setEnabled(true);
  const release = () => { pendingResolve?.(); pendingResolve = null; };
  return { bridge, gate, education, detach, guards, revealed, publications, release,
    incoming: (messageId = 'manual') => incoming({ messageId, locator }),
    context: () => context(), selected: () => selected, manualEnabled: (value) => { manualEnabled = value; }, viewerEnabled: (value) => { viewerEnabled = value; } };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
{
  const f = fixture();
  no(f.gate.snapshot().eligible); no(f.gate.send()); equal(f.selected(), 0);
  f.gate.setStop(stop, false); f.gate.setEnabled(true); no(f.gate.canNavigate());
  f.gate.setStop({ ...stop, sources: [{ file: 'SYNTHETIC', sha256: otherHash }] }, true);
  no(f.gate.snapshot().eligible);
  f.gate.setStop(stop, true); yes(f.gate.snapshot().eligible); no(f.gate.snapshot().enabled);
  f.gate.setEnabled(true); yes(f.gate.canNavigate());
  yes(f.gate.canAccessAnatomy(anatomy));
  no(f.gate.canAccessAnatomy({ ...anatomy, scope: 'nested' }));
  no(f.gate.canAccessAnatomy({ ...anatomy, sources: [{ file: 'SYNTHETIC', sha256: otherHash }] }));
  no(f.gate.canAccessAnatomy({ ...anatomy, structureId: 'vm:anatomy:body:other' }));
  yes(f.gate.send()); equal(f.selected(), 0); equal(f.guards.length, 1);
  assert.match(f.gate.snapshot().notice, /request sent/i); checks++;
  f.gate.suspend(); no(f.gate.canNavigate()); no(f.gate.send()); equal(f.selected(), 0);
  f.release(); await tick(); equal(f.revealed.length, 0);
  f.education.dispose(); f.gate.dispose(); f.detach();
}
{
  const f = fixture();
  f.gate.setStop(stop, true); f.gate.setEnabled(true);
  const noSelection = f.incoming('manual-before-host-disable');
  // Existing root receiver remains responsible for incoming manual selection.
  equal(noSelection.status, 'paused'); equal(f.selected(), 0);
  f.manualEnabled(true); equal(f.incoming('manual-enabled').status, 'selected'); equal(f.selected(), 1);
  f.gate.setStop({ ...stop, revision: 'rev-2' }, true);
  no(f.gate.canNavigate()); f.gate.setEnabled(true);
  f.gate.setStop({ ...stop, stepId: 'step-2' }, true); no(f.gate.canNavigate());
  f.gate.setStop(stop, true); f.gate.setEnabled(true);
  f.gate.setStop({ ...stop, tourId: 'other-tour' }, true); no(f.gate.canNavigate());
  f.gate.setStop(stop, true); f.gate.setEnabled(true);
  let invalidated = 0; const unlisten = f.gate.subscribeInvalidation(() => { invalidated++; f.education.cancelPending?.(); });
  yes(f.gate.send()); equal(f.guards.length, 1);
  f.context(); no(f.gate.canNavigate()); assert(invalidated > 0); checks++;
  yes(f.guards[0].signal.aborted); no(f.guards[0].isCurrent()); f.release(); await tick(); equal(f.revealed.length, 0);
  unlisten(); f.education.dispose(); f.gate.dispose(); f.detach();
}
{
  const bridge = api.createImagingBridge();
  const gate = api.createPausedTourImaging({ entries: [entry], allowedIds: [id], bridge });
  const unsubscribe = gate.subscribe(() => {});
  gate.setStop(stop, true);
  let published = 0;
  const adapter = bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic Education', modality: 'CT', onAtlasSelection: (selection) => {
    published++; equal(selection.origin, 'atlas'); equal(selection.structureId, id);
    equal(selection.anatomy.sources, sources);
    selection.anatomy.sources[0].sha256 = otherHash;
  } });
  gate.setEnabled(true); yes(gate.send()); equal(published, 1);
  yes(gate.canAccessAnatomy(anatomy));
  adapter.pause(); no(gate.canNavigate()); no(gate.send());
  gate.setEnabled(true); adapter.dispose(); no(gate.canNavigate()); no(gate.snapshot().eligible);
  const replacement = bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic Education', modality: 'CT', onAtlasSelection: () => { published++; } });
  no(gate.canNavigate()); gate.setEnabled(true); yes(gate.send()); equal(published, 2);
  unsubscribe(); gate.dispose(); gate.dispose(); no(gate.send()); replacement.dispose();
}
{
  const original = structuredClone(entry), inputAllowed = [id];
  const bridge = api.createImagingBridge();
  const gate = api.createPausedTourImaging({ entries: [original], allowedIds: inputAllowed, bridge });
  original.name = 'Mutated'; original.sources[0].sha256 = otherHash; inputAllowed.length = 0;
  const adapter = bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic', modality: 'CT', onAtlasSelection: () => {} });
  gate.setStop(stop, true); yes(gate.snapshot().eligible); equal(gate.snapshot().structureName, entry.name);
  gate.dispose(); adapter.dispose();
  assert.throws(() => api.createPausedTourImaging({ entries: [entry, entry], allowedIds: [id], bridge })); checks++;
  assert.throws(() => api.createPausedTourImaging({ entries: [entry], allowedIds: [id, id], bridge })); checks++;
}
{
  const twoSources = [{ file: 'ONE', sha256: hash }, { file: 'TWO', sha256: otherHash }];
  const trusted = { ...entry, sources: twoSources };
  const bridge = api.createImagingBridge();
  const gate = api.createPausedTourImaging({ entries: [trusted], allowedIds: [id], bridge });
  const adapter = bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic', modality: 'CT', onAtlasSelection: () => {} });
  gate.setStop({ ...stop, sources: [...twoSources].reverse() }, true); no(gate.snapshot().eligible);
  gate.setStop({ ...stop, sources: twoSources }, true); yes(gate.snapshot().eligible);
  gate.setEnabled(true); no(gate.canAccessAnatomy({ ...anatomy, sources: [...twoSources].reverse() }));
  yes(gate.canAccessAnatomy({ ...anatomy, sources: twoSources }));
  gate.dispose(); adapter.dispose();
}
{
  const underlying = api.createImagingBridge();
  let subscribed = 0, active = 0;
  const bridge = { ...underlying, subscribe(listener) {
    subscribed++; active++;
    const unsubscribe = underlying.subscribe(listener);
    return () => { active--; unsubscribe(); };
  } };
  const gate = api.createPausedTourImaging({ entries: [entry], allowedIds: [id], bridge });
  equal(subscribed, 0); equal(active, 0);
  const one = gate.subscribe(() => {}), two = gate.subscribeInvalidation(() => {});
  equal(subscribed, 1); equal(active, 1);
  one(); equal(active, 1); two(); equal(active, 0);
  const three = gate.subscribe(() => {}); equal(subscribed, 2); three(); equal(active, 0);
  gate.dispose(); equal(active, 0);
}
{
  const bridge = api.createImagingBridge();
  const gate = api.createPausedTourImaging({ entries: [entry], allowedIds: [id], bridge });
  let ownHandle, echo;
  ownHandle = bridge.registerAdapter({ id: 'echo', label: 'Synthetic Echo', modality: 'CT', onAtlasSelection: (selection) => {
    echo = ownHandle.selectStructure({ version: 1, origin: 'imaging', messageId: selection.messageId, structureId: id });
  } });
  bridge.attachAtlas(api.createAtlasReceiver(() => ({ enabled: true, disabled: false, entries: [entry], allowedIds: [id], onSelect: () => { throw Error('Echo selected root'); } }), () => {}));
  gate.setStop(stop, true); gate.setEnabled(true); yes(gate.send()); equal(echo.status, 'duplicate');
  gate.dispose(); ownHandle.dispose();
}
{
  const bridge = api.createImagingBridge();
  const gate = api.createPausedTourImaging({ entries: [entry], allowedIds: [id], bridge });
  const adapter = bridge.registerAdapter({ id: 'synthetic', label: 'Synthetic', modality: 'CT', onAtlasSelection: () => {} });
  gate.setStop({ ...stop, revision: 123 }, true); no(gate.snapshot().eligible);
  gate.setStop({ ...stop, stepId: undefined }, true); no(gate.snapshot().eligible);
  gate.setStop({ ...stop, sources: [{ file: 'SYNTHETIC', sha256: undefined }] }, true); no(gate.snapshot().eligible);
  gate.setStop({ ...stop, sources: [{ file: 'SYNTHETIC', sha256: hash, extra: true }] }, true); no(gate.snapshot().eligible);
  gate.dispose(); adapter.dispose();
}
console.log(JSON.stringify({ passed: true, checks, syntheticOnly: true, noRootReceiverInstalled: true }));
