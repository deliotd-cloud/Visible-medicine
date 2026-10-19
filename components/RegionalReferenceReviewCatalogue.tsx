'use client';

import {useRef, useState} from 'react';
import {parseRegionalReferenceReviewIndex, regionalReferenceRelationLabels, type RegionalReferenceReviewIndex} from '../lib/regional-reference-review-index-contract';
import './regional-reference-review-catalogue.css';

const PAGE_SIZE = 12;
type Filters = {source: unknown; query: string; kind: string; side: string; relation: string; page: number};
const fresh = (source: unknown): Filters => ({source, query: '', kind: 'all', side: 'all', relation: 'all', page: 1});

export function RegionalReferenceReviewCatalogue({index}: {index: RegionalReferenceReviewIndex | unknown}) {
  const [filters, setFilters] = useState<Filters>(() => fresh(index));
  const searchRef = useRef<HTMLInputElement>(null);
  // A replacement server projection cannot inherit a page or filters from the old source.
  const current = filters.source === index ? filters : fresh(index);
  if (current !== filters) setFilters(current);
  const snapshot = parseRegionalReferenceReviewIndex(index);

  if (!snapshot) return <section className="regional-reference-review-catalogue" aria-label="Reference teaching draft catalogue">
    <h2>Reference teaching · Draft packets</h2>
    <p role="status">The reference teaching catalogue is unavailable because its source index is invalid. No draft links are available.</p>
  </section>;

  const terms = current.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matching = snapshot.rows.filter(row => {
    if (current.kind !== 'all' && row.kind !== current.kind) return false;
    if (current.side !== 'all' && row.side !== current.side) return false;
    if (current.relation !== 'all' && row.relation !== current.relation) return false;
    const searchable = [row.label, row.id, row.kind, row.side, regionalReferenceRelationLabels[row.relation]].join(' ').toLocaleLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(current.page, pages);
  const visible = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = current.query.trim() !== '' || current.kind !== 'all' || current.side !== 'all' || current.relation !== 'all';
  const change = (patch: Partial<Filters>) => setFilters({...current, ...patch, source: index, page: 1});

  return <section className="regional-reference-review-catalogue" aria-label="Reference teaching draft catalogue">
    <h2>Reference teaching · Draft packets</h2>
    <p className="regional-reference-review-catalogue-intro">Browse independent Atlas reference teaching drafts. Source side may differ from an MRI selection; these references are not mirrored, registered to a scan, or evidence of an MRI annotation.</p>
    <p className="regional-reference-review-catalogue-scope">{snapshot.rows.length} reference draft {snapshot.rows.length === 1 ? 'packet' : 'packets'} in this source. This is a source total, not a count of MRI annotations, approved items, completed teaching, or saved notes.</p>
    <div className="regional-reference-review-catalogue-filters">
      <label>Search references<input ref={searchRef} type="search" maxLength={160} value={current.query} onChange={event => change({query: event.target.value})} placeholder="Name, ID, source, side, relationship" autoComplete="off" /></label>
      <label>Source<select value={current.kind} onChange={event => change({kind: event.target.value})}><option value="all">All sources</option><option value="body">Body</option><option value="specimen">Specimen</option></select></label>
      <label>Side<select value={current.side} onChange={event => change({side: event.target.value})}><option value="all">Both sides</option><option value="left">Left</option><option value="right">Right</option></select></label>
      <label>Reference relationship<select value={current.relation} onChange={event => change({relation: event.target.value})}><option value="all">All relationships</option><option value="same-structure">Same structure</option><option value="parent-reference">Whole parent</option><option value="group-reference">Grouped reference</option></select></label>
      {filtered && <button type="button" onClick={() => {setFilters(fresh(index)); searchRef.current?.focus();}}>Reset filters</button>}
    </div>
    <p className="regional-reference-review-catalogue-results" role="status">{matching.length} matching reference draft {matching.length === 1 ? 'packet' : 'packets'} · showing {visible.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, matching.length)} of {matching.length}.</p>
    {visible.length ? <ol className="regional-reference-review-catalogue-list" start={(page - 1) * PAGE_SIZE + 1}>{visible.map(row => <li key={row.key}>
      <div className="regional-reference-review-catalogue-name"><strong>{row.label}</strong><code>{row.id}</code></div>
      <span className="regional-reference-review-catalogue-origin">{row.kind === 'body' ? 'Body' : 'Specimen'} · {row.side}</span>
      <span className="regional-reference-review-catalogue-relation">{regionalReferenceRelationLabels[row.relation]}</span>
      {row.pendingTopics > 0 && <span className="regional-reference-review-catalogue-pending">{row.pendingTopics} {row.pendingTopics === 1 ? 'topic' : 'topics'} pending</span>}
      <a href={row.href} aria-label={`Open ${row.label}, ${row.side}, ${regionalReferenceRelationLabels[row.relation]} teaching draft`}>Open draft</a>
    </li>)}</ol> : <p className="regional-reference-review-catalogue-empty">{snapshot.rows.length ? 'No reference draft packets match these filters. Reset filters to see the source.' : 'No reference draft packets are available for this source revision.'}</p>}
    {pages > 1 && <nav className="regional-reference-review-catalogue-pages" aria-label="Reference draft pages"><button type="button" disabled={page === 1} onClick={() => setFilters({...current, page: page - 1})}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setFilters({...current, page: page + 1})}>Next</button></nav>}
    <details className="regional-reference-review-catalogue-revisions"><summary>Exact source revisions and scope</summary><p>Atlas <code>{snapshot.atlasRevision}</code> · mapping <code>{snapshot.mappingRevision}</code>. Opened packets have their own exact teaching revision. Whole-parent and grouped references describe teaching relationships, not a live structure match. Drafts require separate revision-bound radiologist review; this catalogue grants no clinical or publication approval.</p></details>
  </section>;
}
