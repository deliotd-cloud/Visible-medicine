import type { InspectionState } from './inspection-state';

export type StudyCamera = {
  direction: [number, number, number];
  up: [number, number, number];
  pan: [number, number, number];
  scale: number;
};
export type StudyView = {
  kind: 'body' | 'shoulder';
  region: string;
  revision: string;
  selectedId: string | null;
  view: string;
  side: 'both' | 'left' | 'right';
  layer: 'cuff' | 'surface' | 'bones';
  systems: Record<string, boolean>;
  hiddenIds: string[];
  explode: number;
  // Optional for v1 device-local bookmarks saved before tray presentation existed.
  layout?: 'spatial' | 'extract' | 'tray';
  zoom: number;
  isolated: boolean;
  focus: boolean;
  labels: boolean;
  ghostRemoved: boolean;
  illustrated: boolean;
  anchorSkeleton: boolean;
  showOrigins: boolean;
  plate: boolean;
  // Shoulder-only reference illustration; older device-local views omit it.
  // This is not a patient slice, cutaway setting or imaging registration.
  referencePlane?: boolean;
  inspection: InspectionState;
  camera: StudyCamera | null;
};
export type StudyBookmark = {
  id: string;
  name: string;
  savedAt: string;
  state: StudyView;
};
export type StudyScope = {
  kind: StudyView['kind'];
  region: string;
  revision: string;
  structureIds: string[];
};
export const STUDY_STORAGE_KEY = 'visible-medicine:study-views:v1';
export const MAX_STUDY_VIEWS = 20;
const maxBytes = 2_000_000;
const bodySystems = [
  'skeleton',
  'muscles',
  'organs',
  'nerves',
  'vessels',
  'connective',
];
const shoulderSystems = ['skeleton', 'muscles', 'soft-tissue'];
const bodyViews = [
  'anterior',
  'posterior',
  'left',
  'right',
  'superior',
  'inferior',
];
const shoulderViews = ['anterior', 'posterior', 'lateral'];
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const choice = (v: unknown, values: string[]): v is string =>
  typeof v === 'string' && values.includes(v);
const shortText = (v: unknown, max: number): v is string =>
  typeof v === 'string' &&
  v.length > 0 &&
  v.length <= max &&
  !/\p{Cc}/u.test(v);
const anatomyId = (v: unknown): v is string =>
  shortText(v, 220) && /^vm:anatomy:[a-z0-9:-]+$/.test(v);
const vector = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) &&
  v.length === 3 &&
  v.every((n) => finite(n, -10000, 10000));

export function validStudyCamera(value: unknown): value is StudyCamera {
  if (
    !object(value) ||
    !vector(value.direction) ||
    !vector(value.up) ||
    !vector(value.pan) ||
    !finite(value.scale, 0.001, 1000)
  )
    return false;
  const d = value.direction,
    u = value.up;
  const dl = Math.hypot(...d),
    ul = Math.hypot(...u);
  const cross = Math.hypot(
    d[1] * u[2] - d[2] * u[1],
    d[2] * u[0] - d[0] * u[2],
    d[0] * u[1] - d[1] * u[0],
  );
  return dl > 0.99 && dl < 1.01 && ul > 0.99 && ul < 1.01 && cross > 1e-8;
}

