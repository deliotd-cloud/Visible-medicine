import {AtlasRuntimeFrame} from '../../../components/AtlasRuntimeFrame';
import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {AtlasWorkspaceNavigation} from '../../../components/AtlasWorkspaceNavigation';
import {HeadAtlasLinkedModel} from '../../../components/HeadAtlasLinkedModel';
import {selectedBodyRegion} from '../../../lib/atlas-navigation';
import {atlasStudySuffix} from '../../../lib/atlas-study-transport';
import {atlasReferenceRevisionCurrent} from '../../../lib/atlas-reference-revision';
import headNeckManifest from '../../../public/atlas-runtime/head-neck/manifest.json';
import '../shoulder-3d/shoulder-module.css';
import '../head-neck-3d/head-learning.css';

export const metadata:Metadata={title:'3D anatomy atlas',description:'Explore whole-body and regional anatomy with source-based dissection and contextual teaching.',robots:{index:false,follow:false}};
export default async function ThreeDAtlas({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams;
  if(!atlasReferenceRevisionCurrent(params,headNeckManifest.sourceCommit))notFound();
  const region=selectedBodyRegion(params.region);
  if(!region)notFound();
  const studySuffix=atlasStudySuffix(params);
  if(studySuffix===null)notFound();
  // A source-bound study must reach the module before identity validation.
  // Plain navigation keeps the established dedicated regional pages.
  if(!studySuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href);
  const source=`/atlas-runtime/head-neck/index.html?region=${region.id}${studySuffix}`;
  // The embedded module deliberately enables the head channel only in head-neck.
  // Other regions must not start a head-only connection that can never succeed.
  const headComparison=region.id==='head-neck';
  const title=`${region.label} 3D anatomy: explore, dissect and practise`;
  const coverage=<>
    <p>{region.structures.toLocaleString('en-GB')} source selections in this view. Rotate, search, isolate, remove layers or choose a separation mechanism. Counts describe retained source selections, not complete human anatomy; held or missing structures are not invented.</p>
    <p>Detailed reference specimens retain separate source coordinate frames. They are not registered to the main body or a patient scan. All teaching and anatomical accuracy await revision-bound clinical review.</p>
    <p>Browse head anatomy in the <Link href="/atlas/ct-head">CT head atlas</Link> or <Link href="/atlas/mri-head">MRI head atlas</Link> using a compatible local atlas folder. These links do not carry the current structure or a spatial registration. CT and MRI are separate, unregistered subjects.</p>
    {headComparison&&<p>Learn this structure follows supported head selections in this model; other structures have no exact acquired-image mapping here.</p>}
    <p>This model remains a separate anatomical reference, not an acquired-scan overlay or validated patient-space registration. Didanix Education/light delivery requires its own source mapping and release checks; Atlas access does not grant access to separately paid imaging cases or lectures.</p>
    <p>BodyParts3D v4 and HRA: CC BY 4.0; independent BodyParts3D v3 back/abdominal-wall assets and specimen-data adaptations: CC BY-SA 2.1 Japan; Universiti Malaya lower-limb models: CC0. Original licensed reuse rights and source notices are retained.</p>
    <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licences</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
  </>;
  return <main className={`shoulder-module-page atlas-3d-workspace-page${headComparison?' head-comparison-module-page':''}`}>
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>{region.label}</h1><span>3D anatomy · education only · review pending</span>
      <Link className="atlas-intended-use-link" href="/intended-use">Education &amp; research only</Link>
      <a href={source} target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasWorkspaceNavigation modality="3d" regionId={region.id}/>
    {headComparison
      ? <HeadAtlasLinkedModel key={region.id} src={source} sourceRevision={headNeckManifest.sourceCommit} title={title} coverage={coverage}/>
      : <>
        <AtlasRuntimeFrame className="shoulder-module-frame" src={source} title={title} referrerPolicy="same-origin" allowFullScreen/>
        <details className="shoulder-module-notes"><summary>Coverage &amp; sources</summary>{coverage}</details>
      </>}
  </main>;
}
