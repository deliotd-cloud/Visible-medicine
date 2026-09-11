import type { AnatomyLinkEntry } from './anatomy-link-registry';
import { createImagingBridge } from './imaging-sync';
import {
  comparisonAvailability,
  createComparisonBridge,
  type ComparisonFrame,
  type ImagePlane,
} from './imaging-comparison';
import {
  createResliceGrid,
  prepareVolume,
  validateWindow,
  type ImageWindow,
  type PreparedVolume,
  type ResliceGrid,
  type ScalarVolume,
  type Vec3,
} from './volume-reslice';

type Identity = Pick<AnatomyLinkEntry, 'id' | 'sources'>;
const copyWindow = (value: ImageWindow): ImageWindow =>
  Object.freeze({
    center: value.center,
    width: value.width,
    function: value.function,
    inverted: value.inverted,
  });
export type VolumeResolution =
  | { status: 'unmapped' | 'access-denied' }
  | {
      status: 'ready';
      /** Opaque non-patient identifiers. The host authorizes this exact revision before resolving. */
      resourceId: string;
      resourceRevision: string;
      anatomy: Identity;
      volume: ScalarVolume;
      window: ImageWindow;
      /** Reviewed image-space teaching location, never inferred from generic atlas geometry. */
      focusLps?: Vec3;
    };
export type VolumeView = {
  volume: PreparedVolume;
  grid: ResliceGrid;
  slice: number;
  window: ImageWindow;
  setWindow: (value: ImageWindow) => boolean;
};
export type VolumeComparisonOptions = {
  id: string;
  label: string;
  modality: 'CT' | 'MRI';
  imaging: ReturnType<typeof createImagingBridge>;
  comparison: ReturnType<typeof createComparisonBridge>;
  /** Trusted host: enforce server authorization, privacy, release and exact crosswalk review BEFORE returning pixels. */
  resolve: (
    anatomy: AnatomyLinkEntry,
    signal: AbortSignal,
  ) => Promise<VolumeResolution>;
  mount: (element: HTMLElement, view: VolumeView) => () => void;
};

