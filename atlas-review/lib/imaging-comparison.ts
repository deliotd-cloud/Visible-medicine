import type { AnatomyLinkEntry } from './anatomy-link-registry';

export const imagePlanes = ['axial', 'coronal', 'sagittal'] as const;
export type ImagePlane = (typeof imagePlanes)[number];
export type ComparisonFrame = {
  /** Adapter-owned frame revision, not a patient coordinate or atlas offset. */
  revision: number;
  status: 'ready' | 'loading' | 'unmapped' | 'access-denied' | 'error';
  anatomy: Pick<AnatomyLinkEntry, 'id' | 'sources'> | null;
  plane: ImagePlane;
  slice: number;
  sliceCount: number;
};
export type ComparisonSnapshot = {
  adapterId: string;
  label: string;
  modality: 'CT' | 'MRI';
  frame: ComparisonFrame;
};
type Adapter = {
  id: string;
  label: string;
  modality: 'CT' | 'MRI';
  onPlane: (plane: ImagePlane) => void | Promise<void>;
  onSlice: (slice: number) => void | Promise<void>;
  /** Mount only rights-cleared teaching imagery. Return a synchronous disposer. */
  mount: (element: HTMLElement, frame: ComparisonFrame) => () => void;
};
const identifier = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9:._-]{1,220}$/.test(v);
function validFrame(frame: ComparisonFrame) {
  return (
    Number.isSafeInteger(frame.revision) &&
    frame.revision >= 0 &&
    ['ready', 'loading', 'unmapped', 'access-denied', 'error'].includes(
      frame.status,
    ) &&
    imagePlanes.includes(frame.plane) &&
    Number.isSafeInteger(frame.sliceCount) &&
    frame.sliceCount > 0 &&
    frame.sliceCount <= 100000 &&
    Number.isSafeInteger(frame.slice) &&
    frame.slice >= 0 &&
    frame.slice < frame.sliceCount &&
    (frame.status !== 'ready' || !!frame.anatomy) &&
    (!frame.anatomy ||
      (identifier(frame.anatomy.id) &&
        frame.anatomy.id.startsWith('vm:anatomy:') &&
        Array.isArray(frame.anatomy.sources) &&
        frame.anatomy.sources.length > 0 &&
        frame.anatomy.sources.length <= 1000 &&
        new Set(frame.anatomy.sources.map((source) => source.file)).size ===
          frame.anatomy.sources.length &&
        frame.anatomy.sources.every(
          (source) =>
            identifier(source.file) && /^[a-f0-9]{64}$/.test(source.sha256),
        )))
  );
}
function immutableFrame(value: ComparisonFrame): ComparisonFrame {
  if (!validFrame(value)) throw new Error('Invalid comparison frame');
  // Deliberately select fields: never retain arbitrary patient metadata in this bridge.
  return Object.freeze({
    revision: value.revision,
    status: value.status,
    plane: value.plane,
    slice: value.slice,
    sliceCount: value.sliceCount,
    anatomy: value.anatomy
      ? Object.freeze({
          id: value.anatomy.id,
          sources: Object.freeze(
            value.anatomy.sources.map((source) =>
              Object.freeze({
                file: source.file,
                sha256: source.sha256,
              }),
            ),
          ) as unknown as AnatomyLinkEntry['sources'],
        })
      : null,
  });
}
/** Identity and exact source evidence only; no spatial registration is inferred. */
export function comparisonAvailability(
  snapshot: ComparisonSnapshot | null,
  selected: AnatomyLinkEntry | null,
  linkedAdapterId: string | null,
  enabled: boolean,
  disabled: boolean,
):
  | 'disconnected'
  | 'paused'
  | 'select-structure'
  | 'source-mismatch'
  | ComparisonFrame['status'] {
  if (!snapshot || snapshot.adapterId !== linkedAdapterId)
    return 'disconnected';
  if (disabled || !enabled) return 'paused';
  if (!selected) return 'select-structure';
  if (snapshot.frame.status !== 'ready') return snapshot.frame.status;
  const mapped = snapshot.frame.anatomy;
  if (!mapped || mapped.id !== selected.id) return 'unmapped';
  const key = (sources: AnatomyLinkEntry['sources']) =>
    sources
      .map((s) => `${s.file}:${s.sha256}`)
      .sort()
      .join('|');
  return key(mapped.sources) === key(selected.sources)
    ? 'ready'
    : 'source-mismatch';
}

