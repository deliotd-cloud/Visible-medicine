'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { clinicalReviewFetch } from '../lib/clinical-review-fetch';
import { inboxAreaLabels, inboxStatusLabels, parseInboxBatch, type InboxArea, type InboxChangeReason, type InboxItem, type InboxStatus } from '../lib/clinical-review-inbox-contract';
import './clinical-review-inbox.css';

type Scan = { items: InboxItem[]; revision: string | null; context: string | null; nextPage: number; pageCount: number | null; selectionTotal: number | null; phase: 'idle' | 'loading' | 'paused' | 'failed' | 'invalid' | 'complete'; error: string | null };
const empty = (): Scan => ({ items: [], revision: null, context: null, nextPage: 1, pageCount: null, selectionTotal: null, phase: 'idle', error: null });
const PAGE_SIZE = 24;
const INBOX_PATH = '/workspace/clinical-review-inbox';
const MAX_SEARCH = 200;
const MAX_ROW_PAGE = 10000;
const unsafeSearchCharacters = /[\u0000-\u001f\u007f]/g;
const cleanSearch = (value: string) => value.replace(unsafeSearchCharacters, '').slice(0, MAX_SEARCH);
type InboxView = { search: string; area: InboxArea | 'all'; status: InboxStatus | 'needing-review' | 'all'; changeFilter: ChangeFilter; rowPage: number };
const defaultView = (): InboxView => ({ search: '', area: 'all', status: 'needing-review', changeFilter: 'all', rowPage: 1 });
function readInboxView(): InboxView {
  const view = defaultView();
  if (typeof window === 'undefined') return view;
  try {
    const url = new URL(window.location.href);
    if (url.pathname !== INBOX_PATH) return view;
    const one = (key: string) => { const values = url.searchParams.getAll(key); return values.length === 1 ? values[0] : null; };
    const q = one('q');
    if (q !== null && q.length <= MAX_SEARCH && !/[\u0000-\u001f\u007f]/.test(q)) view.search = q;
    const area = one('area');
    if (area === 'all' || area && Object.hasOwn(inboxAreaLabels, area)) view.area = area as InboxView['area'];
    const status = one('status');
    if (status === 'all' || status === 'needing-review' || status && Object.hasOwn(inboxStatusLabels, status)) view.status = status as InboxView['status'];
    const change = one('change');
    if (change === 'all' || change === 'source-or-teaching' || change === 'viewer-only' || change === 'other-unclassified') view.changeFilter = change;
    if (view.status !== 're-review' || view.area !== 'all' && view.area !== 'structures') view.changeFilter = 'all';
    const page = one('page');
    if (page && /^[1-9]\d{0,4}$/.test(page) && Number(page) <= MAX_ROW_PAGE) view.rowPage = Number(page);
  } catch { /* Incomplete synthetic windows and malformed URLs keep safe defaults. */ }
  return view;
}
function writeInboxView(view: InboxView) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (url.pathname !== INBOX_PATH || typeof window.history?.replaceState !== 'function') return;
    for (const key of ['q', 'area', 'status', 'change', 'page']) url.searchParams.delete(key);
    if (view.search) url.searchParams.set('q', view.search.slice(0, MAX_SEARCH));
    if (view.area !== 'all') url.searchParams.set('area', view.area);
    if (view.status !== 'needing-review') url.searchParams.set('status', view.status);
    if (view.status === 're-review' && (view.area === 'all' || view.area === 'structures') && view.changeFilter !== 'all') url.searchParams.set('change', view.changeFilter);
    if (view.rowPage > 1) url.searchParams.set('page', String(view.rowPage));
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  } catch { /* History is an enhancement; filters remain usable when it fails. */ }
}
const order: Record<InboxStatus, number> = { 're-review': 0, 'changes-required': 1, 'in-progress': 2, 'not-started': 3, 'inspection-required': 4, unavailable: 5, 'approval-recorded': 6 };
const contextPattern = /^[a-f0-9]{64}$/;
const capabilityLabel = { decision: 'Anatomy or teaching decision', corrections: 'Corrections only', 'inspection-only': 'Inspection only' } as const;
const changeReasonLabel: Record<InboxChangeReason, string> = { 'source-or-teaching': 'Source/teaching changed', 'other-review-material': 'Review material changed', 'viewer-only': 'Viewer update', unavailable: 'Check worksheet' };
const changePriority: Record<InboxChangeReason, number> = { 'source-or-teaching': 0, 'other-review-material': 1, unavailable: 2, 'viewer-only': 3 };
type ChangeFilter = 'all' | 'source-or-teaching' | 'viewer-only' | 'other-unclassified';
type PaginationContext = { generation: number; viewEpoch: number; context: string | null; revision: string | null; page: number; pageCount: number };
type PaginationFocus = Pick<PaginationContext, 'generation' | 'viewEpoch' | 'context' | 'revision'> & { from: number; target: number };
type ReturnFocus = Pick<PaginationContext, 'generation' | 'viewEpoch' | 'context' | 'revision'> & { origin: Element };
type FailureFocus = { generation: number; viewEpoch: number; origin: Element; scan: Scan };