/** Opt-in decoded-volume integration. No network importer, image upload, persistence or registration. */
export function connectVolumeComparison(options: VolumeComparisonOptions) {
  let generation = 0,
    revision = 0,
    disposed = false,
    revoked = false;
  let abort: AbortController | null = null;
  let current: {
    volume: PreparedVolume;
    grids: Record<ImagePlane, ResliceGrid>;
    anatomy: Identity;
    focus: Vec3;
    window: ImageWindow;
  } | null = null;
  let frame: ComparisonFrame = {
    revision,
    status: 'unmapped',
    anatomy: null,
    plane: 'axial',
    slice: 0,
    sliceCount: 1,
  };
  const mounts = new Set<() => void>();
  const clearMounts = () => {
    const previous = [...mounts];
    mounts.clear();
    previous.forEach((dispose) => dispose());
  };
  const publish = (
    status: ComparisonFrame['status'],
    plane: ImagePlane = 'axial',
    slice = 0,
  ) => {
    clearMounts(); // Clear pixels immediately, without waiting for React's next effect.
    // The bridge can advance its revision when a renderer/control fails.
    revision = Math.max(
      revision,
      options.comparison.getSnapshot()?.frame.revision ?? revision,
    );
    frame = {
      revision: ++revision,
      status,
      anatomy: status === 'ready' ? current!.anatomy : null,
      plane,
      slice,
      sliceCount: status === 'ready' ? current!.grids[plane].sliceCount : 1,
    };
    if (!comparison.update(frame))
      throw new Error('Comparison ownership or revision lost');
  };
  const move = (plane: ImagePlane, slice?: number) => {
    if (!current || disposed) return;
    const grid = current.grids[plane];
    const next = slice ?? grid.sliceForPoint(current.focus);
    const location = grid.point(0, 0, next);
    const distance = grid.normal.reduce<number>(
      (sum, n, axis) => sum + n * (location[axis] - current!.focus[axis]),
      0,
    );
    current.focus = current.focus.map(
      (p, axis) => p + grid.normal[axis] * distance,
    ) as unknown as Vec3;
    publish('ready', plane, next);
  };
  const comparison = options.comparison.register(
    {
      id: options.id,
      label: options.label,
      modality: options.modality,
      onPlane: (plane) => move(plane),
      onSlice: (slice) => move(frame.plane, slice),
      mount: (element, requested) => {
        if (!current || disposed || requested.revision !== frame.revision)
          return () => {};
        const owner = current;
        let active = true;
        let inner: () => void;
        try {
          inner = options.mount(element, {
            volume: owner.volume,
            grid: owner.grids[frame.plane],
            slice: frame.slice,
            window: { ...owner.window },
            setWindow(value) {
              if (!active || current !== owner || disposed) return false;
              validateWindow(value);
              owner.window = copyWindow(value);
              return true;
            },
          });
        } catch (error) {
          active = false;
          element.replaceChildren();
          throw error;
        }
        if (typeof inner !== 'function') {
          element.replaceChildren();
          throw new Error('Volume renderer must return cleanup');
        }
        const cleanup = () => {
          if (!active) return;
          active = false;
          mounts.delete(safeCleanup);
          try {
            inner();
          } finally {
            element.replaceChildren();
          }
        };
        const safeCleanup = () => {
          try {
            cleanup();
          } catch {
            /* Never retain stale pixels because renderer cleanup failed. */
          }
        };
        mounts.add(safeCleanup);
        return () => {
          mounts.delete(safeCleanup);
          safeCleanup();
        };
      },
    },
    frame,
  );
  const invalidate = (
    status: 'unmapped' | 'access-denied' | 'loading' | 'error',
  ) => {
    generation++;
    abort?.abort();
    abort = null;
    current = null;
    publish(status);
  };
  let imaging: ReturnType<
    VolumeComparisonOptions['imaging']['registerAdapter']
  >;
  try {
    imaging = options.imaging.registerAdapter({
      id: options.id,
      label: options.label,
      modality: options.modality,
      async onAtlasSelection(selection) {
        if (revoked) {
          invalidate('access-denied');
          return;
        }
        invalidate('loading');
        const request = generation;
        const controller = new AbortController();
        abort = controller;
        try {
          const result = await options.resolve(
            selection.anatomy,
            controller.signal,
          );
          if (disposed || request !== generation || controller.signal.aborted)
            return;
          if (
            result.status === 'access-denied' ||
            result.status === 'unmapped'
          ) {
            publish(result.status);
            return;
          }
          if (
            result.status !== 'ready' ||
            ![result.resourceId, result.resourceRevision].every(
              (v) =>
                typeof v === 'string' && /^[A-Za-z0-9:._-]{1,220}$/.test(v),
            )
          )
            throw new Error('Invalid volume revision');
          const proposed = {
            adapterId: options.id,
            label: options.label,
            modality: options.modality,
            frame: {
              ...frame,
              status: 'ready' as const,
              anatomy: result.anatomy,
            },
          };
          if (
            comparisonAvailability(
              proposed,
              selection.anatomy,
              options.id,
              true,
              false,
            ) !== 'ready'
          ) {
            publish('unmapped');
            return;
          }
          validateWindow(result.window);
          if (
            (options.modality === 'CT' && result.volume.units !== 'HU') ||
            (options.modality === 'MRI' && result.volume.units !== 'relative')
          )
            throw new Error('Unexpected scalar units');
          const volume = prepareVolume(result.volume);
          const focus =
            result.focusLps ??
            volume.indexToLps(
              volume.dimensions.map((n) => (n - 1) / 2) as unknown as Vec3,
            );
          if (
            !Array.isArray(focus) ||
            focus.length !== 3 ||
            !focus.every(Number.isFinite) ||
            volume
              .lpsToIndex(focus)
              .some((n, axis) => n < -0.5 || n >= volume.dimensions[axis] - 0.5)
          )
            throw new Error('Teaching location outside volume');
          current = {
            volume,
            anatomy: {
              id: selection.anatomy.id,
              sources: structuredClone(selection.anatomy.sources),
            },
            grids: {
              axial: createResliceGrid(volume, 'axial'),
              coronal: createResliceGrid(volume, 'coronal'),
              sagittal: createResliceGrid(volume, 'sagittal'),
            },
            focus: [...focus] as unknown as Vec3,
            window: copyWindow(result.window),
          };
          move('axial');
        } catch {
          if (!disposed && request === generation) {
            current = null;
            publish('error');
          }
        } finally {
          if (abort === controller) abort = null;
        }
      },
    });
  } catch (error) {
    comparison.dispose();
    throw error;
  }
  return {
    /** Host MUST call synchronously on logout, entitlement expiry or image release withdrawal. */
    revoke() {
      if (!disposed) {
        revoked = true;
        invalidate('access-denied');
      }
    },
    /** Clears the selected series and invalidates every outstanding loader result. */
    clear() {
      if (!disposed) invalidate(revoked ? 'access-denied' : 'unmapped');
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      abort?.abort();
      abort = null;
      current = null;
      clearMounts();
      comparison.dispose();
      imaging.dispose();
    },
  };
}
