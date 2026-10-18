import type { AnatomyLinkEntry } from './anatomy-link-registry';
import { imagingBridge, type AdapterInfo, type createImagingBridge } from './imaging-sync';

export type PausedTourStop = {
  tourId: string;
  revision: string;
  stepId: string;
  structureId: string;
  sources: { file: string; sha256: string }[];
};
type Source = PausedTourStop['sources'][number];
type Scope = 'body' | 'shoulder-pilot' | 'nested';
const label = /^[A-Za-z0-9:._-]{1,220}$/;
const digest = /^[a-f0-9]{64}$/;
const identifier = (value: unknown): value is string => typeof value === 'string' && label.test(value);
const hash = (value: unknown): value is string => typeof value === 'string' && digest.test(value);
const exactKeys = (value: object, keys: readonly string[]) =>
  Reflect.ownKeys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key) &&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'));
const validSources = (value: unknown): value is Source[] =>
  Array.isArray(value) && value.length > 0 && value.length <= 200 &&
  value.every((source) => source && typeof source === 'object' &&
    exactKeys(source, ['file', 'sha256']) &&
    identifier(source.file) && hash(source.sha256)) &&
  new Set(value.map((source) => source.file)).size === value.length;
const sameSources = (a: readonly Source[], b: readonly Source[]) =>
  a.length === b.length && a.every((source, index) =>
    source.file === b[index].file && source.sha256 === b[index].sha256);
const scopeFor = (id: string): Scope | null =>
  id.startsWith('vm:anatomy:body:') ? 'body' : null;

