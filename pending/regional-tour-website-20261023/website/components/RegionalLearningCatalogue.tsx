'use client';

import { useRef, useState } from 'react';
import type { RegionalLearningCatalogueData } from '../lib/regional-learning-discovery';
import { regionalTourEntryHref, regionalTourRegionHref } from '../lib/regional-tour-entry-navigation';
import './regional-learning-catalogue.css';

const PAGE_SIZE = 6;
type Filters = { source: RegionalLearningCatalogueData; query: string; region: string; page: number };

export function RegionalLearningCatalogue({ catalogue, initialQuery = '', fixedQuery = false, initialRegion = 'all', fixedRegion = false }: { catalogue: RegionalLearningCatalogueData; initialQuery?: string; fixedQuery?: boolean; initialRegion?: string; fixedRegion?: boolean }) {
  const [filters, setFilters] = useState<Filters>(() => ({ source: catalogue, query: initialQuery, region: initialRegion, page: 1 }));
  const searchRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);
  // A new server snapshot must not inherit a page or filter from the previous source.
  const current = filters.source === catalogue ? filters : { source: catalogue, query: initialQuery, region: initialRegion, page: 1 };
  if (current !== filters) setFilters(current);

  const terms = current.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const tours = catalogue.available ? catalogue.tours.filter(tour => {
    if (current.region !== 'all' && tour.regionId !== current.region) return false;
    const searchable = [tour.title, tour.description, ...tour.steps.flatMap(step => [step.title, step.structureName])].join(' ').toLocaleLowerCase();
    return terms.every(term => searchable.includes(term));
  }) : [];
  const pages = Math.max(1, Math.ceil(tours.length / PAGE_SIZE));
  const page = Math.min(current.page, pages);
  const visible = tours.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = (!fixedQuery && current.query.trim() !== '') || (!fixedRegion && current.region !== 'all');
  const setQuery = (query: string) => setFilters({ source: catalogue, query, region: current.region, page: 1 });
  const setRegion = (region: string) => setFilters({ source: catalogue, query: current.query, region, page: 1 });

  return <section className="regional-learning-catalogue" aria-label="Regional 3D guided learning tours">
    <h2>Regional 3D tours · Draft</h2>
    <p className="regional-learning-catalogue-intro">These are draft, region-based 3D Atlas tours. Open a tour, then press <strong>Start</strong> when ready. If direct entry is unavailable, open its region and choose <strong>Guided learning</strong>. Playback never starts automatically.</p>
    <p className="regional-learning-catalogue-caution">Tour metadata helps you discover lessons; it does not grant access, registration, clinical approval or publication approval. CT, MRI and other imaging are independent.</p>
    {catalogue.unavailableTours > 0 && <p className="regional-learning-catalogue-unavailable">{catalogue.unavailableTours} {catalogue.unavailableTours === 1 ? 'tour is' : 'tours are'} unavailable in this source and excluded from match counts.</p>}
    {!catalogue.available ? <p role="status">Regional tours are unavailable for this source revision. No tour links are available.</p> : <>
      {(!fixedQuery || !fixedRegion) && <div className="regional-learning-catalogue-filters">
        {!fixedQuery && <label>Search regional tours<input ref={searchRef} type="search" value={current.query} onChange={event => setQuery(event.target.value)} placeholder="Tour, step or structure" autoComplete="off" /></label>}
        {!fixedRegion && <label>Region<select ref={regionRef} value={current.region} onChange={event => {
          const next = event.target.value;
          if (next === 'all' || catalogue.regions.some(region => region.id === next)) setRegion(next);
        }}><option value="all">All regions</option>{catalogue.regions.map(region => <option key={region.id} value={region.id}>{region.label}</option>)}</select></label>}
        {filtered && <button type="button" onClick={() => { setFilters({ source: catalogue, query: fixedQuery ? initialQuery : '', region: fixedRegion ? initialRegion : 'all', page: 1 }); if(fixedQuery)regionRef.current?.focus();else searchRef.current?.focus(); }}>{fixedQuery ? 'Clear region' : 'Clear filters'}</button>}
      </div>}
      <p role="status" className="regional-learning-catalogue-results">{tours.length} matching {tours.length === 1 ? 'tour' : 'tours'} · showing {visible.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, tours.length)} of {tours.length}.</p>
      {visible.length ? <ol className="regional-learning-catalogue-list" start={(page - 1) * PAGE_SIZE + 1}>{visible.map(tour => { const entryHref = regionalTourEntryHref(tour, catalogue.sourceRevision), regionHref = regionalTourRegionHref(tour); return <li key={tour.id}>
        <div className="regional-learning-catalogue-rowhead"><h3>{tour.title}</h3><span>{tour.regionLabel} · {tour.steps.length} {tour.steps.length === 1 ? 'step' : 'steps'}</span></div>
        <p className="regional-learning-catalogue-description">{tour.description}</p>
        <p className="regional-learning-catalogue-entry">{regionHref ? <><a href={entryHref ?? regionHref} aria-label={entryHref ? `Open tour: ${tour.title}` : `Open ${tour.regionLabel}`}>{entryHref ? 'Open tour' : <>Open {tour.regionLabel}</>}</a><span>{entryHref ? 'Tour selected on opening · press Start when ready.' : <>Choose Guided learning → {tour.title} → Start.</>}</span></> : <span>This tour destination is unavailable. No alternative tour has been selected.</span>}</p>
        <details><summary>View ordered steps</summary><ol>{tour.steps.map((step, index) => <li key={`${index}-${step.title}`}><strong>{step.title}</strong>{step.structureName && <> · {step.structureName}</>}</li>)}</ol></details>
        <details><summary>Limitations</summary><p>{tour.limitations || 'No additional limitations are supplied for this draft tour.'}</p></details>
        <details><summary>Tour revision</summary><p><code>{tour.revision}</code>. This identifies the draft tour and does not indicate sign-off.</p></details>
      </li>; })}</ol> : <p className="regional-learning-catalogue-empty">No regional tours match these filters.{fixedRegion ? '' : ' Clear filters to see all available tours.'}</p>}
      {pages > 1 && <nav className="regional-learning-catalogue-pages" aria-label="Regional tour pages"><button type="button" disabled={page === 1} onClick={() => setFilters({ ...current, page: page - 1 })}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setFilters({ ...current, page: page + 1 })}>Next</button></nav>}
      <details className="regional-learning-catalogue-source"><summary>Catalogue source revision</summary><p><code>{catalogue.sourceRevision}</code>. Tour discovery is bound to this source revision; it is not a clinical decision.</p></details>
    </>}
  </section>;
}