/** Same-document host integration. No network, scan loader, entitlement or registration provider. */
export function createComparisonBridge() {
  let owner: Adapter | null = null;
  let snapshot: ComparisonSnapshot | null = null;
  const listeners = new Set<() => void>();
  const changed = () => {
    // Observers must not interrupt ownership/cleanup or extend this delivery.
    const currentListeners = [...listeners];
    for (const listener of currentListeners) {
      if (!listeners.has(listener)) continue;
      try {
        listener();
      } catch {
        // A failing observer cannot prevent the remaining observers updating.
      }
    }
  };
  const fail = (target: Adapter, expected: ComparisonSnapshot) => {
    // Host callbacks can synchronously publish or replace the viewer before
    // failing. Never let superseded work erase a newer frame/access decision.
    if (owner !== target || snapshot !== expected) return;
    snapshot = Object.freeze({
      ...snapshot,
      frame: immutableFrame({
        ...snapshot.frame,
        revision: snapshot.frame.revision + 1,
        status: 'error',
        anatomy: null,
      }),
    });
    changed();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    register(adapter: Adapter, initial: ComparisonFrame) {
      if (owner)
        throw new Error('Disconnect the current comparison viewer first');
      if (
        !identifier(adapter.id) ||
        typeof adapter.label !== 'string' ||
        !adapter.label.trim() ||
        adapter.label.length > 80 ||
        !['CT', 'MRI'].includes(adapter.modality) ||
        ![adapter.onPlane, adapter.onSlice, adapter.mount].every(
          (fn) => typeof fn === 'function',
        )
      )
        throw new Error('Invalid comparison adapter');
      const frame = immutableFrame(initial);
      const target = { ...adapter };
      owner = target;
      snapshot = Object.freeze({
        adapterId: target.id,
        label: target.label,
        modality: target.modality,
        frame,
      });
      changed();
      return {
        update(value: ComparisonFrame) {
          if (
            owner !== target ||
            !snapshot ||
            !value ||
            value.revision <= snapshot.frame.revision
          )
            return false;
          let frame: ComparisonFrame;
          try {
            frame = immutableFrame(value);
          } catch {
            return false;
          }
          snapshot = Object.freeze({ ...snapshot, frame });
          changed();
          return true;
        },
        dispose() {
          if (owner !== target) return;
          owner = null;
          snapshot = null;
          changed();
        },
      };
    },
    request(
      expected: ComparisonSnapshot,
      request: { plane: ImagePlane } | { slice: number },
    ) {
      if (!owner || snapshot !== expected || snapshot.frame.status !== 'ready')
        return false;
      const target = owner;
      try {
        let result: void | Promise<void>;
        if ('plane' in request) {
          if (!imagePlanes.includes(request.plane)) return false;
          result = target.onPlane(request.plane);
        } else {
          if (
            !Number.isInteger(request.slice) ||
            request.slice < 0 ||
            request.slice >= snapshot.frame.sliceCount
          )
            return false;
          result = target.onSlice(request.slice);
        }
        if (result)
          Promise.resolve(result).catch(() => {
            fail(target, expected);
          });
        return true;
      } catch {
        fail(target, expected);
        return false;
      }
    },
    mount(element: HTMLElement, expected: ComparisonSnapshot) {
      if (!owner || snapshot !== expected || snapshot.frame.status !== 'ready')
        return () => {};
      const target = owner;
      try {
        const dispose = target.mount(element, structuredClone(snapshot.frame));
        if (typeof dispose !== 'function')
          throw new Error('Comparison viewer must supply a disposer');
        let disposed = false;
        return () => {
          if (disposed) return;
          disposed = true;
          try {
            dispose();
          } catch {
            /* Disconnected viewers cannot affect the atlas. */
          }
        };
      } catch {
        fail(target, expected);
        return () => {};
      }
    },
  };
}
export const comparisonBridge = createComparisonBridge();
