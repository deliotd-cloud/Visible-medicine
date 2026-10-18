'use client';

import { useEffect, useRef, useState } from 'react';
import { clinicalReviewFetch } from '../lib/clinical-review-fetch';
import { inboxAreaLabels, inboxStatusLabels, parseInboxBatch, type InboxArea, type InboxChangeReason, type InboxItem, type InboxStatus } from '../lib/clinical-review-inbox-contract';
import './clinical-review-inbox.css';

type Scan = { items: InboxItem[]; revision: string | null; context: string | null; nextPage: number; pageCount: number | null; selectionTotal: number | null; phase: 'idle' | 'loading' | 'paused' | 'failed' | 'invalid' | 'complete'; error: string | null };
const empty = (): Scan => ({ items: [], revision: null, context: null, nextPage: 1, pageCount: null, selectionTotal: null, phase: 'idle', error: null });
const PAGE_SIZE = 24;
const order: Record<InboxStatus, number> = { 're-review': 0, 'changes-required': 1, 'in-progress': 2, 'not-started': 3, 'inspection-required': 4, unavailable: 5, 'approval-recorded': 6 };
const contextPattern = /^[a-f0-9]{64}$/;
const capabilityLabel = { decision: 'Anatomy or teaching decision', corrections: 'Corrections only', 'inspection-only': 'Inspection only' } as const;
const changeReasonLabel: Record<InboxChangeReason, string> = { 'source-or-teaching': 'Source/teaching changed', 'other-review-material': 'Review material changed', 'viewer-only': 'Viewer update', unavailable: 'Check worksheet' };
const changePriority: Record<InboxChangeReason, number> = { 'source-or-teaching': 0, 'other-review-material': 1, unavailable: 2, 'viewer-only': 3 };
type ChangeFilter = 'all' | 'source-or-teaching' | 'viewer-only' | 'other-unclassified';
type PaginationContext = { generation: number; viewEpoch: number; context: string | null; revision: string | null; page: number; pageCount: number };
type PaginationFocus = Pick<PaginationContext, 'generation' | 'viewEpoch' | 'context' | 'revision'> & { from: number; target: number };

