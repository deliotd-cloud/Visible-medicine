'use client';
import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {bodyTeachingLoader, type BodyTeachingModule} from '../lib/body-teaching-loader';
import {sourceCanonical} from '../lib/body-source-additions';
import type {BodyStructure} from './body-types';

// Hidden workspace sections retain their controls without requesting teaching.
export const BodyTeachingVisibility = createContext(true);

export function LazyBodyTeaching({structure, children, enabled = true}: {
  structure: BodyStructure;
  children: (module: BodyTeachingModule) => ReactNode;
  enabled?: boolean;
}) {
  const visible = useContext(BodyTeachingVisibility) && enabled;
  const identity = sourceCanonical(structure);
  const [loaded, setModule] = useState(() => bodyTeachingLoader.peek(structure));
  const module = loaded?.accepts(structure) ? loaded : bodyTeachingLoader.peek(structure);
  const [failedIdentity, setFailed] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const retryFocus = useRef<{element: HTMLButtonElement; identity: string} | null>(null);
  useEffect(() => {
    if (!visible) return;
    let current = true;
    setFailed(undefined);
    bodyTeachingLoader.load(structure).then(value => {
      if (current) setModule(value);
    }, () => {
      if (current) setFailed(identity);
    });
    return () => { current = false; };
  }, [visible, identity, attempt]);
  useEffect(() => {
    const retry = retryFocus.current;
    if (retry && retry.identity !== identity) retryFocus.current = null;
    if (!visible || !module || !retry || retry.identity !== identity) return;
    retryFocus.current = null;
    const origin = retry.element;
    const active = origin.ownerDocument.activeElement;
    if (active === origin || active === origin.ownerDocument.body)
      container.current?.focus({preventScroll: true});
  }, [module, visible, identity]);
  if (!visible) return null;
  // Guard before children, including the render before effects run. Never show
  // a previous region's reader. Derive from the current callback, not a stored
  // lesson from an earlier structure, tab or tour step.
  return <div className="atlas-lazy-body-teaching" ref={container} tabIndex={-1}>
  {module ? children(module) : failedIdentity === identity ? <div role="alert">
    <p>Teaching notes could not load. You can continue using the model.</p>
    {attempt > 0 && <p>The browser may retain the failed download. Reloading the atlas can retry it, but resets your current unsaved view.</p>}
    <button type="button" onClick={event => {
      retryFocus.current = event.currentTarget.ownerDocument.activeElement === event.currentTarget ? {element:event.currentTarget, identity} : null;
      setFailed(undefined); setAttempt(value => value + 1);
    }}>Retry teaching notes</button>
    {attempt > 0 && <button type="button" onClick={() => window.location.reload()}>Reload atlas</button>}
  </div> : <p role="status" aria-live="polite">Loading teaching notes…</p>}
  </div>;
}
