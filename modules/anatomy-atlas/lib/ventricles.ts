import raw from '../public/models/bodyparts3d/ventricles/catalog.json';
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export const ventricleCatalog = raw as unknown as BodyCatalog & {
  parent: BodyStructure;
  ventricularIds: string[];
  contextIds: string[];
};
export function ventriclesFor(parent: BodyStructure | null) {
  const binding = ventricleCatalog.parent;
  if (
    !parent ||
    parent.id !== binding.id ||
    parent.fmaId !== binding.fmaId ||
    parent.name !== binding.name ||
    parent.sourceTree !== 'partof' ||
    parent.system !== 'nerves' ||
    parent.category !== 'organ' ||
    parent.laterality !== 'midline' ||
    parent.region !== 'head-neck' ||
    parent.regions.join('|') !== 'head-neck' ||
    parent.bundle !== binding.bundle ||
    parent.nodeName !== binding.nodeName ||
    parent.sources.length !== binding.sources.length ||
    new Set(parent.sources.map((s) => s.file)).size !== parent.sources.length ||
    !binding.sources.every((s) =>
      parent.sources.some((p) => p.file === s.file && p.sha256 === s.sha256),
    )
  )
    return [];
  return ventricleCatalog.structures.filter((s) =>
    ventricleCatalog.ventricularIds.includes(s.id),
  );
}
export const ventricleReference =
  'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p01_index.html';
export const ventricleNotes: Record<string, string> = {
  FMA78450:
    'A cerebrospinal-fluid space in the left hemisphere. Its frontal, temporal and occipital horns extend into the corresponding lobes; these subdivisions remain one selection here.',
  FMA78449:
    'A cerebrospinal-fluid space in the right hemisphere. Its frontal, temporal and occipital horns extend into the corresponding lobes; these subdivisions remain one selection here.',
  FMA78454:
    'A narrow midline cavity between the thalamic and hypothalamic regions. The interventricular foramina connect it to the lateral ventricles; the cerebral aqueduct leads towards the fourth ventricle.',
  FMA78469:
    'A cavity between the cerebellum and the posterior pons and medulla. Its median and lateral outlets communicate with the subarachnoid space. The model does not independently delineate those openings.',
};
export type VentricularSnapshot = {
  selectedId: string | null;
  hidden: string[];
};
export type VentricularState = VentricularSnapshot & {
  history: VentricularSnapshot[];
};
export type VentricularAction =
  | { type: 'select'; id: string }
  | { type: 'visibility'; id: string; visible: boolean }
  | { type: 'preset'; value: string }
  | { type: 'undo' };
export function initialVentricles(layers: BodyStructure[]): VentricularState {
  return { selectedId: layers[0]?.id ?? null, hidden: [], history: [] };
}
export function reduceVentricles(
  layers: BodyStructure[],
  state: VentricularState,
  action: VentricularAction,
  presets: Record<string, string[]> = {
    all: layers.map((s) => s.id),
    lateral: layers.filter((s) => s.laterality !== 'midline').map((s) => s.id),
    midline: layers.filter((s) => s.laterality === 'midline').map((s) => s.id),
  },
): VentricularState {
  if (action.type === 'undo') {
    const previous = state.history.at(-1);
    return previous
      ? { ...previous, history: state.history.slice(0, -1) }
      : state;
  }
  let { selectedId, hidden } = state;
  if (action.type === 'preset') {
    if (!Object.hasOwn(presets, action.value)) return state;
    hidden = layers
      .filter((s) => !presets[action.value].includes(s.id))
      .map((s) => s.id);
    selectedId = layers.find((s) => !hidden.includes(s.id))?.id ?? null;
  } else {
    if (!layers.some((s) => s.id === action.id)) return state;
    if (action.type === 'select') {
      selectedId = action.id;
      hidden = hidden.filter((id) => id !== action.id);
    } else {
      hidden = action.visible
        ? hidden.filter((id) => id !== action.id)
        : [...new Set([...hidden, action.id])];
      if (!action.visible && selectedId === action.id) selectedId = null;
    }
  }
  if (
    selectedId === state.selectedId &&
    hidden.length === state.hidden.length &&
    hidden.every((id, i) => id === state.hidden[i])
  )
    return state;
  return {
    selectedId,
    hidden,
    history: [
      ...state.history.slice(-29),
      { selectedId: state.selectedId, hidden: [...state.hidden] },
    ],
  };
}
