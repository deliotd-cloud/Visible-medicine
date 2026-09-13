import {Component,lazy,Suspense,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import '../../app/globals.css';
import BodyExplorer from '../../app/body-explorer';
import {parseStudyLink,type StudySearchParams} from '../../lib/study-links';
import {parseRegionalModule} from './regions';
import {parseContainedSpecimen} from './specimen-route';
const AbdominalWall=lazy(()=>import('../../app/abdominal-wall-study'));
const Kidneys=lazy(()=>import('../../app/hra-renal-study'));
import './panel-host.css';
class ModuleBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? <section className="module-recovery" role="alert"><h2>Regional anatomy could not load</h2><p>Your place on the website is unchanged.</p><button onClick={()=>window.location.reload()}>Reload anatomy</button></section> : this.props.children;}
}
// Keep duplicate fields as arrays so the existing strict parser rejects them.
const query=new URLSearchParams(window.location.search);
const region=parseRegionalModule(query);
const params:StudySearchParams=Object.fromEntries([...new Set(query.keys())].map(key=>{
  const values=query.getAll(key);return [key,values.length===1?values[0]:values];
}));
const specimen=parseContainedSpecimen(params,region);
const backToAbdomen=()=>window.location.assign('/atlas-runtime/head-neck/index.html?region=abdomen');
createRoot(document.getElementById('root')!).render(
  <ModuleBoundary>{region && specimen.status!=='invalid'
    ? specimen.status==='ready'
      ? <Suspense fallback={<p role="status">Loading the separate source specimen…</p>}>
          {specimen.kind==='kidneys'
            ? <Kidneys assetBase="/atlas-runtime/head-neck" initialLink={specimen.link} onClose={backToAbdomen}/>
            : <AbdominalWall assetBase="/atlas-runtime/head-neck" initialLink={specimen.link} onClose={backToAbdomen}/>}
        </Suspense>
      : <BodyExplorer initialRegion={region} studyLink={parseStudyLink(params)} presentation="panel" assetBase="/atlas-runtime/head-neck"/>
    : <section className="module-recovery" role="alert"><h2>This region link cannot be opened</h2><p>No alternative region or structure has been selected.</p><a href="/atlas" target="_top">Return to the Atlas</a></section>}
  </ModuleBoundary>
);
