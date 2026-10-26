'use client';

import {useEffect, useRef, useState} from 'react';
import {createAtlasDocumentAttempt, type AtlasDocumentPhase} from './atlas-runtime-state';
import {createAtlasRuntimeExpansion, type AtlasExpansionState} from './atlas-runtime-expansion';
import './atlas-runtime-frame.css';
import {AtlasBodyLearning} from './AtlasBodyLearning';

// The bundled generic body runtime serves every region through this path. A relative
// source keeps the host's copy of the guide from describing an external frame.
const hasBundledKeyboardGuide = (src: string) =>
  /^\/atlas-runtime\/head-neck\/index\.html(?:\?[^\s#]*)?$/.test(src);

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
  const expandButton = useRef<HTMLButtonElement>(null);
  const help = useRef<HTMLDetailsElement>(null);
  const expansion = useRef<ReturnType<typeof createAtlasRuntimeExpansion> | null>(null);
  const [expandState,setExpandState] = useState<AtlasExpansionState>({active:false,pending:false,message:null});
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
    const owner=container.current;
    if(!allowFullScreen||!owner)return;
    let wasOwned=document.fullscreenElement===owner;
    const controller=createAtlasRuntimeExpansion({owner,doc:document,frame:frame.current,change:next=>{
      if(wasOwned&&!next.active&&!document.fullscreenElement){
        queueMicrotask(()=>{
          // Escape may return focus to the page body. Never displace a user's
          // intervening focus choice or focus a retired source's control.
          if(expansion.current===controller&&document.activeElement===document.body&&
            expandButton.current?.isConnected)expandButton.current.focus({preventScroll:true});
        });
      }
      wasOwned=next.active;
      setExpandState(next);
    }});
    expansion.current=controller;
    return()=>{
      if(expansion.current===controller)expansion.current=null;
      controller.retire();
    };
  },[allowFullScreen]);

  useEffect(() => {
    // Retry removes its focused button. Restore focus only if it fell to the
    // page body; a user's intervening focus move takes precedence.
    if (restoreFocus && document.activeElement === document.body) {
      container.current?.focus({preventScroll: true});
    }
  }, [restoreFocus]);

  const onLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (event.currentTarget !== frame.current) return;
    expansion.current?.refreshFrame(event.currentTarget);
    if (gate.current) confirmCurrentDocument(gate.current, event.currentTarget);
  };
  const onError = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (event.currentTarget === frame.current) gate.current?.failed();
  };
  const unresolved = phase === 'delayed' || phase === 'error';
  const onHelpKeyDown = (event: React.KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== 'Escape' || !help.current?.open) return;
    event.preventDefault();
    event.stopPropagation();
    help.current.open = false;
    help.current.querySelector('summary')?.focus({preventScroll: true});
  };
  const onHelpBlur = (event: React.FocusEvent<HTMLDetailsElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      event.currentTarget.open = false;
    }
  };
  const recoveryActions = <span className="atlas-runtime-actions">
    <button type="button" onClick={event => onRetry(document.activeElement === event.currentTarget)}>Retry opening</button>
    <a href={src} target="_blank" rel="noopener noreferrer">Open this source full screen ↗</a>
  </span>;
  return <div ref={container} className="atlas-runtime-frame" data-keyboard-guide={hasBundledKeyboardGuide(src) ? '' : undefined} role="region" aria-label={`${title} viewer`} tabIndex={-1}>
    <iframe ref={frame} className={className} src={src} title={title} referrerPolicy={referrerPolicy}
      allowFullScreen={allowFullScreen} onLoad={onLoad} onError={onError}/>
    <AtlasBodyLearning frame={frame} src={src}/>
    <div className={`atlas-runtime-status${phase === 'document' ? ' atlas-runtime-status-confirmed' : ''}`}
      role="status" aria-live="polite" aria-atomic="true">
      {phase === 'opening' && <span>Opening the 3D Atlas…</span>}
      {phase === 'document' && <span>Frame navigation finished. Atlas loading and 3D model display are not confirmed.</span>}
      {phase === 'delayed' && <span>The Atlas is taking longer than expected to open.</span>}
      {phase === 'error' && <span>The Atlas could not be opened.</span>}
      {unresolved && recoveryActions}
    </div>
    <div className="atlas-runtime-host-tools">
      {allowFullScreen&&<button ref={expandButton} className="atlas-runtime-expand" type="button"
        aria-pressed={expandState.active} disabled={expandState.pending}
        onClick={()=>expandState.active?expansion.current?.exit():expansion.current?.request()}>
        {expandState.active?'Restore viewer':'Expand viewer'}
      </button>}
      {phase === 'document' && <details ref={help} className="atlas-runtime-help"
        onKeyDown={onHelpKeyDown} onBlur={onHelpBlur}>
        <summary aria-label="Viewer help">Help</summary>
        <p>Blank, incomplete or showing an error? Retry the same source or open it in a new tab. Retrying resets the viewer's current view. Expand viewer keeps this 3D session in this tab; native Focus view only hides side panels.</p>
        {recoveryActions}
        {hasBundledKeyboardGuide(src) && <div className="atlas-runtime-keyboard-guide">
          <p><strong>Keyboard controls</strong></p>
          <p>Tab to the model canvas first. With the canvas focused and its controls enabled, arrow keys rotate the 3D view or pan a planar tray; hold Shift for finer movement. + or = zooms in; − zooms out. Tab moves to the next control.</p>
          <p>In the enabled Dissect workspace, Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z or Ctrl+Y redoes when available. These shortcuts do not capture typing in editors or dialogs. Controls can be unavailable while loading or locked.</p>
        </div>}
      </details>}
      {expandState.message&&<p className="atlas-runtime-expand-message" role="status" aria-live="polite">{expandState.message}</p>}
    </div>
  </div>;
}
