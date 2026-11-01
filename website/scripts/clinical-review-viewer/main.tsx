import { Component, type ReactNode, type ErrorInfo, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '../../atlas-review/app/globals.css';
import { parseWebsiteFdaSelection } from '../../lib/clinical-review-reference-selection';
import './fda-reference-embedded.css';
const FdaShoulder = lazy(() => import('../../atlas-review/app/fda-shoulder-reference'));
const ProstateReviewViewer = lazy(() => import('./prostate-viewer'));
const LegacyReviewViewer = lazy(() => import('./legacy-viewers'));
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }; static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, info: ErrorInfo) { console.error('Review viewer component failure', info.componentStack); }
  render() { return this.state.failed ? <p role="alert">The exact review model could not load. Return to Clinical Review and retry.</p> : this.props.children; }
}
const search = location.search;
const q = new URLSearchParams(search);
const kind = q.get('kind') ?? 'body', region = q.get('region') ?? 'whole-body';
const valid = q.getAll('kind').length === 1 && q.getAll('region').length === 1 && region === 'shoulder';
const params = kind === 'fda-shoulder' ? Object.fromEntries([...new Set(q.keys())].map(k => [k, q.getAll(k).length === 1 ? q.get(k)! : q.getAll(k)])) : {};
const fda = kind === 'fda-shoulder' ? parseWebsiteFdaSelection(params) : null;
createRoot(document.getElementById('root')!).render(<Boundary><Suspense fallback={<p role="status">Loading the review model…</p>}>
  {kind === 'prostate' ? <ProstateReviewViewer search={search} /> : kind === 'fda-shoulder' ? !valid ? <p role="alert">Invalid review model link.</p>
    : fda ? <div className="review-fda"><FdaShoulder assetBase={fda.assetBase} expectedRevision={fda.expectedRevision} selectedId={fda.selectedId} /></div> : <p role="alert">This independent reference link is stale or does not identify an admitted source part. Return to the exact review worksheet; no substitute model was loaded.</p>
    : <LegacyReviewViewer search={search} />}
</Suspense></Boundary>);
