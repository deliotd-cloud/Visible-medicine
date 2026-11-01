'use client';

import { useState, type Ref } from 'react';
import { inboxStatusLabels, type InboxItem } from '../lib/clinical-review-inbox-contract';
import { quickReviewRegionLabel, selectQuickReview, type QuickReviewTrack } from '../lib/clinical-review-quick-start';
import './clinical-review-quick-start.css';

type Props = { items: readonly InboxItem[]; loading: boolean; scanComplete: boolean; preparing?: boolean; filtersActive?: boolean; linkRef?: Ref<HTMLAnchorElement>; headingRef?: Ref<HTMLHeadingElement> };

export function ClinicalReviewQuickStart({ items, loading, scanComplete, preparing = false, filtersActive = false, linkRef, headingRef }: Props) {
  const [track, setTrack] = useState<QuickReviewTrack>('Anatomy');
  const [requestedRegion, setRequestedRegion] = useState<string | null>(null);
  const [requestedGroup, setRequestedGroup] = useState<string | null>(null);
  const region = requestedRegion;
  const group = requestedGroup;
  const selection = selectQuickReview(items, track, region, group, scanComplete);
  const groupOptions = selection.groupOptions;
  const selectedGroup = groupOptions.find(option => option.key === group);
  const item = selection.item;

  return <section className="clinical-review-quick-start" aria-labelledby="clinical-review-quick-start-title" aria-busy={preparing}>
    <div className="clinical-review-quick-start-heading">
      <div><h2 id="clinical-review-quick-start-title" ref={headingRef} tabIndex={-1}>Quick review</h2>
        <p>Review the model or teaching, confirm once, then use Approve &amp; next. Reported issues appear first.{filtersActive && ' Uses the inbox filters above.'}</p></div>
      <span className="clinical-review-quick-start-count" aria-live="polite">
        {preparing ? 'Preparing reviews…' : <>{selection.count} {selection.partial ? 'loaded' : 'total'} matching {selection.count === 1 ? 'worksheet' : 'worksheets'}</>}
      </span>
    </div>
    {!preparing && <div className="clinical-review-quick-start-controls">
      <fieldset><legend>Review track</legend>
        {(['Anatomy', 'Teaching'] as const).map(value =>
          <label key={value}><input type="radio" name="clinical-review-quick-start-track" value={value}
            checked={track === value} onChange={() => { setTrack(value); setRequestedRegion(null); setRequestedGroup(null); }} />{value}</label>)}</fieldset>
      <label className="clinical-review-quick-start-group">Region / source area
        <select aria-label="Region / source area" value={region === null ? '' : region} onChange={event => { setRequestedRegion(event.target.value === '' ? null : event.target.value); setRequestedGroup(null); }}>
          <option value="">All regions</option>
          {region !== null && !selection.regions.some(option => option.id === region) && <option value={region}>{quickReviewRegionLabel(region)}</option>}
          {selection.regions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label className="clinical-review-quick-start-group">Group
        <select value={group === null ? '' : `g:${group}`} onChange={event => setRequestedGroup(event.target.value === '' ? null : event.target.value.slice(2))}>
          <option value="">All groups</option>
          {group !== null && !groupOptions.some(option => option.key === group) && <option value={`g:${group}`}>Group no longer loaded · {group || 'Unspecified group'}</option>}
          {groupOptions.map(option => <option key={option.key} value={`g:${option.key}`} title={option.key || 'Unspecified group'}>{option.label}</option>)}
        </select>
      </label>
    </div>}
    {selectedGroup && selectedGroup.titles.length > 2 && <details key={`${track}:${group}`} className="clinical-review-quick-start-names">
      <summary>All {selectedGroup.titles.length} loaded structure names in this group</summary>
      <p>Names reflect the currently loaded matching worksheets.</p>
      <div className="clinical-review-quick-start-names-list" role="region" aria-label="Loaded structure names in the selected group" tabIndex={0}>
        <ul>{selectedGroup.titles.map(title => <li key={title}>{title}</li>)}</ul>
      </div>
    </details>}
    {item ? <div className="clinical-review-quick-start-result">
      <div><strong>{item.title}</strong><span>{item.scopeLabel} · {item.trackLabel} · {inboxStatusLabels[item.status]}</span>
        {item.status === 're-review' && item.changeReason === 'source-or-teaching' && <small>Source or teaching changed</small>}
        {item.status === 're-review' && item.changeReason === 'other-review-material' && <small>Other review material changed</small>}
        {item.status === 're-review' && item.changeReason === 'viewer-only' && <small>Viewer update; check the worksheet</small>}
        {item.status === 're-review' && item.changeReason === 'unavailable' && <small>Change details unavailable; check the worksheet</small>}
      </div>
      <a ref={linkRef} href={item.href} target="_blank" rel="noopener noreferrer"
        aria-label={`${item.status === 'in-progress' ? 'Continue' : 'Start'} review of ${item.title}, ${item.scopeLabel}, ${item.trackLabel} (opens in a new tab)`}>
        {item.status === 'in-progress' ? 'Continue review' : 'Start review'} <span aria-hidden="true">↗</span>
      </a>
    </div> : <p className="clinical-review-quick-start-empty">
      {preparing ? 'Reviews load automatically. You can start as soon as the first worksheets appear.' : loading ? 'Scanning for matching worksheets…' : selection.partial
        ? 'No matching worksheet loaded yet. The scan is incomplete.'
        : filtersActive ? 'No anatomy or teaching worksheets match these filters and this Quick review selection. Try changing either.'
        : 'No matching worksheets need review in this group.'}
    </p>}
    {selection.partial && item && <p className="clinical-review-quick-start-note">The scan is incomplete; this count and suggestion cover loaded worksheets only.</p>}
  </section>;
}



