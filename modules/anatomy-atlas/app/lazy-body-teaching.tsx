'use client';
import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {bodyTeachingLoader, type BodyTeachingModule} from '../lib/body-teaching-loader';

// Hidden workspace sections retain their controls without requesting teaching.
export const BodyTeachingVisibility = createContext(true);

export function LazyBodyTeaching({children, enabled = true}: {
  children: (module: BodyTeachingModule) => ReactNode;
  enabled?: boolean;
}) {
  const visible = useContext(BodyTeachingVisibility) && enabled;
  const [module, setModule] = useState(() => bodyTeachingLoader.peek());
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const retryFocus = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!visible) return;
    let current = true;
    setFailed(false);
    bodyTeachingLoader.load().then(value => {
      if (current) setModule(value);
    }, () => {
      if (current) setFailed(true);
    });
    return () => { current = false; };
  }, [visible, attempt]);
  useEffect(() => {
    const origin = retryFocus.current;
    if (!visible || !module || !origin) return;
    retryFocus.current = null;
    const active = origin.ownerDocument.activeElement;
    if (active === origin || active === origin.ownerDocument.body)
      container.current?.focus({preventScroll: true});
  }, [module, visible]);
  if (!visible) return null;
  // The module contains all selections. Derive content from the current render's
  // callback, never store a lesson from an earlier structure, tab or tour step.
  return <div className="atlas-lazy-body-teaching" ref={container} tabIndex={-1}>
  {module ? children(module) : failed ? <div role="alert">
    <p>Teaching notes could not load. You can continue using the model.</p>
    {attempt > 0 && <p>The browser may retain the failed download. Reloading the atlas can retry it, but resets your current unsaved view.</p>}
    <button type="button" onClick={event => {
      retryFocus.current = event.currentTarget.ownerDocument.activeElement === event.currentTarget ? event.currentTarget : null;
      setFailed(false); setAttempt(value => value + 1);
    }}>Retry teaching notes</button>
    {attempt > 0 && <button type="button" onClick={() => window.location.reload()}>Reload atlas</button>}
  </div> : <p role="status" aria-live="polite">Loading teaching notes…</p>}
  </div>;
}
