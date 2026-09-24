'use client';

import { useLayoutEffect, useRef } from 'react';

/** Reveal feedback inside the open panel without moving the model or focus. */
export function revealRemovalNotice(target: HTMLElement | null) {
  if (!target?.isConnected) return;
  const info = target.closest<HTMLElement>('.body-info');
  if (!info) return;
  const popup = target.closest<HTMLElement>('.anatomy-controls-popup');
  if (popup?.hasAttribute('data-closed')) return;
  const scroller = popup ?? info;
  const bounds = scroller.getBoundingClientRect();
  const noticeBounds = target.getBoundingClientRect();
  if (noticeBounds.top < bounds.top + 8 || noticeBounds.bottom > bounds.bottom - 8)
    scroller.scrollTop += noticeBounds.top - bounds.top - 12;
}

export function BodySelectionNotice({ message, removed, onUndo, mode }: {
  message: string;
  removed: { id: string; name: string } | null;
  onUndo: () => void;
  mode: 'explore' | 'dissect';
}) {
  const notice = useRef<HTMLDivElement>(null);
  const removedId = removed?.id;
  useLayoutEffect(() => {
    if (removedId) revealRemovalNotice(notice.current);
  }, [removedId]);
  return (
    <div className="body-selection-notice" ref={notice} tabIndex={-1}>
      <output aria-live="polite" aria-atomic="true">
        {message}
        {removed && ` ${removed.name} ${mode === 'explore' ? 'hidden' : 'removed'}.`}
      </output>
      {removed && (
        <button
          type="button"
          className="body-selection-undo"
          aria-label={`${mode === 'explore' ? 'Undo hiding' : 'Undo removal of'} ${removed.name}`}
          onClick={() => {
            // The button may disappear after Undo; retain keyboard focus here.
            notice.current?.focus({ preventScroll: true });
            onUndo();
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}
