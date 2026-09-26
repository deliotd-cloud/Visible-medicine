'use client';

import { useLayoutEffect, useRef } from 'react';

type PracticePanelPhase = 'question' | 'feedback';

/** Move only the panel's own scroller; focusing must not move the page/model. */
export function revealPracticePanelTarget(
  target: HTMLElement | null,
  phase: PracticePanelPhase,
): boolean {
  if (!target?.isConnected) return false;
  const info = target.closest<HTMLElement>('.body-info');
  if (!info) return false;
  const popup = target.closest<HTMLElement>('.anatomy-controls-popup');
  if (popup?.hasAttribute('data-closed')) return false;
  const scroller = popup ?? info;
  if (phase === 'question') scroller.scrollTop = 0;
  target.focus({ preventScroll: true });
  const bounds = scroller.getBoundingClientRect();
  const targetBounds = target.getBoundingClientRect();
  if (targetBounds.top < bounds.top + 8 || targetBounds.bottom > bounds.bottom - 8)
    scroller.scrollTop += targetBounds.top - bounds.top - 12;
  return true;
}

export function PracticePanelNavigation({
  sessionId,
  index,
  answered,
}: {
  sessionId: number;
  index: number;
  answered: boolean;
}) {
  const marker = useRef<HTMLSpanElement>(null);
  const handled = useRef<string | null>(null);
  useLayoutEffect(() => {
    const phase = answered ? 'feedback' : 'question';
    const key = `${sessionId}:${index}:${phase}`;
    if (handled.current === key) return;
    const info = marker.current?.closest<HTMLElement>('.body-info');
    const target = info?.querySelector<HTMLElement>(`[data-practice-${phase}]`);
    const reveal = () => {
      if (revealPracticePanelTarget(target ?? null, phase)) handled.current = key;
    };
    reveal();
    if (handled.current === key || !target) return;
    const popup = target.closest<HTMLElement>('.anatomy-controls-popup');
    if (!popup?.hasAttribute('data-closed')) return;
    let pendingFrame = 0;
    const observer = new MutationObserver(() => {
      if (!popup.hasAttribute('data-closed')) {
        observer.disconnect();
        // BaseUI first moves focus into the newly opened sheet.
        pendingFrame = requestAnimationFrame(reveal);
      }
    });
    observer.observe(popup, { attributes: true, attributeFilter: ['data-closed'] });
    return () => { observer.disconnect();if(pendingFrame)cancelAnimationFrame(pendingFrame); };
  }, [sessionId, index, answered]);
  return <span ref={marker} hidden aria-hidden="true" />;
}
