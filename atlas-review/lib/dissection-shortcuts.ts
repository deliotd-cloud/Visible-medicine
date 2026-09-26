import type { KeyboardEvent } from 'react';

export type DissectionShortcutState = {
  enabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

export function dissectionShortcut(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat' | 'defaultPrevented'> & { isComposing?: boolean },
  state: DissectionShortcutState,
): 'undo' | 'redo' | null {
  if (!state.enabled || event.defaultPrevented || event.isComposing || event.repeat ||
      event.altKey || event.ctrlKey === event.metaKey) return null;
  const key = event.key.toLowerCase();
  const action = key === 'z' ? (event.shiftKey ? 'redo' : 'undo')
    : key === 'y' && event.ctrlKey && !event.shiftKey ? 'redo' : null;
  return action && (action === 'undo' ? state.canUndo : state.canRedo) ? action : null;
}

/** Local workspace events only. Never consume editor or portalled dialog undo. */
export function handleDissectionHistoryKey(
  event: KeyboardEvent<HTMLElement>,
  state: DissectionShortcutState,
  undo: () => void,
  redo: () => void,
) {
  const target = event.target;
  if (!(target instanceof Element) || !event.currentTarget.contains(target) ||
      target.closest('.body-app') !== event.currentTarget ||
      target.closest('input, textarea, select, [role="textbox"], [role="combobox"], [role="dialog"], [role="alertdialog"], [contenteditable]:not([contenteditable="false"])')) return;
  const action = dissectionShortcut({ key: event.key,
    ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey,
    shiftKey: event.shiftKey, repeat: event.repeat, defaultPrevented: event.defaultPrevented,
    isComposing: event.nativeEvent.isComposing }, state);
  if (!action) return;
  event.preventDefault();
  event.stopPropagation();
  (action === 'undo' ? undo : redo)();
}
