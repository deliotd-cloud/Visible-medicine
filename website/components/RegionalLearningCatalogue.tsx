'use client';

import { useRef, useState, type ReactNode } from 'react';
import { regionalTourMatchesRegion, type RegionalLearningCatalogueData } from '../lib/regional-learning-discovery';
import { regionalTourEntryHref, regionalTourRegionHref, regionalTourStepHref } from '../lib/regional-tour-entry-navigation';
import './regional-learning-catalogue.css';

const PAGE_SIZE = 6;
const tourMinutes = (duration: unknown): number | null =>
  typeof duration === 'number' && Number.isSafeInteger(duration) && duration > 0 && duration <= 24 * 60 * 60 * 1000
    ? Math.ceil(duration / 60000) : null;
type Filters = { source: RegionalLearningCatalogueData; query: string; region: string; page: number };

export function RegionalLearningCatalogue({ catalogue, initialQuery = '', fixedQuery = false, initialRegion = 'all', fixedRegion = false, initialPage = 1, catalogueSearch }: { catalogue: RegionalLearningCatalogueData; initialQuery?: string; fixedQuery?: boolean; initialRegion?: string; fixedRegion?: boolean; initialPage?: number; catalogueSearch?: string }) {
  const [filters, setFilters] = useState<Filters>(() => ({ source: catalogue, query: initialQuery, region: initialRegion, page: 1 }));
  const searchRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);
  const pendingPageFocus = useRef<{ source: RegionalLearningCatalogueData; page: number; owner: HTMLButtonElement } | null>(null);
  // A new server snapshot must not inherit a page or filter from the previous source.
  const current = filters.source === catalogue ? filters : { source: catalogue, query: initialQuery, region: initialRegion, page: 1 };
  if (current !== filters) { pendingPageFocus.current = null; setFilters(current); }

  const terms = current.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const tours = catalogue.available ? catalogue.tours.filter(tour => {
    if (current.region !== 'all' && !regionalTourMatchesRegion(tour, current.region)) return false;
    const searchable = [tour.title, tour.description, ...tour.steps.flatMap(step => [step.title, step.structureName])].join(' ').toLocaleLowerCase();
    return terms.every(term => searchable.includes(term));
  }) : [];
  const pages = Math.max(1, Math.ceil(tours.length / PAGE_SIZE));
  const safeInitialPage = Number.isSafeInteger(initialPage) && initialPage > 0 ? initialPage : 1;
  const page = Math.min(catalogueSearch === undefined ? current.page : safeInitialPage, pages);
  const pageHref = (next: number) => { const params = new URLSearchParams(catalogueSearch); params.set('regionalPage', String(next)); return `/atlas/guided-learning?${params}#regional-tour-results`; };
  const visible = tours.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = (!fixedQuery && current.query.trim() !== '') || (!fixedRegion && current.region !== 'all');
  const setQuery = (query: string) => { pendingPageFocus.current = null; setFilters({ source: catalogue, query, region: current.region, page: 1 }); };
  const setRegion = (region: string) => { pendingPageFocus.current = null; setFilters({ source: catalogue, query: current.query, region, page: 1 }); };
  const navigatePage = (nextPage: number, owner?: HTMLButtonElement) => {
    if (nextPage < 1 || nextPage > pages || nextPage === page) return;
    pendingPageFocus.current = owner ? { source: catalogue, page: nextPage, owner } : null;
    setFilters({ ...current, page: nextPage });
  };
  const focusPageResult = (node: HTMLParagraphElement | null) => {
    const pending = pendingPageFocus.current;
    if (!node || !pending || pending.source !== catalogue || pending.page !== page) return;
    pendingPageFocus.current = null;
    if (typeof document !== 'undefined' && (document.activeElement === pending.owner ||
        (document.activeElement === document.body && pending.owner.disabled))) node.focus({ preventScroll: true });
  };
  const stepLink = (tour: RegionalLearningCatalogueData['tours'][number], index: number, label: ReactNode) => {
    const href = regionalTourStepHref(tour, catalogue.sourceRevision, index);
    return href ? <a className="regional-learning-step-link" href={href} aria-label={`Open step ${index + 1}: ${tour.steps[index].title} in ${tour.title}`}>{label}</a> : label;
  };
  const stepContext = (tour: RegionalLearningCatalogueData['tours'][number]) => {
    if (!terms.length) return null;
    const stepText = tour.steps.map(step => `${step.title} ${step.structureName}`.toLocaleLowerCase());
    const exact = stepText.flatMap((text, index) => terms.every(term => text.includes(term)) ? [index] : []);
    const related = exact.length ? exact : stepText.flatMap((text, index) => terms.some(term => text.includes(term)) ? [index] : []);
    const shown = related.slice(0, 2);
    return <p className="regional-learning-catalogue-match">
      {exact.length ? 'All search terms match within ' : related.length ? 'Search terms span tour details or steps; related ' : 'Search terms match tour details; no single step contains all terms.'}
      {shown.length > 0 && <>{exact.length ? (exact.length === 1 ? 'step: ' : 'steps: ') : 'steps: '}{shown.map((index, position) => <span key={index}>{position > 0 && '; '}{stepLink(tour, index, <>step {index + 1}: {tour.steps[index].title}</>)}{tour.steps[index].structureName && <> · {tour.steps[index].structureName}</>}</span>)}{related.length > shown.length && <> · +{related.length - shown.length} more</>}{!exact.length && <>. No single step contains all terms.</>}</>}
    </p>;
  };

  return <section className="regional-learning-catalogue" aria-label="Regional 3D guided learning tours">
    <h2>Regional 3D tours · Draft</h2>
    <p className="regional-learning-catalogue-intro">Choose a tour, then play continuously or explore one step at a time.</p>
    <details className="regional-learning-catalogue-about" onKeyDown={event => { if (event.key === 'Escape' && event.currentTarget.open) { event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
      <summary>How tours work · draft status</summary>
    <p className="regional-learning-catalogue-instructions">These are draft, region-based 3D Atlas tours. Open a tour, then choose <strong>Play full tour</strong> for continuous playback, or press Start guided tour when ready for step-by-step viewing. If direct entry is unavailable, open its region and choose <strong>Guided learning</strong>. Choose a named step to open it paused at that point. Playback never starts automatically.</p>
    <p className="regional-learning-catalogue-instructions">Region filters also include tours whose framing uses structures from that region. A tour may open in Whole body to keep those relationships visible; its named steps describe what it teaches.</p>
    <p className="regional-learning-catalogue-instructions">Duration estimates use normal-speed continuous playback at 1×. Loading, pauses and extra reading are not included.</p>
    <p className="regional-learning-catalogue-caution">Tour metadata helps you discover lessons; it does not grant access, registration, clinical approval or publication approval. CT, MRI and other imaging are independent.</p>
    </details>
    {catalogue.unavailableTours > 0 && <p className="regional-learning-catalogue-unavailable">{catalogue.unavailableTours} {catalogue.unavailableTours === 1 ? 'tour is' : 'tours are'} unavailable in this source and excluded from match counts.</p>}
    {!catalogue.available ? <p role="status">Regional tours are unavailable for this source revision. No tour links are available.</p> : <>
      {(!fixedQuery || !fixedRegion) && <div className="regional-learning-catalogue-filters">
        {!fixedQuery && <label>Search regional tours<input ref={searchRef} type="search" value={current.query} onChange={event => setQuery(event.target.value)} placeholder="Tour, step or structure" autoComplete="off" /></label>}
        {!fixedRegion && <label>Region<select ref={regionRef} value={current.region} onChange={event => {
          const next = event.target.value;
          if (next === 'all' || catalogue.regions.some(region => region.id === next)) setRegion(next);
        }}><option value="all">All regions</option>{catalogue.regions.map(region => <option key={region.id} value={region.id}>{region.label}</option>)}</select></label>}
        {filtered && <button type="button" onClick={() => { pendingPageFocus.current = null; setFilters({ source: catalogue, query: fixedQuery ? initialQuery : '', region: fixedRegion ? initialRegion : 'all', page: 1 }); if(fixedQuery)regionRef.current?.focus();else searchRef.current?.focus(); }}>{fixedQuery ? 'Clear region' : 'Clear filters'}</button>}
      </div>}
      {pages > 1 && <nav className="regional-learning-catalogue-pages" aria-label="Regional tour pages">{catalogueSearch === undefined ? <button type="button" disabled={page === 1} aria-label={`Previous regional tour page, page ${Math.max(1, page - 1)} of ${pages}`} onClick={event => navigatePage(page - 1, event?.currentTarget)}>Previous</button> : page > 1 ? <a href={pageHref(page - 1)} aria-label={`Previous regional tour page, page ${page - 1} of ${pages}`}>Previous</a> : <span aria-disabled="true">Previous</span>}<span>Page {page} of {pages}</span>{catalogueSearch === undefined ? <button type="button" disabled={page === pages} aria-label={`Next regional tour page, page ${Math.min(pages, page + 1)} of ${pages}`} onClick={event => navigatePage(page + 1, event?.currentTarget)}>Next</button> : page < pages ? <a href={pageHref(page + 1)} aria-label={`Next regional tour page, page ${page + 1} of ${pages}`}>Next</a> : <span aria-disabled="true">Next</span>}</nav>}
      <p id={catalogueSearch !== undefined ? 'regional-tour-results' : undefined} ref={focusPageResult} tabIndex={-1} role="status" className="regional-learning-catalogue-results">{tours.length} matching {tours.length === 1 ? 'tour' : 'tours'} · showing {visible.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, tours.length)} of {tours.length}.</p>
      {visible.length ? <ol className="regional-learning-catalogue-list" start={(page - 1) * PAGE_SIZE + 1}>{visible.map(tour => { const entryHref = regionalTourEntryHref(tour, catalogue.sourceRevision), regionHref = regionalTourRegionHref(tour); return <li key={tour.id}>
        <div className="regional-learning-catalogue-rowhead"><h3>{tour.title}</h3><span>{current.region !== 'all' && tour.regionId !== current.region ? 'Opens in ' : ''}{tour.regionLabel} · {tour.steps.length} {tour.steps.length === 1 ? 'step' : 'steps'}{tourMinutes(tour.continuousPlaybackMs) !== null && <> · About {tourMinutes(tour.continuousPlaybackMs)} min at 1×</>}</span></div>
        <p className="regional-learning-catalogue-description">{tour.description}</p>
        {stepContext(tour)}
        <p className="regional-learning-catalogue-entry">{regionHref ? <><a href={entryHref ?? regionHref} aria-label={entryHref ? `Open tour: ${tour.title}` : `Open ${tour.regionLabel}`}>{entryHref ? 'Open tour' : <>Open {tour.regionLabel}</>}</a><span>{entryHref ? 'Opens paused' : <>Choose Guided learning → {tour.title} → Play full tour.</>}</span></> : <span>This tour destination is unavailable. No alternative tour has been selected.</span>}</p>
        <details onKeyDown={event => { if (event.key === 'Escape' && event.currentTarget.open) { event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}><summary>Tour details and steps</summary><p className="regional-learning-catalogue-full-description">{tour.description}</p><ol>{tour.steps.map((step, index) => <li key={`${index}-${step.title}`}><strong>{stepLink(tour, index, step.title)}</strong>{step.structureName && <> · {step.structureName}</>}</li>)}</ol><p><strong>Limitations:</strong> {tour.limitations || 'No additional limitations are supplied for this draft tour.'}</p><p><strong>Tour revision:</strong> <code>{tour.revision}</code>. This identifies the draft tour and does not indicate sign-off.</p></details>
      </li>; })}</ol> : <p className="regional-learning-catalogue-empty">No regional tours match these filters.{fixedRegion ? '' : ' Clear filters to see all available tours.'}</p>}
      <details className="regional-learning-catalogue-source"><summary>Catalogue source revision</summary><p><code>{catalogue.sourceRevision}</code>. Tour discovery is bound to this source revision; it is not a clinical decision.</p></details>
    </>}
  </section>;
}
