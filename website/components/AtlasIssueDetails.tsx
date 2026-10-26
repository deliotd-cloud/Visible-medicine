'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import {
  formatAtlasIssueDetails,
  sameAtlasIssueContext,
  UNCONFIRMED_CONTEXT,
  validateAtlasIssueContext,
  type AtlasIssueContext,
} from '../lib/atlas-issue-context';
import './atlas-issue-details.css';

export type AtlasIssueDetailsProps = Readonly<{
  readContext: () => AtlasIssueContext | null;
  className?: string;
}>;

/** Caller supplies catalog-validated, current-frame context; this component never transmits it. */
export function AtlasIssueDetails({ readContext, className }: AtlasIssueDetailsProps) {
  const manualCopyId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const snapshotRef = useRef<AtlasIssueContext | null>(null);
  const generationRef = useRef(0);
  const mountedRef = useRef(false);
  const previousReaderRef = useRef(readContext);
  const latestReaderRef = useRef(readContext);
  const [snapshot, setSnapshot] = useState<AtlasIssueContext | null>(null);
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual' | 'stale'>('idle');

  const clear = useCallback((nextStatus: 'idle' | 'stale' = 'idle') => {
    generationRef.current++;
    snapshotRef.current = null;
    setSnapshot(null);
    setStatus(nextStatus);
  }, []);

  const readSafe = useCallback(() => {
    try { return validateAtlasIssueContext(latestReaderRef.current()); }
    catch { return null; }
  }, []);

  const confirmCurrent = useCallback(() => {
    const current = readSafe();
    if (!sameAtlasIssueContext(snapshotRef.current, current)) {
      clear('stale');
      return null;
    }
    return current;
  }, [clear, readSafe]);

  useEffect(() => {
    mountedRef.current = true;
    const onPageHide = () => { clear(); if (detailsRef.current) detailsRef.current.open = false; };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      mountedRef.current = false;
      generationRef.current++;
      snapshotRef.current = null;
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [clear]);

  useLayoutEffect(() => {
    latestReaderRef.current = readContext;
    if (previousReaderRef.current !== readContext) {
      previousReaderRef.current = readContext;
      clear('stale');
      if (detailsRef.current) detailsRef.current.open = false;
    }
  }, [readContext, clear]);

  useEffect(() => {
    if (!snapshot) return;
    const timer = window.setInterval(() => { confirmCurrent(); }, 300);
    return () => window.clearInterval(timer);
  }, [snapshot, confirmCurrent]);

  const onToggle = () => {
    if (!detailsRef.current?.open) { clear(); return; }
    const current = readSafe();
    generationRef.current++;
    snapshotRef.current = current;
    setSnapshot(current);
    setStatus(current ? 'idle' : 'stale');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing || !event.currentTarget.open) return;
    if ((event.target as Element | null)?.closest?.('details') !== event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.open = false;
    clear();
    event.currentTarget.querySelector<HTMLElement>(':scope > summary')?.focus({ preventScroll: true });
  };

  const copy = async () => {
    const current = confirmCurrent();
    if (!current) return;
    const text = formatAtlasIssueDetails(current);
    if (!text) { clear('stale'); return; }
    const generation = generationRef.current;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (!mountedRef.current || generation !== generationRef.current || !confirmCurrent()) return;
      setStatus('copied');
    } catch {
      if (!mountedRef.current || generation !== generationRef.current || !confirmCurrent()) return;
      setStatus('manual');
    }
  };

  const selectDetails = () => {
    if (!confirmCurrent()) return;
    textRef.current?.focus();
    if (!confirmCurrent()) return;
    textRef.current?.select();
  };

  const onManualCopy = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const current = confirmCurrent();
    const freshText = current && formatAtlasIssueDetails(current);
    if (!freshText) return;
    event.clipboardData?.setData('text/plain', freshText);
  };

  const text = snapshot ? formatAtlasIssueDetails(snapshot) : null;
  return (
    <details ref={detailsRef} className={['atlas-issue-details', className].filter(Boolean).join(' ')} onToggle={onToggle} onKeyDown={onKeyDown}>
      <summary>Report a problem</summary>
      <div className="atlas-issue-details__body">
        <p>Copy these details and add what happened when you contact Visible Medicine. Nothing is sent automatically. Do not include patient information.</p>
        {text ? <>
          <dl>
            <div><dt>Atlas</dt><dd>{snapshot!.atlas}</dd></div>
            <div><dt>Region</dt><dd>{snapshot!.region}</dd></div>
            <div><dt>Source revision</dt><dd>{snapshot!.sourceRevision}</dd></div>
            {snapshot!.structure && <div><dt>Structure</dt><dd>{snapshot!.structure.label} ({snapshot!.structure.id})</dd></div>}
          </dl>
          <p className="atlas-issue-details__prompt">When contacting Visible Medicine, add what happened and what you expected.</p>
          <button type="button" onClick={copy}>Copy details</button>
          {status === 'copied' && <p role="status">Details copied. Check the current selection before using them.</p>}
          {status === 'manual' && <>
            <label htmlFor={manualCopyId}>Clipboard unavailable. Select and copy these details manually.</label>
            <button type="button" onClick={selectDetails}>Select details</button>
            <textarea id={manualCopyId} ref={textRef} readOnly value={text}
              onFocus={confirmCurrent} onPointerDown={confirmCurrent} onKeyDown={confirmCurrent} onSelect={confirmCurrent}
              onCopy={onManualCopy} onCut={onManualCopy} />
          </>}
        </> : <p role="status">{UNCONFIRMED_CONTEXT}</p>}
        <p>Reviewers: <a href="/workspace/clinical-review-inbox" target="_blank" rel="noopener noreferrer">Open Clinical Review ↗</a></p>
      </div>
    </details>
  );
}
