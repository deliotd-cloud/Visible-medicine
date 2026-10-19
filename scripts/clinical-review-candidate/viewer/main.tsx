import {Component, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import '../../../atlas-review/app/globals.css';
import BodyExplorer from '../../../atlas-review/app/body-explorer';
import {parseStudyLink} from '../../../atlas-review/lib/study-links';
import {dissectionProfiles} from '../../../atlas-review/app/dissection-data';

class InspectionBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="alert">This saved model could not load. No current model was substituted. Return to the inspection worksheet.</p>:this.props.children;}
}
const query=new URLSearchParams(location.search);
const region=query.get('region')??'';
const allowed=new Set(['kind','region','study','structure','side','source','focus']);
const valid=[...query.keys()].every(key=>allowed.has(key)&&query.getAll(key).length===1)
  &&query.get('kind')==='body'&&Object.hasOwn(dissectionProfiles,region);
const study=parseStudyLink(Object.fromEntries(query));
// The candidate transport adapter accepts only this exact private route shape.
// Never point an old renderer at the current public catalog/model paths.
const assetBase=new URL('../models/head-neck',location.href).pathname;
createRoot(document.getElementById('root')!).render(<InspectionBoundary>
  {valid&&study.status==='requested'?<BodyExplorer initialRegion={region} studyLink={study}
    assetBase={assetBase} presentation="panel" embedded/>:<p role="alert">Invalid saved inspection link.</p>}
</InspectionBoundary>);
