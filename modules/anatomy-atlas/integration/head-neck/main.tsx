import {Component,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import '../../app/globals.css';
import BodyExplorer from '../../app/body-explorer';
import {parseStudyLink,type StudySearchParams} from '../../lib/study-links';
import './panel-host.css';
class ModuleBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? <section className="module-recovery" role="alert"><h2>Head and neck anatomy could not load</h2><p>Your place on the website is unchanged.</p><button onClick={()=>window.location.reload()}>Reload anatomy</button></section> : this.props.children;}
}
// Keep duplicate fields as arrays so the existing strict parser rejects them.
const query=new URLSearchParams(window.location.search);
const params:StudySearchParams=Object.fromEntries([...new Set(query.keys())].map(key=>{
  const values=query.getAll(key);return [key,values.length===1?values[0]:values];
}));
createRoot(document.getElementById('root')!).render(
  <ModuleBoundary><BodyExplorer initialRegion="head-neck" studyLink={parseStudyLink(params)} presentation="panel" assetBase="/atlas-runtime/head-neck"/></ModuleBoundary>
);

