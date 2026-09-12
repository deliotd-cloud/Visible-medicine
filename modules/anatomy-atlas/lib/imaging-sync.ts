import {
  resolveLinkedStructure,
  type AnatomyLinkEntry,
  type SelectionResolution,
} from './anatomy-link-registry';

/** Same-document adapter contract. No network, patient data, scans or registration. */
export type LinkedSelection = {
  version: 1;
  origin: 'imaging';
  messageId: string;
  structureId: string;
};
export type AtlasSelection = Omit<LinkedSelection, 'origin'> & {
  origin: 'atlas';
  anatomy: AnatomyLinkEntry;
};
export type SelectionResult = {
  messageId: string | null;
  status:
    | SelectionResolution['status']
    | 'invalid'
    | 'duplicate'
    | 'paused'
    | 'no-atlas'
    | 'disconnected'
    | 'adapter-error';
  candidateIds?: string[];
  mapping?: SelectionResolution['mapping'];
};
export type AdapterInfo = {
  id: string;
  label: string;
  modality: 'CT' | 'MRI' | 'X-ray' | 'US' | 'multimodal';
};
type Adapter = AdapterInfo & {
  onAtlasSelection: (selection: AtlasSelection) => void | Promise<void>;
};
type AtlasReceiver = (request: LinkedSelection) => SelectionResult;
const identifier = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9:._-]{1,220}$/.test(v);
export function createAtlasReceiver(
  getState: () => {
    enabled: boolean;
    disabled: boolean;
    entries: AnatomyLinkEntry[];
    allowedIds: string[];
    onSelect: (id: string) => void;
  },
  onResolution: (resolution: SelectionResolution) => void,
): AtlasReceiver {
  return (request) => {
    const state = getState();
    if (!state.enabled || state.disabled)
      return { messageId: request.messageId, status: 'paused' };
    const resolution = resolveLinkedStructure(
      request.structureId,
      state.entries,
      state.allowedIds,
    );
    if (resolution.status === 'selected')
      state.onSelect(resolution.candidates[0].id);
    onResolution(resolution);
    return {
      messageId: request.messageId,
      status: resolution.status,
      mapping: resolution.mapping,
      candidateIds: resolution.candidates.map((c) => c.id),
    };
  };
}
export function parseLinkedSelection(value: unknown): LinkedSelection | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).sort().join(',') !==
      'messageId,origin,structureId,version' ||
    v.version !== 1 ||
    v.origin !== 'imaging' ||
    !identifier(v.messageId) ||
    !identifier(v.structureId) ||
    !v.structureId.startsWith('vm:anatomy:')
  )
    return null;
  return {
    version: 1,
    origin: 'imaging',
    messageId: v.messageId,
    structureId: v.structureId,
  };
}
/** One adapter and one active atlas per bridge avoids ambiguous routing. Create separate bridges for separate viewports. */
export function createImagingBridge() {
  let adapter: Adapter | null = null;
  let receiver: AtlasReceiver | null = null;
  let notifying = false;
  let receiving = false;
  const listeners = new Set<() => void>();
  const seen = new Set<string>();
  const remember = (id: string) => {
    if (seen.has(id)) return false;
    seen.add(id);
    if (seen.size > 256) seen.delete(seen.values().next().value!);
    return true;
  };
  const changed = () => listeners.forEach((listener) => listener());
  return {
    getAdapter: (): AdapterInfo | null =>
      adapter
        ? { id: adapter.id, label: adapter.label, modality: adapter.modality }
        : null,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    attachAtlas(next: AtlasReceiver) {
      if (receiver)
        throw new Error('An atlas is already attached to this imaging bridge');
      receiver = next;
      return () => {
        if (receiver === next) receiver = null;
      };
    },
    registerAdapter(next: Adapter) {
      if (adapter)
        throw new Error('Disconnect the existing imaging adapter first');
      if (
        !identifier(next.id) ||
        typeof next.label !== 'string' ||
        next.label.trim().length < 1 ||
        next.label.length > 80 ||
        !['CT', 'MRI', 'X-ray', 'US', 'multimodal'].includes(next.modality) ||
        typeof next.onAtlasSelection !== 'function'
      )
        throw new Error('Invalid imaging adapter');
      const owned = { ...next };
      adapter = owned;
      seen.clear();
      changed();
      return {
        pause() {
          if (adapter === owned) { seen.clear(); changed(); }
        },
        selectStructure(value: unknown): SelectionResult {
          let request: LinkedSelection | null;
          try {
            request = parseLinkedSelection(value);
          } catch {
            request = null;
          }
          if (!request) return { messageId: null, status: 'invalid' };
          const base = { messageId: request.messageId };
          if (adapter !== owned) return { ...base, status: 'disconnected' };
          // Reject synchronous echoes even if an adapter incorrectly invents a new ID.
          if (notifying || receiving || !remember(request.messageId))
            return { ...base, status: 'duplicate' };
          if (!receiver) return { ...base, status: 'no-atlas' };
          receiving = true;
          try {
            return receiver(request);
          } catch {
            return { ...base, status: 'adapter-error' };
          } finally {
            receiving = false;
          }
        },
        dispose() {
          if (adapter === owned) {
            adapter = null;
            seen.clear();
            changed();
          }
        },
      };
    },
    publish(entry: AnatomyLinkEntry): boolean {
      if (!adapter || notifying || receiving) return false;
      const target = adapter;
      const disconnectFailed = () => {
        if (adapter === target) {
          adapter = null;
          changed();
        }
      };
      const messageId = crypto.randomUUID();
      remember(messageId);
      notifying = true;
      try {
        // Give external code a copy; it cannot mutate the source catalogue.
        const response = target.onAtlasSelection({
          version: 1,
          origin: 'atlas',
          messageId,
          structureId: entry.id,
          anatomy: structuredClone(entry),
        });
        if (response) Promise.resolve(response).catch(disconnectFailed);
        return true;
      } catch {
        // A broken adapter is disconnected, never allowed to break model selection.
        disconnectFailed();
        return false;
      } finally {
        notifying = false;
      }
    },
  };
}
export const imagingBridge = createImagingBridge();
