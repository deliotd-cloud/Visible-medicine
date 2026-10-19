'use client';
import { createContext, useContext, useEffect, useId, useRef, type ReactNode, type HTMLAttributes } from 'react';
import { Dialog as Modal, DialogContent as ModalContent, DialogTitle as ModalTitle, DialogDescription as ModalDescription } from '@/atlas-review/components/ui/dialog';
import { useAtlasWorkspace } from './atlas-workspace';
import './study-surface.css';

const Inline = createContext(false);
const ActiveStudy = createContext(true);
const Surface = createContext({ titleId: '', descriptionId: '', close: () => {} });

/** Change presentation only: specimens retain their own source coordinates and controls. */
export function InlineStudy({ children, active = true }: { children: ReactNode; active?: boolean }) {
  const { setPanelOpen } = useAtlasWorkspace();
  useEffect(() => {
    if (!active) return;
    setPanelOpen(false, false);
    setPanelOpen(true, false);
  }, [setPanelOpen, active]);
  return <Inline.Provider value={true}><ActiveStudy.Provider value={active}>{children}</ActiveStudy.Provider></Inline.Provider>;
}

// Compatible wrappers retain modal presentation for independent, non-Atlas callers.
export function Dialog({ open, onOpenChange, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode;
}) {
  const inline = useContext(Inline), id = useId();
  if (!inline) return <Modal open={open} onOpenChange={onOpenChange}>{children}</Modal>;
  return open ? <Surface.Provider value={{ titleId: `${id}-title`, descriptionId: `${id}-description`, close: () => onOpenChange(false) }}>{children}</Surface.Provider> : null;
}
export function DialogContent({ children, className = '', showCloseButton: _ }: {
  children: ReactNode; className?: string; showCloseButton?: boolean;
}) {
  const inline = useContext(Inline), surface = useContext(Surface);
  const active = useContext(ActiveStudy);
  const node = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!inline || !active) return;
    const root = node.current?.closest('.body-app');
    node.current?.focus({ preventScroll: true });
    return () => {
      requestAnimationFrame(() => {
        // A mobile launcher may have lived in a now-closed drawer. Preserve a
        // valid explicit return target; otherwise land on the active mode.
        if (root?.isConnected && (document.activeElement === document.body || !document.activeElement?.getClientRects().length))
          root.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus({ preventScroll: true });
      });
    };
  }, [inline, active]);
  if (!inline) return <ModalContent className={className} showCloseButton={_}>{children}</ModalContent>;
  return <section ref={node} hidden={!active} tabIndex={-1} role="region" aria-labelledby={surface.titleId}
    aria-describedby={surface.descriptionId} data-slot="dialog-content" data-study-surface="inline"
    className={`atlas-inline-study ${className}`}
    onKeyDown={event => { if (event.key === 'Escape' && !event.defaultPrevented) { event.stopPropagation(); surface.close(); } }}>
    {children}
  </section>;
}
export function DialogTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  const inline = useContext(Inline), surface = useContext(Surface);
  return inline ? <h2 {...props} id={surface.titleId} data-slot="dialog-title" /> : <ModalTitle {...props} />;
}
export function DialogDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  const inline = useContext(Inline), surface = useContext(Surface);
  return inline ? <p {...props} id={surface.descriptionId} data-slot="dialog-description" /> : <ModalDescription {...props} />;
}