/** Strict, bounded display-only input. No URLs, patient coordinates or executable content. */
export function parseStudyView(value: unknown): StudyView | null {
  if (
    !object(value) ||
    !choice(value.kind, ['body', 'shoulder']) ||
    !shortText(value.region, 60) ||
    !/^[a-z-]+$/.test(value.region) ||
    !shortText(value.revision, 16000)
  )
    return null;
  const keys = value.kind === 'body' ? bodySystems : shoulderSystems;
  const views = value.kind === 'body' ? bodyViews : shoulderViews;
  if (
    !choice(value.view, views) ||
    !choice(value.side, ['both', 'left', 'right']) ||
    !choice(value.layer, ['cuff', 'surface', 'bones'])
  )
    return null;
  if (
    value.kind === 'shoulder' &&
    (value.region !== 'shoulder-pilot' || value.side !== 'right')
  )
    return null;
  if (value.selectedId !== null && !anatomyId(value.selectedId)) return null;
  const systems = value.systems;
  if (!object(systems) || keys.some((k) => typeof systems[k] !== 'boolean'))
    return null;
  if (
    !Array.isArray(value.hiddenIds) ||
    value.hiddenIds.length > 2048 ||
    !value.hiddenIds.every(anatomyId) ||
    new Set(value.hiddenIds).size !== value.hiddenIds.length
  )
    return null;
  if (!finite(value.explode, 0, 100) || !finite(value.zoom, 0.1, 10))
    return null;
  if (
    value.layout !== undefined &&
    !choice(value.layout, ['spatial', 'extract', 'tray'])
  )
    return null;
  if (value.layout === 'tray' && value.plate !== true) return null;
  if (
    value.referencePlane !== undefined &&
    (value.kind !== 'shoulder' || typeof value.referencePlane !== 'boolean')
  )
    return null;
  const flags = [
    'isolated',
    'focus',
    'labels',
    'ghostRemoved',
    'illustrated',
    'anchorSkeleton',
    'showOrigins',
    'plate',
  ] as const;
  if (flags.some((k) => typeof value[k] !== 'boolean')) return null;
  const i = value.inspection;
  if (
    !object(i) ||
    !choice(i.plane, ['off', 'axial', 'coronal', 'sagittal']) ||
    !finite(i.position, 0, 100) ||
    typeof i.flipped !== 'boolean' ||
    typeof i.keepSelectedSolid !== 'boolean' ||
    (i.keepSelectedUncut !== undefined &&
      typeof i.keepSelectedUncut !== 'boolean') ||
    !object(i.opacity)
  )
    return null;
  const opacity: Record<string, number> = {};
  for (const key of keys) {
    if (i.opacity[key] !== undefined && !finite(i.opacity[key], 5, 100))
      return null;
    if (typeof i.opacity[key] === 'number') opacity[key] = i.opacity[key];
  }
  if (value.camera !== null && !validStudyCamera(value.camera)) return null;
  // Reconstruct an allowlisted object: never spread arbitrary stored input into state.
  return {
    kind: value.kind as StudyView['kind'],
    region: value.region,
    revision: value.revision,
    selectedId: value.selectedId as string | null,
    view: value.view as string,
    side: value.side as StudyView['side'],
    layer: value.layer as StudyView['layer'],
    systems: Object.fromEntries(keys.map((k) => [k, systems[k] as boolean])),
    hiddenIds: [...value.hiddenIds] as string[],
    explode: value.explode,
    ...(value.layout === undefined
      ? {}
      : { layout: value.layout as StudyView['layout'] }),
    zoom: value.zoom,
    ...(Object.fromEntries(flags.map((k) => [k, value[k]])) as Pick<
      StudyView,
      (typeof flags)[number]
    >),
    ...(value.referencePlane === undefined
      ? {}
      : { referencePlane: value.referencePlane as boolean }),
    inspection: {
      plane: i.plane as InspectionState['plane'],
      position: i.position,
      flipped: i.flipped,
      keepSelectedSolid: i.keepSelectedSolid,
      ...(i.keepSelectedUncut !== undefined
        ? { keepSelectedUncut: i.keepSelectedUncut }
        : {}),
      opacity,
    },
    camera:
      value.camera === null
        ? null
        : {
            direction: [...value.camera.direction],
            up: [...value.camera.up],
            pan: [...value.camera.pan],
            scale: value.camera.scale,
          },
  };
}

export function compatibleStudyView(value: StudyView, scope: StudyScope) {
  const ids = new Set(scope.structureIds);
  return (
    value.kind === scope.kind &&
    value.region === scope.region &&
    value.revision === scope.revision &&
    (value.selectedId === null || ids.has(value.selectedId)) &&
    value.hiddenIds.every((id) => ids.has(id))
  );
}

export function decodeStudyBookmarks(raw: string | null): StudyBookmark[] {
  if (raw === null) return [];
  if (raw.length > maxBytes)
    throw new Error(
      'Saved views exceed the supported size. Existing data was left untouched.',
    );
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new Error(
      'Saved views could not be read. Existing data was left untouched.',
    );
  }
  if (
    !object(input) ||
    input.version !== 1 ||
    !Array.isArray(input.views) ||
    input.views.length > MAX_STUDY_VIEWS
  )
    throw new Error(
      'Saved views use an unsupported format. Existing data was left untouched.',
    );
  const ids = new Set<string>();
  return input.views.map((row: unknown) => {
    if (
      !object(row) ||
      !shortText(row.id, 80) ||
      !/^[a-zA-Z0-9-]+$/.test(row.id) ||
      !shortText(row.name, 64) ||
      !shortText(row.savedAt, 40) ||
      !Number.isFinite(Date.parse(row.savedAt)) ||
      ids.has(row.id)
    )
      throw new Error(
        'A saved view is invalid. Existing data was left untouched.',
      );
    const state = parseStudyView(row.state);
    if (!state)
      throw new Error(
        'A saved view is invalid. Existing data was left untouched.',
      );
    ids.add(row.id);
    return { id: row.id, name: row.name, savedAt: row.savedAt, state };
  });
}

export function encodeStudyBookmarks(views: StudyBookmark[]) {
  const raw = JSON.stringify({ version: 1, views });
  decodeStudyBookmarks(raw);
  return raw;
}

/** A fresh read precedes each edit; views saved by another tab are not replaced by a stale list. */
export function editStudyBookmarks(
  current: StudyBookmark[],
  action:
    | { type: 'save'; bookmark: StudyBookmark }
    | { type: 'remove'; id: string },
) {
  if (action.type === 'remove')
    return current.filter((v) => v.id !== action.id);
  if (current.length >= MAX_STUDY_VIEWS)
    throw new Error(
      `You have ${MAX_STUDY_VIEWS} saved views. Remove one before saving another.`,
    );
  if (current.some((v) => v.id === action.bookmark.id))
    throw new Error('This view already exists. Please try again.');
  const next = [action.bookmark, ...current];
  encodeStudyBookmarks(next);
  return next;
}

export function persistStudyBookmarks(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  action: Parameters<typeof editStudyBookmarks>[1],
) {
  const next = editStudyBookmarks(
    decodeStudyBookmarks(storage.getItem(STUDY_STORAGE_KEY)),
    action,
  );
  storage.setItem(STUDY_STORAGE_KEY, encodeStudyBookmarks(next));
  return next;
}