// Display-label search only: never rewrite anatomical IDs, review revisions,
// decisions or access scopes. Punctuation and diacritics are not identity aliases.
function reviewSearchText(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/['\u2019\u02bc]/g, '')
    .replace(/\bfma\s*(\d+)/g, 'fma $1')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
function reviewSearchMatches(item: InboxItem, terms: string[]): boolean {
  const label = reviewSearchText(`${item.title} ${item.scopeLabel} ${item.trackLabel}`);
  return terms.every(term => label.includes(term));
}

function reviewSearchTerms(value: string): string[] {
  const normalized = reviewSearchText(value);
  return normalized ? normalized.split(/\s+/) : [];
}

// The UTF-16 code-unit encoding is injective even for unusual validated keys.
// It keeps arbitrary key text out of IDREF tokens and remains stable as rows move.
function rowContextId(instanceId: string, key: string): string {
  let encoded = '';
  for (let index = 0; index < key.length; index++) encoded += key.charCodeAt(index).toString(16).padStart(4, '0');
  return `${instanceId}-review-${encoded}`;
}

export function ClinicalReviewInbox() {
  const instanceId = useId();
  const [scan, setScan] = useState<Scan>(empty);
  const current = useRef<Scan>(scan);
  const controller = useRef<AbortController | null>(null);
  const automaticScan = useRef(false);
  const generation = useRef(0);
  const pendingReturnScan = useRef<number | null>(null);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<InboxArea | 'all'>('all');
  const [status, setStatus] = useState<InboxStatus | 'needing-review' | 'all'>('needing-review');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [rowPage, setRowPage] = useState(1);
  const viewRef = useRef<InboxView>(defaultView());
  const mounted = useRef(false);
  const paginationViewEpoch = useRef(0);
  const committedPagination = useRef<PaginationContext | null>(null);
  const pendingPaginationFocus = useRef<PaginationFocus | null>(null);
  const pendingResetFocus = useRef<Pick<PaginationContext, 'generation' | 'viewEpoch' | 'context' | 'revision'> | null>(null);
  const pendingReturnFocus = useRef<ReturnFocus | null>(null);
  const pendingFailureFocus = useRef<FailureFocus | null>(null);
  const inboxRoot = useRef<HTMLElement | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const resultsList = useRef<HTMLOListElement | null>(null);
  const resultsPager = useRef<HTMLElement | null>(null);
  const scanAction = useRef<HTMLButtonElement | null>(null);
  const refreshAction = useRef<HTMLButtonElement | null>(null);
  const publish = (value: Scan) => { current.current = value; setScan(value); };
  const publishAutomaticFailure = (value: Scan) => {
    const origin = typeof document === 'undefined' ? null : document.activeElement;
    pendingFailureFocus.current = origin && inboxRoot.current?.contains(origin)
      ? { origin, generation: generation.current, viewEpoch: paginationViewEpoch.current, scan: value }
      : null;
    publish(value);
  };

  const run = (restart: boolean, automatic = false) => {
    pendingReturnScan.current = null;
    generation.current++;
    controller.current?.abort();
    const id = generation.current;
    const previous = automatic ? current.current : null;
    const source = automatic && previous
      ? { ...empty(), context: previous.context, revision: previous.revision, pageCount: previous.pageCount, selectionTotal: previous.selectionTotal }
      : restart ? empty() : current.current;
    const abort = new AbortController();
    controller.current = abort;
    automaticScan.current = automatic;
    pendingReturnFocus.current = null;
    pendingFailureFocus.current = null;
    if (automatic && previous && typeof document !== 'undefined') {
      const origin = document.activeElement;
      if (origin && (resultsList.current?.contains(origin) || resultsPager.current?.contains(origin))) pendingReturnFocus.current = {
        origin, generation: id, viewEpoch: paginationViewEpoch.current, context: previous.context, revision: previous.revision,
      };
    }
    // Keep the current results and focused filters mounted until a return scan
    // has validated every page against the account and catalogue it replaces.
    publish({ ...(previous ?? source), phase: 'loading', error: null });
    if (restart && !automatic) { pendingPaginationFocus.current = null; pendingResetFocus.current = null; setRowPage(1); }
    void (async () => {
      let snapshot = source;
      try {
        for (let page = source.nextPage; ; page++) {
          const query = page === 1 ? '?page=1' : `?page=${page}&revision=${encodeURIComponent(snapshot.revision!)}`;
          const response = await clinicalReviewFetch(`/api/atlas-review/inbox${query}`, { cache: 'no-store', credentials: 'same-origin', signal: abort.signal });
          if (id !== generation.current || abort.signal.aborted) return;
          if (!response.ok) {
            if (response.status === 409 || response.status === 401 || response.status === 403) throw new InvalidScan('Review access, account context, or source material changed. Check your sign-in, then reload this page before scanning again.');
            throw new Error(`Review statuses could not load (HTTP ${response.status}). Resume to retry this page.`);
          }
          const context = response.headers.get('X-Clinical-Review-Context');
          if (!context || !contextPattern.test(context) || snapshot.context && context !== snapshot.context) throw new InvalidScan('Review context is missing or changed. Reload this page before scanning again.');
          const body: unknown = await response.json();
          if (id !== generation.current || abort.signal.aborted) return;
          let batch;
          try { batch = parseInboxBatch(body, page, snapshot.revision); }
          catch { throw new InvalidScan('Review inbox data changed or is invalid. Reload this page before scanning again.'); }
          if (snapshot.pageCount !== null && (batch.pageCount !== snapshot.pageCount || batch.selectionTotal !== snapshot.selectionTotal)) throw new InvalidScan('Review catalogue changed during scanning. Reload this page before scanning again.');
          const seen = new Set(snapshot.items.map(item => item.key));
          if (batch.items.some(item => seen.has(item.key))) throw new InvalidScan('Duplicate review entries crossed pages. Reload this page before scanning again.');
          snapshot = { items: [...snapshot.items, ...batch.items], revision: batch.catalogRevision, context, nextPage: batch.nextPage ?? page + 1, pageCount: batch.pageCount, selectionTotal: batch.selectionTotal, phase: batch.nextPage === null ? 'complete' : 'loading', error: null };
          if (id !== generation.current || abort.signal.aborted) return;
          if (!automatic) publish(snapshot);
          if (batch.nextPage === null) {
            controller.current = null;
            automaticScan.current = false;
            if (automatic) {
              if (previous?.context !== snapshot.context || previous?.revision !== snapshot.revision) {
                pendingReturnFocus.current = null;
                publishAutomaticFailure({ ...empty(), phase: 'invalid', error: 'Review context or source material changed while rechecking. Reload this page before scanning again.' });
              } else publish(snapshot);
            }
            // A return while pages were loading must not cancel that scan, but
            // its earlier pages may predate a decision made in another tab.
            // Consume one generation-bound request only after valid completion.
            if (pendingReturnScan.current === id) {
              pendingReturnScan.current = null;
              if (mounted.current && current.current.phase === 'complete' && viewActive() &&
                  (typeof document === 'undefined' || document.visibilityState !== 'hidden')) loadOnMount.current(true, true);
            }
            return;
          }
        }
      } catch (error) {
        if (id !== generation.current || abort.signal.aborted) return;
        pendingReturnScan.current = null;
        controller.current = null;
        automaticScan.current = false;
        pendingReturnFocus.current = null;
        if (error instanceof InvalidScan) {
          const failed = { ...empty(), phase: 'invalid' as const, error: error.message };
          if (automatic) publishAutomaticFailure(failed); else publish(failed);
        } else {
          const failed = { ...(automatic ? empty() : snapshot), phase: 'failed' as const, error: error instanceof Error ? error.message : 'Review statuses could not load. Resume to retry this page.' };
          if (automatic) publishAutomaticFailure(failed); else publish(failed);
        }
      }
    })();
  };

  // Read-only discovery begins after mount. Strict-mode cleanup and account/
  // source failures retain the same cancellation and fail-closed semantics.
  const loadOnMount = useRef(run);
  loadOnMount.current = run;
  useEffect(() => {
    let active = true;
    mounted.current = true;
    loadOnMount.current(true);
    let away = false;
    const markAway = () => { if (active && mounted.current) away = true; };
    const onVisibility = () => { if (typeof document === 'undefined') return; if (document.visibilityState === 'hidden') markAway(); else onReturn(); };
    const onReturn = () => {
      if (!active || !away) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      away = false;
      if (!mounted.current || !viewActive()) return;
      if (current.current.phase === 'complete' && !controller.current) loadOnMount.current(true, true);
      else if (current.current.phase === 'loading' && controller.current) pendingReturnScan.current = generation.current;
    };
    const restore = () => {
      if (!mounted.current) return;
      const view = readInboxView();
      viewRef.current = view;
      paginationViewEpoch.current++;
      pendingPaginationFocus.current = null;
      pendingResetFocus.current = null;
      pendingReturnFocus.current = null;
      pendingFailureFocus.current = null;
      setSearch(view.search); setArea(view.area); setStatus(view.status); setChangeFilter(view.changeFilter); setRowPage(view.rowPage);
    };
    restore();
    window.addEventListener?.('popstate', restore);
    window.addEventListener?.('blur', markAway);
    window.addEventListener?.('focus', onReturn);
    if (typeof document !== 'undefined') document.addEventListener?.('visibilitychange', onVisibility);
    return () => { active = false; mounted.current = false; pendingReturnScan.current = null; window.removeEventListener?.('popstate', restore); window.removeEventListener?.('blur', markAway); window.removeEventListener?.('focus', onReturn); if (typeof document !== 'undefined') document.removeEventListener?.('visibilitychange', onVisibility); generation.current++; controller.current?.abort(); controller.current = null; automaticScan.current = false; pendingResetFocus.current = null; pendingReturnFocus.current = null; pendingFailureFocus.current = null; };
  }, []);

  const pause = () => {
    pendingReturnScan.current = null;
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    const interruptedAutomatic = automaticScan.current;
    automaticScan.current = false;
    pendingReturnFocus.current = null;
    pendingFailureFocus.current = null;
    publish({ ...(interruptedAutomatic ? empty() : current.current), phase: 'paused', error: null });
  };

  const loaded = scan.items.length;
  const needing = scan.items.filter(item => item.status !== 'approval-recorded' && item.status !== 'unavailable').length;
  const unavailable = scan.items.filter(item => item.status === 'unavailable').length;
  const searchTerms = reviewSearchTerms(search);
  const hasQuery = search.trim().length > 0;
  const showChangeFilter = status === 're-review' && (area === 'all' || area === 'structures');
  const filtered = scan.items.filter(item => (area === 'all' || item.area === area) &&
    (status === 'all' || status === 'needing-review' && item.status !== 'approval-recorded' && item.status !== 'unavailable' || item.status === status) &&
    (!showChangeFilter || changeFilter === 'all' || item.status === 're-review' &&
      (changeFilter === 'other-unclassified' ? item.changeReason !== 'source-or-teaching' && item.changeReason !== 'viewer-only' : item.changeReason === changeFilter)) &&
    (!hasQuery || searchTerms.length > 0 && reviewSearchMatches(item, searchTerms)))
    .sort((a, b) => order[a.status] - order[b.status] ||
      (a.status === 're-review' && b.status === 're-review' ?
        (a.changeReason ? changePriority[a.changeReason] : 2) - (b.changeReason ? changePriority[b.changeReason] : 2) : 0) ||
      a.title.localeCompare(b.title) || a.trackLabel.localeCompare(b.trackLabel));
  const rowPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = Math.min(rowPage, rowPages);
  const rows = filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const filtersDirty = search !== '' || area !== 'all' || status !== 'needing-review' || changeFilter !== 'all';
  const viewActive = () => {
    if (!mounted.current || typeof window === 'undefined') return false;
    // Older controlled component harnesses supply only location.reload().
    if (typeof window.location?.href !== 'string') return true;
    try { return new URL(window.location.href).pathname === INBOX_PATH; } catch { return false; }
  };
  const saveView = () => { if (viewActive()) writeInboxView(viewRef.current); };
  const filterChanged = (change: Partial<InboxView>) => {
    paginationViewEpoch.current++; pendingPaginationFocus.current = null; pendingResetFocus.current = null; pendingReturnFocus.current = null; pendingFailureFocus.current = null; setRowPage(1);
    viewRef.current = { ...viewRef.current, ...change, rowPage: 1 };
    saveView();
  };
  const pageContext: PaginationContext = { generation: generation.current, viewEpoch: paginationViewEpoch.current, context: scan.context, revision: scan.revision, page: visiblePage, pageCount: rowPages };
  const filterActionCurrent = () => viewActive() && committedPagination.current === pageContext && generation.current === pageContext.generation &&
    paginationViewEpoch.current === pageContext.viewEpoch && current.current.context === pageContext.context &&
    current.current.revision === pageContext.revision && current.current.phase !== 'invalid';
  const scanActionCurrent = () => current.current === scan && generation.current === pageContext.generation;
  const commitScanAction = (node: HTMLButtonElement | null) => {
    const previous = scanAction.current;
    scanAction.current = node;
    // Only a focused scan button removed by successful completion hands focus
    // to the persistent Refresh control. Background work never steals focus.
    if (node || !previous || typeof document === 'undefined' ||
      generation.current !== pageContext.generation || current.current.phase !== 'complete' ||
      scan.context !== null && scan.context !== current.current.context ||
      scan.revision !== null && scan.revision !== current.current.revision) return;
    if (document.activeElement === previous && refreshAction.current?.isConnected)
      refreshAction.current.focus({ preventScroll: true });
  };
  const resetFilters = () => {
    // A retained or uncommitted control cannot change a newer account, source or filter view.
    if (!filtersDirty || !viewActive() || committedPagination.current !== pageContext || generation.current !== pageContext.generation ||
      paginationViewEpoch.current !== pageContext.viewEpoch || current.current.context !== pageContext.context ||
      current.current.revision !== pageContext.revision || current.current.phase === 'invalid') return;
    setSearch(''); setArea('all'); setStatus('needing-review'); setChangeFilter('all');
    filterChanged(defaultView());
    pendingResetFocus.current = { generation: generation.current, viewEpoch: paginationViewEpoch.current, context: pageContext.context, revision: pageContext.revision };
  };
  const changeRowPage = (delta: number) => {
    // Only controls from the committed account/source/filter view may paginate.
    if (!viewActive() || committedPagination.current !== pageContext || generation.current !== pageContext.generation || paginationViewEpoch.current !== pageContext.viewEpoch ||
      current.current.context !== pageContext.context || current.current.revision !== pageContext.revision || current.current.phase === 'invalid' || !current.current.items.length) return;
    const target = Math.max(1, Math.min(pageContext.pageCount, pageContext.page + delta));
    if (target === pageContext.page) return;
    pendingPaginationFocus.current = { ...pageContext, from: pageContext.page, target };
    setRowPage(target);
    viewRef.current = { ...viewRef.current, rowPage: target };
    saveView();
  };
  const commitResults = (node: HTMLParagraphElement | null) => {
    if (!node) { if (committedPagination.current === pageContext) committedPagination.current = null; return; }
    committedPagination.current = pageContext;
    const returned = pendingReturnFocus.current;
    if (returned && current.current.phase === 'complete') {
      pendingReturnFocus.current = null;
      if (returned.generation === pageContext.generation && returned.viewEpoch === pageContext.viewEpoch &&
        returned.context === pageContext.context && returned.revision === pageContext.revision &&
        !returned.origin.isConnected && typeof document !== 'undefined' && document.activeElement === document.body)
        node.focus({ preventScroll: true });
    }
    const reset = pendingResetFocus.current;
    if (reset) {
      pendingResetFocus.current = null;
      if (reset.generation === pageContext.generation && reset.viewEpoch === pageContext.viewEpoch &&
        reset.context === pageContext.context && reset.revision === pageContext.revision &&
        !filtersDirty && visiblePage === 1 && current.current.phase !== 'invalid') searchInput.current?.focus();
    }
    const pending = pendingPaginationFocus.current;
    if (!pending) return;
    if (pending.generation !== pageContext.generation || pending.viewEpoch !== pageContext.viewEpoch || pending.context !== pageContext.context || pending.revision !== pageContext.revision) {
      pendingPaginationFocus.current = null; return;
    }
    // Only a committed explicit page change resets the inner list and moves focus.
    // Typing, background loading and abandoned renders leave both in place.
    if (pending.target === visiblePage && pending.from !== visiblePage) {
      pendingPaginationFocus.current = null;
      if (resultsList.current) resultsList.current.scrollTop = 0;
      node.focus();
    }
  };
  const commitFailureAlert = (node: HTMLParagraphElement | null) => {
    const pending = pendingFailureFocus.current;
    if (!node || !pending || !node.isConnected || !mounted.current || !viewActive() ||
      !inboxRoot.current?.contains(node) || pending.generation !== generation.current ||
      pending.viewEpoch !== paginationViewEpoch.current || pending.scan !== scan || current.current !== scan ||
      !scan.error || scan.phase !== 'invalid' && scan.phase !== 'failed') return;
    pendingFailureFocus.current = null;
    if (!pending.origin.isConnected && typeof document !== 'undefined' && document.activeElement === document.body)
      node.focus({ preventScroll: true });
  };

  return <section ref={inboxRoot} className="clinical-review-inbox" aria-labelledby="clinical-review-inbox-title">
    <header><div><p className="clinical-review-inbox-eyebrow">Private workspace</p><h1 id="clinical-review-inbox-title">Clinical Review</h1>
      <p>Review outstanding anatomy and teaching. Each decision applies only to its exact revision.</p></div></header>
    <div className="clinical-review-inbox-workbench">
    <div className="clinical-review-inbox-tools">
    <details className="clinical-review-inbox-browse"><summary>Browse review areas</summary>
    <nav className="clinical-review-inbox-areas" aria-label="Browse clinical review worksheets">
      <a href="/workspace/atlas-review" target="_blank" rel="noopener noreferrer" aria-label="3D anatomy and teaching worksheets (opens in a new tab)">3D anatomy &amp; teaching<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/atlas-review/head-learning" target="_blank" rel="noopener noreferrer" aria-label="CT and MRI head learning worksheets (opens in a new tab)">CT/MRI head learning<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/atlas-review/regional-guides" target="_blank" rel="noopener noreferrer" aria-label="Native MRI guide teaching worksheets (opens in a new tab)">Native MRI guide teaching<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/atlas-review/source-comparisons" target="_blank" rel="noopener noreferrer" aria-label="Held source comparisons (opens in a new tab)">Held source comparisons<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/review-candidates" target="_blank" rel="noopener noreferrer" aria-label="Saved read-only inspections (opens in a new tab)">Saved inspections · read-only<span aria-hidden="true"> ↗</span></a>
    </nav>
    <p className="clinical-review-inbox-disclosure">Worksheet links open in a new tab so unsaved work here stays in place. Capabilities depend on each worksheet.</p>
    </details>
    <div className="clinical-review-inbox-controls">
      {scan.phase === 'idle' ? <button type="button" onClick={() => run(true)}>Load all review statuses</button> : null}
      {scan.phase === 'invalid' ? <button type="button" onClick={() => window.location.reload()}>Reload page</button> : null}
      {scan.phase === 'loading' || scan.phase === 'paused' || scan.phase === 'failed' ? <button key="review-scan-toggle" ref={commitScanAction} type="button" onClick={() => {
        if (!scanActionCurrent()) return;
        if (scan.phase === 'loading') pause(); else run(false);
      }}>{scan.phase === 'loading' ? 'Pause' : `Resume from page ${scan.nextPage}`}</button> : null}
      {scan.phase !== 'idle' && scan.phase !== 'invalid' ? <button key="review-scan-refresh" ref={refreshAction} type="button" className="secondary" onClick={() => { if (scanActionCurrent() && viewActive()) { run(true); viewRef.current = { ...viewRef.current, rowPage: 1 }; saveView(); } }}>Refresh reviews</button> : null}
       <p role="status" aria-live="polite">{scan.phase === 'idle' ? 'Statuses have not been loaded.' : scan.phase === 'invalid' ? 'Scan invalidated; no statuses are shown.' : automaticScan.current ? 'Rechecking review statuses. Previous results remain visible until every page is checked.' : `${loaded} status rows loaded${scan.pageCount === null ? '' : ` · ${Math.min(scan.nextPage - 1, scan.pageCount)} of ${scan.pageCount} pages checked`}${scan.phase === 'complete' ? ' · scan complete' : ` · ${scan.phase}`}.`}</p>
    </div>
    {scan.error && <p ref={commitFailureAlert} tabIndex={-1} role="alert" className="clinical-review-inbox-error">{scan.error}</p>}
    {loaded > 0 && <>
      <p className="clinical-review-inbox-summary"><strong>{needing}</strong> loaded review items need attention{scan.phase === 'complete' ? '' : ' · partial results'}. <span>{unavailable} unavailable · {loaded - needing - unavailable} recorded decisions</span></p>
      <details className="clinical-review-inbox-count-details"><summary>Status details &amp; approval scope</summary>
        <p>Among {loaded} loaded status rows: {needing} known needing review, {unavailable} unavailable, {loaded - needing - unavailable} recorded decisions. {scan.phase === 'complete' ? 'All catalogue pages in this scan were checked. Saved statuses can change during a scan.' : 'More pages may remain; these are loaded-page counts only.'}</p>
        <p>An exact worksheet approval does not grant blanket publication, patient-space registration or institution sign-off. Anatomy, teaching and source comparisons retain their own review scope.</p>
      </details>
      <div className={`clinical-review-inbox-filters${showChangeFilter ? ' has-change-filter' : ''}`}>
        <label>Search reviews<input ref={searchInput} type="search" maxLength={MAX_SEARCH} value={search} onChange={event => { if (!filterActionCurrent()) return; const next = cleanSearch(event.target.value); setSearch(next); filterChanged({ search: next }); }} placeholder="Name, region, FMA ID or review type" /></label>
        <label>Area<select aria-label="Area" value={area} onChange={event => { if (!filterActionCurrent()) return; const next = event.target.value as InboxArea | 'all'; setArea(next); setChangeFilter('all'); filterChanged({ area: next, changeFilter: 'all' }); }}><option value="all">All areas</option>{Object.entries(inboxAreaLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Status<select aria-label="Status" value={status} onChange={event => { if (!filterActionCurrent()) return; const next = event.target.value as InboxStatus | 'all' | 'needing-review'; setStatus(next); setChangeFilter('all'); filterChanged({ status: next, changeFilter: 'all' }); }}><option value="needing-review">Known needing review</option><option value="all">All loaded statuses</option>{Object.entries(inboxStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {showChangeFilter && <label>Change<select aria-label="Change" value={changeFilter} onChange={event => { if (!filterActionCurrent()) return; const next = event.target.value as ChangeFilter; setChangeFilter(next); filterChanged({ changeFilter: next }); }}><option value="all">All changes</option><option value="source-or-teaching">Source/teaching</option><option value="viewer-only">Viewer update</option><option value="other-unclassified">Other/unclassified</option></select></label>}
        {filtersDirty && <button type="button" className="secondary clinical-review-inbox-reset" onClick={resetFilters}>Reset filters</button>}
      </div>
      {(showChangeFilter || rows.some(item => item.changeReason)) && <details className="clinical-review-inbox-change-help"><summary>About change reasons</summary><p>Labels use recorded change metadata. They are not an old text diff, clinical urgency or approval.</p></details>}
    </>}
    </div>
    <div className="clinical-review-inbox-results-pane">
    {loaded > 0 && <>
      <div className="clinical-review-inbox-result-bar">
        <p id="clinical-review-inbox-results-summary" ref={commitResults} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="clinical-review-inbox-result">Showing {filtered.length ? (visiblePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(visiblePage * PAGE_SIZE, filtered.length)} of {filtered.length} matching loaded rows.</p>
        {rowPages > 1 && <nav ref={resultsPager} className="clinical-review-inbox-pages" aria-label="Inbox rows"><button type="button" aria-label="Previous page of review results" aria-controls="clinical-review-inbox-results" disabled={visiblePage === 1} onClick={() => changeRowPage(-1)}>Previous</button><span>Page {visiblePage} of {rowPages}</span><button type="button" aria-label="Next page of review results" aria-controls="clinical-review-inbox-results" disabled={visiblePage === rowPages} onClick={() => changeRowPage(1)}>Next</button></nav>}
      </div>
      {rows.length ? <ol id="clinical-review-inbox-results" ref={resultsList} tabIndex={0} aria-labelledby="clinical-review-inbox-results-summary" className="clinical-review-inbox-list" start={(visiblePage - 1) * PAGE_SIZE + 1}>{rows.map(item => {
        const contextId = rowContextId(instanceId, item.key);
        return <li key={item.key}>
        <div className="clinical-review-inbox-rowhead"><a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.title}, ${item.trackLabel} worksheet (opens in a new tab)`} aria-describedby={`${contextId}-status ${contextId}-capability${item.changeReason ? ` ${contextId}-reason` : ''}`}><span>{item.title}<small>{item.scopeLabel} · {item.trackLabel}</small></span><span className="clinical-review-inbox-open" aria-hidden="true">Review ↗</span></a><span id={`${contextId}-status`} className={`clinical-review-inbox-status status-${item.status}`}>{inboxStatusLabels[item.status]}</span></div>
        <div className="clinical-review-inbox-rowdetail"><span id={`${contextId}-capability`} className="clinical-review-inbox-capability">{capabilityLabel[item.capability]}</span>{item.changeReason && <span id={`${contextId}-reason`} className="clinical-review-inbox-change-reason">{changeReasonLabel[item.changeReason]}</span>}<details><summary aria-label={`Exact worksheet revision for ${item.title}, ${item.scopeLabel}, ${item.trackLabel}`}>Exact worksheet revision</summary><p>{inboxAreaLabels[item.area]}</p><code>{item.revision ?? 'Unavailable'}</code></details></div>
      </li>; })}</ol> : <p className="clinical-review-inbox-empty">{filtersDirty ? 'No loaded rows match these filters. Use Reset filters to return to known items needing review.' : scan.phase === 'complete' ? 'No known review items need attention in this completed scan. This does not record an approval.' : 'No known review items need attention in the loaded rows yet. This scan is incomplete.'}</p>}
    </>}
    {loaded === 0 && scan.phase !== 'idle' && scan.phase !== 'invalid' && <p className="clinical-review-inbox-empty">{scan.phase === 'complete' ? 'No known review items need attention in this completed scan. This does not record an approval.' : 'No status rows are loaded yet. This scan is incomplete.'}</p>}
    </div>
    </div>
    <details className="clinical-review-inbox-other"><summary>Other review workflows (not included in these counts)</summary>
      <p>This scan covers 3D anatomy and teaching, CT/MRI head learning, native MRI guide teaching, and held source comparisons. It does not cover every platform approval. Specialist CT-head mask and accepted-boundary sign-off remains separate.</p>
      <ul>
        <li><a href="/workspace/clinical-review-inbox/local-reference" target="_blank" rel="noopener noreferrer">Local reference inspection · choose a held packet folder<span aria-hidden="true"> ↗</span></a></li>
        <li><a href="/workspace/atlas-review/anatomy-coverage" target="_blank" rel="noopener noreferrer">Anatomy coverage and gaps · source inventory<span aria-hidden="true"> ↗</span></a></li>
        <li><a href="/learn/fracture-review" target="_blank" rel="noopener noreferrer">Fracture examination pilot<span aria-hidden="true"> ↗</span></a></li>
        <li><a href="/studio/workspace" target="_blank" rel="noopener noreferrer">Course and lecture publishing<span aria-hidden="true"> ↗</span></a></li>
        <li><a href="/workspace/atlas-review/regional-mri" target="_blank" rel="noopener noreferrer">Regional MRI inspection · corrections and recovery<span aria-hidden="true"> ↗</span></a></li>
        <li><a href="/workspace/atlas-review/reference-learning" target="_blank" rel="noopener noreferrer">Regional reference teaching · draft catalogue and private corrections<span aria-hidden="true"> ↗</span></a></li>
      </ul>
      <p>These destinations keep their own access rules and open in a new tab.</p>
    </details>
  </section>;
}

class InvalidScan extends Error {}
