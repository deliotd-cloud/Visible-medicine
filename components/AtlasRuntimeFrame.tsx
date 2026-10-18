'use client';

import {useEffect, useRef, useState} from 'react';
import {createAtlasDocumentAttempt, type AtlasDocumentPhase} from './atlas-runtime-state';
import './atlas-runtime-frame.css';

export function AtlasRuntimeFrame({src, title, className = 'shoulder-module-frame', referrerPolicy = 'same-origin', allowFullScreen = true}: {
  src: string;
  title: string;
  className?: string;
  referrerPolicy?: React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy'];
  allowFullScreen?: boolean;
}) {
  return <AtlasRuntimeSource key={src} src={src} title={title} className={className}
    referrerPolicy={referrerPolicy} allowFullScreen={allowFullScreen}/>;
}

function AtlasRuntimeSource({src, title, className, referrerPolicy, allowFullScreen}: {
  src: string;
  title: string;
  className: string;
  referrerPolicy: React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy'];
  allowFullScreen: boolean;
}) {
  const [retry, setRetry] = useState({attempt: 0, restoreFocus: false});
  return <AtlasRuntimeAttempt key={retry.attempt} src={src} title={title} className={className}
    referrerPolicy={referrerPolicy} allowFullScreen={allowFullScreen} restoreFocus={retry.restoreFocus}
    onRetry={restoreFocus => setRetry(previous => ({attempt: previous.attempt + 1, restoreFocus}))}/>;
}

function AtlasRuntimeAttempt({src, title, className, referrerPolicy, allowFullScreen, restoreFocus, onRetry}: {
  src: string;
  title: string;
  className: string;
  referrerPolicy: React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy'];
  allowFullScreen: boolean;
  restoreFocus: boolean;
  onRetry: (restoreFocus: boolean) => void;
}) {
  const [phase, setPhase] = useState<AtlasDocumentPhase>('opening');
  const container = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const gate = useRef<ReturnType<typeof createAtlasDocumentAttempt> | null>(null);
  const confirmCurrentDocument = (attempt: ReturnType<typeof createAtlasDocumentAttempt>, element: HTMLIFrameElement | null) => {
    if (!element) return;
    try {
      // A load event can precede the effect, including during StrictMode replay.
      // This confirms only navigation: HTTP error pages can have this exact URL
      // and ready state too. Keep manual recovery available after navigation.
      if (element.contentDocument?.readyState === 'complete') {
        attempt.loaded(element.contentWindow?.location.href ?? '');
      }
    } catch { /* Inaccessible or wrong-origin frames remain unconfirmed. */ }
  };
  useEffect(() => {
    const attempt = createAtlasDocumentAttempt({
      source: src,
      baseHref: window.location.href,
      report: setPhase,
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancel: handle => window.clearTimeout(handle),
    });
    gate.current = attempt;
    confirmCurrentDocument(attempt, frame.current);
    return () => {
      attempt.retire();
      if (gate.current === attempt) gate.current = null;
    };
  }, [src]);

  useEffect(() => {
    // Retry removes its focused button. Restore focus only if it fell to the
    // page body; a user's intervening focus move takes precedence.
    if (restoreFocus && document.activeElement === document.body) {
      container.current?.focus({preventScroll: true});
    }
  }, [restoreFocus]);

  const onLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (event.currentTarget !== frame.current) return;
    if (gate.current) confirmCurrentDocument(gate.current, event.currentTarget);
  };
  const onError = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (event.currentTarget === frame.current) gate.current?.failed();
  };
  const unresolved = phase === 'delayed' || phase === 'error';
  const recoveryActions = <span className="atlas-runtime-actions">
    <button type="button" onClick={event => onRetry(document.activeElement === event.currentTarget)}>Retry opening</button>
    <a href={src} target="_blank" rel="noopener noreferrer">Open this source full screen ↗</a>
  </span>;
  return <div ref={container} className="atlas-runtime-frame" role="region" aria-label={`${title} viewer`} tabIndex={-1}>
    <iframe ref={frame} className={className} src={src} title={title} referrerPolicy={referrerPolicy}
      allowFullScreen={allowFullScreen} onLoad={onLoad} onError={onError}/>
    <div className={`atlas-runtime-status${phase === 'document' ? ' atlas-runtime-status-confirmed' : ''}`}
      role="status" aria-live="polite" aria-atomic="true">
      {phase === 'opening' && <span>Opening the 3D Atlas…</span>}
      {phase === 'document' && <span>Frame navigation finished. Atlas loading and 3D model display are not confirmed.</span>}
      {phase === 'delayed' && <span>The Atlas is taking longer than expected to open.</span>}
      {phase === 'error' && <span>The Atlas could not be opened.</span>}
      {unresolved && recoveryActions}
    </div>
    {phase === 'document' && <details className="atlas-runtime-help">
      <summary>Viewer help</summary>
      <p>Blank, incomplete or showing an error? Retry the same source or open it full screen. Retrying resets the viewer's current view.</p>
      {recoveryActions}
    </details>}
  </div>;
}
