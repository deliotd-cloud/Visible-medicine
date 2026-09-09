import { eyePresetHidden, type EyeLayer, type EyePreset } from './eye-layers';

type Snapshot = {
  hidden: string[];
  selectedId: string | null;
  preset: EyePreset | 'custom';
};
export type EyeLayerState = Snapshot & { history: Snapshot[] };
export type EyeAction =
  | { type: 'select'; id: string }
  | { type: 'visibility'; id: string; visible: boolean }
  | { type: 'preset'; value: EyePreset }
  | { type: 'undo' };
export function initialEyeLayers(layers: EyeLayer[]): EyeLayerState {
  return {
    hidden: eyePresetHidden(layers, 'anterior'),
    selectedId: layers.find((s) => s.kind === 'iris')?.id ?? null,
    preset: 'anterior',
    history: [],
  };
}
/** Only this side's source-bound IDs are accepted; snapshots never contain history. */
export function reduceEyeLayers(
  layers: EyeLayer[],
  state: EyeLayerState,
  action: EyeAction,
): EyeLayerState {
  if (action.type === 'undo') {
    const previous = state.history.at(-1);
    return previous
      ? { ...previous, history: state.history.slice(0, -1) }
      : state;
  }
  const before: Snapshot = {
    hidden: state.hidden,
    selectedId: state.selectedId,
    preset: state.preset,
  };
  let next: Snapshot = before;
  if (action.type === 'preset') {
    if (!['all', 'anterior', 'lens', 'wall'].includes(action.value))
      return state;
    const hidden = eyePresetHidden(layers, action.value);
    if (hidden.length === layers.length) return state;
    next = {
      hidden,
      selectedId: layers.find((s) => !hidden.includes(s.id))?.id ?? null,
      preset: action.value,
    };
  } else {
    if (!layers.some((s) => s.id === action.id)) return state;
    if (action.type === 'select') {
      next = {
        ...before,
        selectedId: action.id,
        hidden: state.hidden.filter((id) => id !== action.id),
        preset: state.hidden.includes(action.id) ? 'custom' : state.preset,
      };
    } else {
      const hidden = action.visible
        ? state.hidden.filter((id) => id !== action.id)
        : [...new Set([...state.hidden, action.id])];
      next = {
        hidden,
        selectedId: hidden.includes(state.selectedId ?? '')
          ? null
          : state.selectedId,
        preset: 'custom',
      };
    }
  }
  if (
    next.selectedId === before.selectedId &&
    next.preset === before.preset &&
    next.hidden.length === before.hidden.length &&
    next.hidden.every((id) => before.hidden.includes(id))
  )
    return state;
  return { ...next, history: [...state.history, before].slice(-30) };
}
