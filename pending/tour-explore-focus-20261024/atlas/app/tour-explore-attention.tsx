'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useAtlasWorkspace } from './atlas-workspace';
import type { BodyCatalog } from './body-types';
import { resolveTourExplore, type TourExploreRequest } from '@/lib/tour-explore';

/** Focus without allowing the browser to scroll the page or the 3D workspace. */
export function revealTourExploreHeading(root: HTMLElement | null, info: HTMLElement | null, heading: HTMLElement | null): boolean {
  if (!root?.isConnected || !info?.isConnected || !heading?.isConnected || document.hidden) return false;
  if (root.closest('[hidden], [inert]') || heading.closest('[hidden], [inert]')) return false;
  if (heading.closest('.body-info') !== info) return false;
  const popup = info.closest<HTMLElement>('.anatomy-controls-popup');
  if (heading.closest('.anatomy-controls-popup') !== popup) return false;
  if (popup && (popup.getAttribute('data-side') !== 'right' || popup.hasAttribute('data-closed'))) return false;
  if (!popup && !root.contains(info)) return false;
  const scroller = popup ?? info;
  heading.focus({ preventScroll: true });
  const bounds = scroller.getBoundingClientRect();
  const targetBounds = heading.getBoundingClientRect();
  if (targetBounds.top < bounds.top + 8 || targetBounds.bottom > bounds.bottom - 8)
    scroller.scrollTop += targetBounds.top - bounds.top - 12;
  return true;
}

export function TourExploreAttention({ request, catalog, region, side, selectedId, guided, exam, inlineStudy, panelMarkerRef }: {
  request: TourExploreRequest | null;
  catalog: BodyCatalog | null;
  region: string;
  side: string;
  selectedId: string | null;
  guided: boolean;
  exam: boolean;
  inlineStudy: boolean;
  panelMarkerRef: RefObject<HTMLSpanElement | null>;
}) {
  const marker = useRef<HTMLSpanElement>(null);
  const finished = useRef<TourExploreRequest | null>(null);
  const current = useRef<{
    request: TourExploreRequest | null; catalog: BodyCatalog | null; region: string; side: string;
    selectedId: string | null; guided: boolean; exam: boolean; inlineStudy: boolean;
    mode: string; focusView: boolean; compactInfo: boolean; showInfo: () => void;
  } | null>(null);
  const workspace = useAtlasWorkspace();
  useLayoutEffect(() => {
    current.current = { request, catalog, region, side, selectedId, guided, exam, inlineStudy,
      mode: workspace.mode, focusView: workspace.focusView,
      compactInfo: Boolean(workspace.panelLayout?.info), showInfo: workspace.showInfo };
    return () => { current.current = null; };
  });
  useEffect(() => {
    if (!request || finished.current === request) return;
    if (document.hidden) {
      finished.current = request;
      return;
    }
    const valid = () => {
      const state = current.current;
      return Boolean(state && state.request === request && state.catalog &&
        state.side === 'both' && state.selectedId === request.selectedId &&
        !state.guided && !state.exam && !state.inlineStudy && state.mode === 'explore' &&
        resolveTourExplore(state.catalog, state.region, request)?.structure.id === request.selectedId);
    };
    if (!valid()) {
      finished.current = request;
      return;
    }
    let frame = 0;
    let cancelled = false;
    let attempts = 0;
    const retire = () => {
      cancelled = true;
      finished.current = request;
      cancelAnimationFrame(frame);
    };
    const onVisibilityChange = () => { if (document.hidden) retire(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', retire);
    const advance = () => {
      if (cancelled || finished.current === request) return;
      if (!valid()) {
        finished.current = request;
        return;
      }
      const root = marker.current?.closest<HTMLElement>('.body-app') ?? null;
      const info = panelMarkerRef.current?.closest<HTMLElement>('.body-info') ?? null;
      const heading = info?.querySelector<HTMLElement>('[data-structure-study-heading]') ?? null;
      if (!root?.isConnected || document.hidden || root.closest('[hidden], [inert]') ||
        (info && !info.isConnected)) {
        finished.current = request;
        return;
      }
      if (heading && !heading.isConnected) {
        finished.current = request;
        return;
      }
      const popup = heading?.closest<HTMLElement>('.anatomy-controls-popup');
      if (heading?.closest('[hidden], [inert]') && !popup) {
        finished.current = request;
        return;
      }
      if (popup?.hasAttribute('data-closed')) current.current?.showInfo();
      else if (!heading && (current.current?.focusView || current.current?.compactInfo)) current.current?.showInfo();
      if (revealTourExploreHeading(root, info, heading)) {
        finished.current = request;
        return;
      }
      if (++attempts < 12) frame = requestAnimationFrame(advance);
      else finished.current = request;
    };
    frame = requestAnimationFrame(advance);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', retire);
    };
  }, [request, catalog, region, side, selectedId, guided, exam, inlineStudy,
    workspace.mode, workspace.showInfo, workspace.focusView, workspace.panelLayout?.info, panelMarkerRef]);
  return <span ref={marker} hidden aria-hidden="true" />;
}
