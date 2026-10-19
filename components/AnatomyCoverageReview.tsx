import { coverageRegions, type CoverageRegion, type CoverageView } from '../lib/anatomy-coverage-view';
import './anatomy-coverage-review.css';

const stateLabels = {
  missing: 'Missing',
  held: 'Held',
  partial: 'Partial',
  'not-yet-inventoried': 'Not inventoried',
} as const;

const regionEntries = Object.entries(coverageRegions) as [CoverageRegion, string][];

/** Read-only, source-bound inventory summary for the authorized Review workspace. */
export function AnatomyCoverageReview({ view, region }: { view: CoverageView; region: CoverageRegion | null }) {
  const targets = region === null ? view.targets : view.targets.filter(target => target.regions.includes(region));

  return <main className="anatomy-coverage-review">
    <header className="anatomy-coverage-review-header">
      <a href="/workspace/clinical-review-inbox" className="anatomy-coverage-review-back">← Clinical Review inbox</a>
      <p className="anatomy-coverage-review-eyebrow">Atlas inventory</p>
      <h1>Anatomy coverage and gaps</h1>
      <p>Source-bound inventory of representations and documented gaps. These seven targets are a starting point, not an exhaustive curriculum. This inventory does not establish clinical approval or patient-space registration.</p>
    </header>

    <section aria-labelledby="coverage-counts-heading" className="anatomy-coverage-review-counts-section">
      <h2 id="coverage-counts-heading">Inventoried scopes · all regions</h2>
      <div className="anatomy-coverage-review-counts">
        <div><strong>{view.counts.root.toLocaleString('en-GB')}</strong><span>Root representations</span></div>
        <div><strong>{view.counts.nested.toLocaleString('en-GB')}</strong><span>Nested selections</span></div>
        <div><strong>{view.counts.specimenViews.toLocaleString('en-GB')}</strong><span>Independent specimen views</span></div>
        <div><strong>{view.counts.shoulder.toLocaleString('en-GB')}</strong><span>Dedicated shoulder selections</span></div>
      </div>
      <p className="anatomy-coverage-review-scope-note">These are distinct, overlapping units across separate scopes. They cannot be added into a unique anatomy total or a completion percentage.</p>
      <details className="anatomy-coverage-review-details">
        <summary>Specimen selection units</summary>
        <p>{view.counts.specimenMemberships.toLocaleString('en-GB')} view memberships and {view.counts.specimenSelections.toLocaleString('en-GB')} frame-qualified selections; a membership is not a unique structure.</p>
      </details>
    </section>

    <section aria-labelledby="coverage-targets-heading" className="anatomy-coverage-review-targets-section">
      <div className="anatomy-coverage-review-section-heading">
        <h2 id="coverage-targets-heading">Documented targets</h2>
        <span>{region === null ? 'All regions' : coverageRegions[region]} · {targets.length} shown</span>
      </div>
      <form className="anatomy-coverage-review-filter" method="get" action="/workspace/atlas-review/anatomy-coverage">
        <label htmlFor="coverage-region">Filter documented targets by region</label>
        <select id="coverage-region" name="region" defaultValue={region ?? ''}>
          <option value="">All regions</option>
          {regionEntries.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="submit">Apply filter</button>
      </form>
      {targets.length === 0 ? <p className="anatomy-coverage-review-empty">No documented targets match this region in this snapshot. This does not establish complete coverage.</p> :
        <ul className="anatomy-coverage-review-targets">
          {targets.map(target => <li key={target.id}>
            <div className="anatomy-coverage-review-target-heading">
              <h3>{target.label}</h3>
              <span className={`anatomy-coverage-review-status status-${target.state}`}>{stateLabels[target.state]}</span>
            </div>
            <p>{target.reason}</p>
            <details className="anatomy-coverage-review-details">
              <summary>Provenance and regional scope</summary>
              <p>Documented for {target.regions.map(value => coverageRegions[value]).join(', ')} in Atlas source revision <code>{view.sourceRevision}</code>.</p>
            </details>
          </li>)}
        </ul>}
    </section>

    <details className="anatomy-coverage-review-backlog anatomy-coverage-review-details">
      <summary>Reference backlog · separate file inventory</summary>
      <p>{view.reference.files.toLocaleString('en-GB')} reference files; {view.reference.differences.toLocaleString('en-GB')} current-root differences. The difference categories are {view.reference.nested.toLocaleString('en-GB')} reachable nested, {view.reference.corrected.toLocaleString('en-GB')} reviewed corrections or overlaps, {view.reference.held.toLocaleString('en-GB')} held for source condition or identity, and {view.reference.unsupported.toLocaleString('en-GB')} unsupported by current evidence.</p>
      <p>These are file and difference counts, not missing structure counts. Original OBJ bytes were not revalidated by this inventory.</p>
    </details>

    <details className="anatomy-coverage-review-snapshot anatomy-coverage-review-details">
      <summary>Snapshot provenance</summary>
      <p>Atlas source revision: <code>{view.sourceRevision}</code>. Inventory snapshot SHA-256: <code>{view.inventoryRevision}</code>. This read-only view contains no clinical decisions.</p>
      <p>The exact snapshot and its imported source dependencies are checked here. Source-only metadata inputs are verified by the separate source-inventory checker; original mesh bytes are not revalidated by this page.</p>
    </details>
  </main>;
}