export function createPausedTourImaging({ entries, allowedIds, bridge = imagingBridge }: {
  entries: readonly AnatomyLinkEntry[];
  allowedIds: readonly string[];
  bridge?: ReturnType<typeof createImagingBridge>;
}): PausedTourImaging {
  if (!Array.isArray(entries) || !Array.isArray(allowedIds) ||
    new Set(entries.map((entry) => entry.id)).size !== entries.length ||
    entries.some((entry) => !entry || !identifier(entry.id) ||
      !entry.id.startsWith('vm:anatomy:') || !entry.name ||
      typeof entry.name !== 'string' || !validSources(entry.sources)) ||
    new Set(allowedIds).size !== allowedIds.length ||
    allowedIds.some((id) => !identifier(id)))
    throw new Error('Invalid trusted anatomy catalogue');
  const catalogue = new Map(entries.map((entry) => [entry.id, structuredClone(entry)]));
  const allowed = new Set([...allowedIds]);
  let stop: PausedTourStop | null = null;
  let paused = false, enabled = false, disposed = false, notice = '';
  let adapter: AdapterInfo | null = bridge.getAdapter();
  let unsubscribeBridge: (() => void) | null = null;
  const listeners = new Set<() => void>();
  const invalidations = new Set<() => void>();
  const notify = (set: Set<() => void>) => {
    for (const listener of [...set]) if (set.has(listener)) {
      try { listener(); } catch { /* One observer cannot interrupt others. */ }
    }
  };
  const invalidate = () => { enabled = false; notice = ''; notify(invalidations); notify(listeners); };
  const observe = () => {
    if (unsubscribeBridge || disposed) return;
    unsubscribeBridge = bridge.subscribe(() => {
      if (disposed) return;
      adapter = bridge.getAdapter();
      invalidate();
    });
  };
  const releaseObservation = () => {
    if (listeners.size || invalidations.size) return;
    unsubscribeBridge?.(); unsubscribeBridge = null;
  };
  const refresh = () => {
    const current = bridge.getAdapter();
    if (adapter?.id !== current?.id || adapter?.label !== current?.label ||
      adapter?.modality !== current?.modality) {
      adapter = current;
      invalidate();
    }
  };
  const eligible = () => !disposed && paused && stop !== null &&
    catalogue.has(stop.structureId) && allowed.has(stop.structureId) && adapter !== null;
  const current = () => {
    refresh();
    return eligible();
  };
  return {
    setStop(value, isPaused) {
      if (disposed) return;
      refresh();
      let next: PausedTourStop | null = null;
      if (value && exactKeys(value, ['tourId', 'revision', 'stepId', 'structureId', 'sources']) &&
        identifier(value.tourId) && identifier(value.revision) &&
        identifier(value.stepId) && identifier(value.structureId) &&
        validSources(value.sources)) {
        const entry = catalogue.get(value.structureId);
        if (entry && scopeFor(value.structureId) === 'body' &&
          allowed.has(value.structureId) && sameSources(value.sources, entry.sources))
          next = structuredClone(value);
      }
      const nextPaused = isPaused === true;
      const changed = JSON.stringify(stop) !== JSON.stringify(next) || paused !== nextPaused;
      if (!changed) return;
      stop = next; paused = nextPaused;
      invalidate();
    },
    suspend() {
      if (disposed) return;
      if (!paused && !enabled && !notice) return;
      paused = false;
      invalidate();
    },
    setEnabled(value) {
      if (disposed) return;
      const next = value === true && current();
      if (enabled === next) return;
      enabled = next; notice = '';
      if (!next) notify(invalidations);
      notify(listeners);
    },
    send() {
      if (!current() || !enabled || !stop) return false;
      const entry = catalogue.get(stop.structureId);
      if (!entry || !sameSources(stop.sources, entry.sources)) { invalidate(); return false; }
      const identity = JSON.stringify(stop), target = adapter;
      const sent = bridge.publish(entry);
      refresh();
      if (!sent || disposed || !enabled || !eligible() || adapter !== target ||
        JSON.stringify(stop) !== identity) return false;
      notice = 'Conceptual anatomy request sent to the connected Education viewer.';
      notify(listeners);
      return true;
    },
    snapshot() {
      const ready = current();
      return {
        adapter: adapter ? { ...adapter } : null,
        eligible: ready,
        enabled: ready && enabled,
        structureName: ready ? catalogue.get(stop!.structureId)!.name : null,
        notice: notice || (!ready ? 'Pause at a ready guided-tour stop to request imaging.' :
          !enabled ? 'Choose to send this conceptual anatomy label to Education.' : ''),
      };
    },
    subscribe(listener) {
      if (disposed) return () => {};
      observe(); listeners.add(listener);
      return () => { listeners.delete(listener); releaseObservation(); };
    },
    subscribeInvalidation(listener) {
      if (disposed) return () => {};
      observe(); invalidations.add(listener);
      return () => { invalidations.delete(listener); releaseObservation(); };
    },
    canNavigate() { return current() && enabled; },
    canAccessAnatomy(anatomy) {
      if (!current() || !enabled || !stop || !anatomy ||
        anatomy.scope !== scopeFor(stop.structureId) ||
        anatomy.structureId !== stop.structureId ||
        !validSources(anatomy.sources)) return false;
      return sameSources(anatomy.sources, stop.sources);
    },
    dispose() {
      if (disposed) return;
      disposed = true; stop = null; paused = false; enabled = false; notice = '';
      notify(invalidations); notify(listeners);
      unsubscribeBridge?.(); unsubscribeBridge = null;
      invalidations.clear(); listeners.clear();
    },
  };
}

export type PausedTourImaging = {
  setStop(stop: PausedTourStop | null, paused: boolean): void;
  suspend(): void;
  setEnabled(enabled: boolean): void;
  send(): boolean;
  snapshot(): { adapter: AdapterInfo | null; eligible: boolean; enabled: boolean; structureName: string | null; notice: string };
  subscribe(listener: () => void): () => void;
  subscribeInvalidation(listener: () => void): () => void;
  canNavigate(): boolean;
  canAccessAnatomy(anatomy: { scope: Scope; structureId: string; sources: Source[] }): boolean;
  dispose(): void;
};