export function ClinicalReviewInbox() {
  const [scan, setScan] = useState<Scan>(empty);
  const current = useRef<Scan>(scan);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<InboxArea | 'all'>('all');
  const [status, setStatus] = useState<InboxStatus | 'needing-review' | 'all'>('needing-review');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [rowPage, setRowPage] = useState(1);
  const paginationViewEpoch = useRef(0);
  const committedPagination = useRef<PaginationContext | null>(null);
  const pendingPaginationFocus = useRef<PaginationFocus | null>(null);
  const pendingResetFocus = useRef<Pick<PaginationContext, 'generation' | 'viewEpoch' | 'context' | 'revision'> | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const scanAction = useRef<HTMLButtonElement | null>(null);
  const refreshAction = useRef<HTMLButtonElement | null>(null);
  const publish = (value: Scan) => { current.current = value; setScan(value); };

  const run = (restart: boolean) => {
    generation.current++;
    controller.current?.abort();
    const id = generation.current;
    const source = restart ? empty() : current.current;
    const abort = new AbortController();
    controller.current = abort;
    publish({ ...source, phase: 'loading', error: null });
    if (restart) { pendingPaginationFocus.current = null; pendingResetFocus.current = null; setRowPage(1); }
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
          publish(snapshot);
          if (batch.nextPage === null) { controller.current = null; return; }
        }
      } catch (error) {
        if (id !== generation.current || abort.signal.aborted) return;
        controller.current = null;
        if (error instanceof InvalidScan) publish({ ...empty(), phase: 'invalid', error: error.message });
        else publish({ ...snapshot, phase: 'failed', error: error instanceof Error ? error.message : 'Review statuses could not load. Resume to retry this page.' });
      }
    })();
  };

  // Read-only discovery begins after mount. Strict-mode cleanup and account/
  // source failures retain the same cancellation and fail-closed semantics.
  const loadOnMount = useRef(run);
  loadOnMount.current = run;
  useEffect(() => {
    loadOnMount.current(true);
    return () => { generation.current++; controller.current?.abort(); controller.current = null; pendingResetFocus.current = null; };
  }, []);

  const pause = () => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    publish({ ...current.current, phase: 'paused', error: null });
  };

  const loaded = scan.items.length;
  const needing = scan.items.filter(item => item.status !== 'approval-recorded' && item.status !== 'unavailable').length;
  const unavailable = scan.items.filter(item => item.status === 'unavailable').length;
  const normalized = search.trim().toLocaleLowerCase();
  const showChangeFilter = status === 're-review' && (area === 'all' || area === 'structures');
  const filtered = scan.items.filter(item => (area === 'all' || item.area === area) &&
    (status === 'all' || status === 'needing-review' && item.status !== 'approval-recorded' && item.status !== 'unavailable' || item.status === status) &&
    (!showChangeFilter || changeFilter === 'all' || item.status === 're-review' &&
      (changeFilter === 'other-unclassified' ? item.changeReason !== 'source-or-teaching' && item.changeReason !== 'viewer-only' : item.changeReason === changeFilter)) &&
    (!normalized || `${item.title} ${item.scopeLabel} ${item.trackLabel}`.toLocaleLowerCase().includes(normalized)))
    .sort((a, b) => order[a.status] - order[b.status] ||
      (a.status === 're-review' && b.status === 're-review' ?
        (a.changeReason ? changePriority[a.changeReason] : 2) - (b.changeReason ? changePriority[b.changeReason] : 2) : 0) ||
      a.title.localeCompare(b.title) || a.trackLabel.localeCompare(b.trackLabel));
  const rowPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = Math.min(rowPage, rowPages);
  const rows = filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const filtersDirty = search !== '' || area !== 'all' || status !== 'needing-review' || changeFilter !== 'all';
  const filterChanged = () => { paginationViewEpoch.current++; pendingPaginationFocus.current = null; pendingResetFocus.current = null; setRowPage(1); };
  const pageContext: PaginationContext = { generation: generation.current, viewEpoch: paginationViewEpoch.current, context: scan.context, revision: scan.revision, page: visiblePage, pageCount: rowPages };
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
    if (!filtersDirty || committedPagination.current !== pageContext || generation.current !== pageContext.generation ||
      paginationViewEpoch.current !== pageContext.viewEpoch || current.current.context !== pageContext.context ||
      current.current.revision !== pageContext.revision || current.current.phase === 'invalid') return;
    setSearch(''); setArea('all'); setStatus('needing-review'); setChangeFilter('all');
    filterChanged();
    pendingResetFocus.current = { generation: generation.current, viewEpoch: paginationViewEpoch.current, context: pageContext.context, revision: pageContext.revision };
  };
  const changeRowPage = (delta: number) => {
    // Only controls from the committed account/source/filter view may paginate.
    if (committedPagination.current !== pageContext || generation.current !== pageContext.generation || paginationViewEpoch.current !== pageContext.viewEpoch ||
      current.current.context !== pageContext.context || current.current.revision !== pageContext.revision || current.current.phase === 'invalid' || !current.current.items.length) return;
    const target = Math.max(1, Math.min(pageContext.pageCount, pageContext.page + delta));
    if (target === pageContext.page) return;
    pendingPaginationFocus.current = { ...pageContext, from: pageContext.page, target };
    setRowPage(target);
  };
  const commitResults = (node: HTMLParagraphElement | null) => {
    if (!node) { if (committedPagination.current === pageContext) committedPagination.current = null; return; }
    committedPagination.current = pageContext;
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
    // Commit-phase focus scrolls to the new rows only after explicit pagination;
    // typing, background loading and abandoned renders never move focus.
    if (pending.target === visiblePage && pending.from !== visiblePage) {
      pendingPaginationFocus.current = null; node.focus();
    }
  };

  return <section className="clinical-review-inbox" aria-labelledby="clinical-review-inbox-title">
    <header><div><p className="clinical-review-inbox-eyebrow">Private workspace</p><h2 id="clinical-review-inbox-title">Clinical Review</h2>
      <p>Review outstanding anatomy and teaching. Each decision applies only to its exact revision.</p></div></header>
    <details className="clinical-review-inbox-browse"><summary>Browse review areas</summary>
    <nav className="clinical-review-inbox-areas" aria-label="Browse clinical review worksheets">
      <a href="/workspace/atlas-review" target="_blank" rel="noopener noreferrer" aria-label="3D anatomy and teaching worksheets (opens in a new tab)">3D anatomy &amp; teaching<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/atlas-review/head-learning" target="_blank" rel="noopener noreferrer" aria-label="CT and MRI head learning worksheets (opens in a new tab)">CT/MRI head learning<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/atlas-review/regional-guides" target="_blank" rel="noopener noreferrer" aria-label="Native MRI guide teaching worksheets (opens in a new tab)">Native MRI guide teaching<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/atlas-review/source-comparisons" target="_blank" rel="noopener noreferrer" aria-label="Held source comparisons (opens in a new tab)">Held source comparisons<span aria-hidden="true"> ↗</span></a>
      <a href="/workspace/review-candidates" target="_blank" rel="noopener noreferrer" aria-label="Saved read-only inspections (opens in a new tab)">Saved inspections · read-only<span aria-hidden="true"> ↗</span></a>
    </nav>
    </details>
    <div className="clinical-review-inbox-controls">
      {scan.phase === 'idle' ? <button type="button" onClick={() => run(true)}>Load all review statuses</button> : null}
      {scan.phase === 'invalid' ? <button type="button" onClick={() => window.location.reload()}>Reload page</button> : null}
      {scan.phase === 'loading' || scan.phase === 'paused' || scan.phase === 'failed' ? <button key="review-scan-toggle" ref={commitScanAction} type="button" onClick={() => {
        if (!scanActionCurrent()) return;
        if (scan.phase === 'loading') pause(); else run(false);
      }}>{scan.phase === 'loading' ? 'Pause' : `Resume from page ${scan.nextPage}`}</button> : null}
      {scan.phase !== 'idle' && scan.phase !== 'invalid' ? <button key="review-scan-refresh" ref={refreshAction} type="button" className="secondary" onClick={() => { if (scanActionCurrent()) run(true); }}>Refresh reviews</button> : null}
      <p role="status" aria-live="polite">{scan.phase === 'idle' ? 'Statuses have not been loaded.' : scan.phase === 'invalid' ? 'Scan invalidated; no statuses are shown.' : `${loaded} status rows loaded${scan.pageCount === null ? '' : ` · ${Math.min(scan.nextPage - 1, scan.pageCount)} of ${scan.pageCount} pages checked`}${scan.phase === 'complete' ? ' · scan complete' : ` · ${scan.phase}`}.`}</p>
    </div>
    {scan.error && <p role="alert" className="clinical-review-inbox-error">{scan.error}</p>}
    {loaded > 0 && <>
      <p className="clinical-review-inbox-summary"><strong>{needing}</strong> loaded review items need attention{scan.phase === 'complete' ? '' : ' · partial results'}. <span>{unavailable} unavailable · {loaded - needing - unavailable} recorded decisions</span></p>
      <details className="clinical-review-inbox-count-details"><summary>Status details &amp; approval scope</summary>
        <p>Among {loaded} loaded status rows: {needing} known needing review, {unavailable} unavailable, {loaded - needing - unavailable} recorded decisions. {scan.phase === 'complete' ? 'All catalogue pages in this scan were checked. Saved statuses can change during a scan.' : 'More pages may remain; these are loaded-page counts only.'}</p>
        <p>An exact worksheet approval does not grant blanket publication, patient-space registration or institution sign-off. Anatomy, teaching and source comparisons retain their own review scope.</p>
      </details>
      <div className={`clinical-review-inbox-filters${showChangeFilter ? ' has-change-filter' : ''}`}>
        <label>Search reviews<input ref={searchInput} type="search" value={search} onChange={event => { setSearch(event.target.value); filterChanged(); }} placeholder="Structure, scope or review type" /></label>
        <label>Area<select value={area} onChange={event => { setArea(event.target.value as InboxArea | 'all'); setChangeFilter('all'); filterChanged(); }}><option value="all">All areas</option>{Object.entries(inboxAreaLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Status<select value={status} onChange={event => { setStatus(event.target.value as InboxStatus | 'all' | 'needing-review'); setChangeFilter('all'); filterChanged(); }}><option value="needing-review">Known needing review</option><option value="all">All loaded statuses</option>{Object.entries(inboxStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {showChangeFilter && <label>Change<select value={changeFilter} onChange={event => { setChangeFilter(event.target.value as ChangeFilter); filterChanged(); }}><option value="all">All changes</option><option value="source-or-teaching">Source/teaching</option><option value="viewer-only">Viewer update</option><option value="other-unclassified">Other/unclassified</option></select></label>}
        {filtersDirty && <button type="button" className="secondary clinical-review-inbox-reset" onClick={resetFilters}>Reset filters</button>}
      </div>
      {(showChangeFilter || rows.some(item => item.changeReason)) && <details className="clinical-review-inbox-change-help"><summary>About change reasons</summary><p>Labels use recorded change metadata. They are not an old text diff, clinical urgency or approval.</p></details>}
      <p className="clinical-review-inbox-disclosure">Worksheet links open in a new tab so unsaved work here stays in place. Capabilities depend on each worksheet.</p>
      <div className="clinical-review-inbox-result-bar">
        <p id="clinical-review-inbox-results-summary" ref={commitResults} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="clinical-review-inbox-result">Showing {filtered.length ? (visiblePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(visiblePage * PAGE_SIZE, filtered.length)} of {filtered.length} matching loaded rows.</p>
        {rowPages > 1 && <nav className="clinical-review-inbox-pages" aria-label="Inbox rows"><button type="button" aria-label="Previous page of review results" aria-controls="clinical-review-inbox-results" disabled={visiblePage === 1} onClick={() => changeRowPage(-1)}>Previous</button><span>Page {visiblePage} of {rowPages}</span><button type="button" aria-label="Next page of review results" aria-controls="clinical-review-inbox-results" disabled={visiblePage === rowPages} onClick={() => changeRowPage(1)}>Next</button></nav>}
      </div>
      {rows.length ? <ol id="clinical-review-inbox-results" aria-labelledby="clinical-review-inbox-results-summary" className="clinical-review-inbox-list" start={(visiblePage - 1) * PAGE_SIZE + 1}>{rows.map(item => <li key={item.key}>
        <div className="clinical-review-inbox-rowhead"><a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.title}, ${item.trackLabel} worksheet (opens in a new tab)`}><span>{item.title}<small>{item.scopeLabel} · {item.trackLabel}</small></span><span className="clinical-review-inbox-open" aria-hidden="true">Review ↗</span></a><span className={`clinical-review-inbox-status status-${item.status}`}>{inboxStatusLabels[item.status]}</span></div>
        <div className="clinical-review-inbox-rowdetail"><span className="clinical-review-inbox-capability">{capabilityLabel[item.capability]}</span>{item.changeReason && <span className="clinical-review-inbox-change-reason">{changeReasonLabel[item.changeReason]}</span>}<details><summary>Exact worksheet revision</summary><p>{inboxAreaLabels[item.area]}</p><code>{item.revision ?? 'Unavailable'}</code></details></div>
      </li>)}</ol> : <p className="clinical-review-inbox-empty">{filtersDirty ? 'No loaded rows match these filters. Use Reset filters to return to known items needing review.' : scan.phase === 'complete' ? 'No known review items need attention in this completed scan. This does not record an approval.' : 'No known review items are loaded yet. This scan is incomplete.'}</p>}
    </>}
    {loaded === 0 && scan.phase !== 'idle' && scan.phase !== 'invalid' && <p className="clinical-review-inbox-empty">{scan.phase === 'complete' ? 'No known review items need attention in this completed scan. This does not record an approval.' : 'No status rows are loaded yet. This scan is incomplete.'}</p>}
    <details className="clinical-review-inbox-other"><summary>Other review workflows (not included in these counts)</summary>
      <p>This scan covers 3D anatomy and teaching, CT/MRI head learning, native MRI guide teaching, and held source comparisons. It does not cover every platform approval. Specialist CT-head mask and accepted-boundary sign-off remains separate.</p>
      <ul>
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
