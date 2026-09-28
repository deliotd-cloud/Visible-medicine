import { Component, type ReactNode, type ErrorInfo, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '../../atlas-review/app/globals.css';
import BodyExplorer from '../../atlas-review/app/body-explorer';
import { parseStudyLink } from '../../atlas-review/lib/study-links';
import { parseIndependentStudyLink } from '../../atlas-review/lib/independent-study-links';
import { parseSpecimenLink } from '../../atlas-review/lib/specimen-links';
import { dissectionProfiles } from '../../atlas-review/app/dissection-data';
import { closeReviewModel } from './review-return';
const Shoulder = lazy(() => import('../../atlas-review/app/shoulder-explorer'));
const Kidneys = lazy(() => import('../../atlas-review/app/hra-renal-study'));
const Pelvis = lazy(() => import('../../atlas-review/app/hra-pelvis-study'));
const Back = lazy(() => import('../../atlas-review/app/back-layers-study'));
const Abdomen = lazy(() => import('../../atlas-review/app/abdominal-wall-study'));
const Limb = lazy(() => import('../../atlas-review/app/um-limb-study'));
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }; static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, info: ErrorInfo) { console.error('Review viewer component failure', info.componentStack); }
  render() { return this.state.failed ? <p role="alert">The exact review model could not load. Return to Clinical Review and retry.</p> : this.props.children; }
}
const q = new URLSearchParams(location.search);
const params = Object.fromEntries([...new Set(q.keys())].map(k => [k, q.getAll(k).length === 1 ? q.get(k)! : q.getAll(k)]));
const kind = q.get('kind') ?? 'body', region = q.get('region') ?? 'whole-body';
const base = '/atlas-runtime/head-neck';
const close = closeReviewModel;
const viewers = { kidneys: Kidneys, 'female-pelvis': Pelvis, 'back-layers': Back, 'abdominal-wall': Abdomen };
const Viewer = viewers[kind as keyof typeof viewers];
const valid = q.getAll('kind').length === 1 && q.getAll('region').length === 1 && Object.hasOwn(dissectionProfiles, region);
createRoot(document.getElementById('root')!).render(<Boundary><Suspense fallback={<p role="status">Loading the review model…</p>}>
  {!valid ? <p role="alert">Invalid review model link.</p> : kind === 'body' ? <BodyExplorer initialRegion={region} studyLink={parseStudyLink(params)} assetBase={base} presentation="panel" embedded />
    : kind === 'shoulder' ? <Shoulder initialSelectedId={q.get('structure') ?? undefined} assetBase="/atlas-runtime/shoulder" presentation="panel" />
    : kind === 'lower-limb' ? <Limb assetBase={base} initialRegion={region} initialLink={parseSpecimenLink(params)} onClose={close} />
    : Viewer ? <Viewer assetBase={base} initialLink={parseIndependentStudyLink(params)} onClose={close} />
    : <p role="alert">Unknown review model.</p>}
</Suspense></Boundary>);
