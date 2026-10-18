import type {Metadata} from 'next';
import Link from 'next/link';
import {AtlasWorkspaceNavigation} from '../../../components/AtlasWorkspaceNavigation';
import {HeadAtlasGuidedModel} from '../../../components/HeadAtlasGuidedModel';
import {HeadAtlasLinkedModel} from '../../../components/HeadAtlasLinkedModel';
import {HeadAtlasLearningLibrary} from '../../../components/HeadAtlasLearningLibrary';
import regionalManifest from '../../../public/atlas-runtime/head-neck/manifest.json';
import {atlasStudySuffix} from '../../../lib/atlas-study-transport';
import {headConceptFromAtlasQuery} from '../../../lib/head-atlas-links';
import {parseHeadLearningIntent,hasHeadLearningQuery,headLearningLinks} from '../../../lib/head-atlas-learning';
import {notFound} from 'next/navigation';
import '../shoulder-3d/shoulder-module.css';
import './head-learning.css';

export const metadata:Metadata={title:'Head and neck 3D anatomy — private pilot',description:'Regional anatomy and nested eye, brain, ventricular and vessel dissection with draft teaching.',robots:{index:false,follow:false}};
export default async function HeadNeckModulePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams,suffix=atlasStudySuffix(params);if(suffix===null)notFound();
  const source=`/atlas-runtime/head-neck/index.html?region=head-neck${suffix}`;
  const concept=headConceptFromAtlasQuery(params);
  const intent=parseHeadLearningIntent(params,'atlas');
  const guidedHref=intent?headLearningLinks(intent)?.atlasHref:null;
  if(hasHeadLearningQuery(params)&&(!intent||!concept||intent.conceptId!==concept.conceptId))notFound();
  if(intent&&!guidedHref)notFound();
  const coverage=<>
    <div className="head-atlas-learning-library"><HeadAtlasLearningLibrary/></div>
    <p>{regionalManifest.structures} regional selections and {regionalManifest.nestedSelections} nested selections across eye layers, ventricular spaces, cerebral regions, brainstem and cerebellum, visual pathway, cricothyroid and cranial artery source parts. Rotate, select, isolate, dissect, change separation style and practise identification. These counts do not imply complete anatomy.</p>
    <p>Geometry and teaching remain pending radiologist review. Partial vessels and nerves are not a validated continuous network; numbered source parts are not named clinical segments. This is reference anatomy, not patient-specific anatomy.</p>
    <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licence</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
  </>;
  return <main className={`shoulder-module-page atlas-3d-workspace-page${intent?' head-guided-module-page':''}${!intent?' head-comparison-module-page':''}`}>
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Head &amp; neck anatomy</h1><span>Private pilot · Review pending</span>
      <Link href="/atlas/guided-learning?view=3D" prefetch={false} target="_blank" rel="noopener noreferrer" aria-label="Find guided head tours (opens in a new tab)">Guided learning ↗</Link>
      <Link className="atlas-intended-use-link" href="/intended-use">Education &amp; research only</Link>
      {!intent&&<a href={source} target="_blank" rel="noopener noreferrer">Open full screen ↗</a>}
    </header>
    <AtlasWorkspaceNavigation modality="3d" regionId="head-neck"/>
    {!guidedHref?<HeadAtlasLinkedModel key={source} src={source} sourceRevision={regionalManifest.sourceCommit} coverage={coverage}/>:<HeadAtlasGuidedModel initialHref={guidedHref} sourceRevision={regionalManifest.sourceCommit} coverage={coverage}/>}
  </main>;
}
