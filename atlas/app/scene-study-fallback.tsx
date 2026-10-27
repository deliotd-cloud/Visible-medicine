'use client';
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { useAtlasWorkspace } from './atlas-workspace';

export type SceneStudyFocusRequest = {
  kind: 'notes' | 'check';
  selectionKey: string;
  scopeKey: string;
  origin: HTMLElement;
};

/** Uses the existing source selection and notes panels while the canvas is unavailable. */
export function SceneStudyFallback({
  search,
  selectedName,
  selectionKey,
  scopeKey,
  infoAnchor,
  requestRef,
  checkKind,
}: {
  search: ReactNode;
  selectedName?: string | null;
  selectionKey: string | null;
  scopeKey: string;
  infoAnchor: RefObject<HTMLElement | null>;
  requestRef: RefObject<SceneStudyFocusRequest | null>;
  checkKind: 'body' | 'shoulder';
}) {
  const workspace = useAtlasWorkspace();
  const [focusRequest, setFocusRequest] = useState<SceneStudyFocusRequest | null>(null);
  const latest = useRef({ selectionKey, scopeKey, exam: workspace.exam });
  latest.current = { selectionKey, scopeKey, exam: workspace.exam };

  useLayoutEffect(() => {
    const request = focusRequest ?? requestRef.current;
    if (!request) return;
    if (workspace.exam) {
      requestRef.current = null;
      setFocusRequest(null);
      return;
    }
    if (!workspace.panels.info) return;
    if (request.selectionKey !== selectionKey || request.scopeKey !== scopeKey) {
      requestRef.current = null;
      setFocusRequest(null);
      return;
    }
    const anchor = infoAnchor.current;
    const root = anchor?.closest<HTMLElement>('.body-info');
    if (!root?.isConnected) return;
    const isSheet = !!root.closest('.anatomy-controls-popup');
    const document = root.ownerDocument;
    const ownsFocus = () => document.activeElement === request.origin ||
      (!request.origin.isConnected && document.activeElement === document.body);
    const valid = () => !latest.current.exam &&
      latest.current.selectionKey === request.selectionKey &&
      latest.current.scopeKey === request.scopeKey && root.isConnected;
    const finish = () => {
      requestRef.current = null;
      setFocusRequest(null);
    };
    const focus = (target: HTMLElement | null | undefined) => {
      if (!target || !valid() || document.hidden || isSheet || !ownsFocus()) return false;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      finish();
      return true;
    };
    if (request.kind === 'notes') {
      const heading = Array.from(root.querySelectorAll<HTMLElement>('[data-structure-study-heading]'))
        .find(node => node.dataset.studySelectionId === selectionKey) ??
        Array.from(root.querySelectorAll<HTMLElement>('.info-head[data-study-selection-id]'))
          .find(node => node.dataset.studySelectionId === selectionKey)
          ?.querySelector<HTMLElement>('h1, h2');
      if (heading?.textContent?.trim() === selectedName) focus(heading);
      if (isSheet || !ownsFocus()) finish();
      return;
    }
    const checkOwner = Array.from(root.querySelectorAll<HTMLElement>('[data-study-check-id]'))
      .find(node => node.dataset.studyCheckId === selectionKey);
    if (!checkOwner) return;
    const details = checkKind === 'body'
      ? checkOwner.querySelector<HTMLDetailsElement>('.atlas-quiz-notes') : null;
    if (details) details.open = true;
    if (isSheet) finish();
    const question = () => checkOwner.querySelector<HTMLElement>('.structure-quick-check');
    if (question()) {
      focus(question());
      if (!ownsFocus()) finish();
      return;
    }
    if (!details || isSheet) return;
    // Body question content is lazy; watch only this selected check until it appears.
    const observer = new MutationObserver(() => {
      if (!valid() || !ownsFocus()) {
        finish();
        observer.disconnect();
        return;
      }
      const target = question();
      if (target) {
        focus(target);
        observer.disconnect();
      } else if (checkOwner.querySelector('.atlas-lazy-body-teaching p:not([role="status"])')) {
        focus(details.querySelector('summary'));
        observer.disconnect();
      }
    });
    observer.observe(checkOwner, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [focusRequest, workspace.exam, workspace.panels.info, workspace.mode,
      selectionKey, scopeKey, infoAnchor, requestRef, checkKind, selectedName]);

  if (workspace.exam) return null;
  const open = (kind: SceneStudyFocusRequest['kind'], origin: HTMLElement) => {
    if (workspace.exam || !selectionKey || !selectedName) return;
    const request = { kind, selectionKey, scopeKey, origin };
    requestRef.current = request;
    setFocusRequest(request);
    if (kind === 'notes' && workspace.mode === 'practice') workspace.chooseMode('explore');
    if (kind === 'check') workspace.chooseMode('practice');
    workspace.showInfo();
  };
  return (
    <div className="vm-scene-study-fallback" aria-label="Written structure study">
      <strong>Continue learning</strong>
      <span>Find a structure to read its notes or try a written question.</span>
      <div className="vm-scene-study-actions">
        {search}
        <Button type="button" variant="outline" disabled={!selectionKey}
          onClick={event => open('notes', event.currentTarget)}>
          {selectedName ? `Notes: ${selectedName}` : 'Select a structure for notes'}
        </Button>
        <Button type="button" variant="outline" disabled={!selectionKey}
          onClick={event => open('check', event.currentTarget)}>
          Written structure check
        </Button>
      </div>
      <small>3D identification resumes when the view is restored.</small>
    </div>
  );
}
