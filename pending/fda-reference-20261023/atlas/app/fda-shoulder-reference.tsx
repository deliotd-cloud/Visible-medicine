'use client';
import {Component,useEffect,useId,useRef,useState,type ReactNode,type ComponentRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {Box3,Vector3,DoubleSide,type MeshStandardMaterial} from 'three';
import {loadFdaReference,type FdaReferenceModel} from '../lib/fda-reference-model-loader';
import {filterFdaReference,fdaReferenceCatalogueSha256,fdaReferenceSourceNotice} from '../lib/fda-shoulder-reference';
import './fda-shoulder-reference.css';

type Visibility='all'|'fade'|'isolate';
type Props={assetBase?:string;expectedRevision?:string;selectedId?:string;onSelect?:(id:string)=>void};
const colors={bone:'#e8ddc7',cartilage:'#7ac8d0',labrum:'#cd778b',ligament:'#e6b96e'};
class SceneError extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<p role="alert">The 3D view could not start. Use the structure list or reload this draft; no alternative geometry was loaded.</p>:this.props.children;}
}
function ReferenceScene({model,selected,visibility,frame,onSelect}:{model:FdaReferenceModel;selected:string|null;visibility:Visibility;frame:number;onSelect:(id:string)=>void}){
 const {camera}=useThree(),controls=useRef<ComponentRef<typeof OrbitControls>>(null);
 const goal=useRef<{position:Vector3;target:Vector3}|null>(null);
 useEffect(()=>{
  const entries=visibility==='isolate'&&selected?model.meshes.filter(m=>m.structure.id===selected):model.meshes;
  const box=new Box3();for(const m of entries)box.union(new Box3(new Vector3(...m.structure.bounds.min),new Vector3(...m.structure.bounds.max)));
  const target=box.getCenter(new Vector3()),radius=Math.max(box.getSize(new Vector3()).length()/2,.1);
  goal.current={target,position:target.clone().add(new Vector3(1.6,-2.2,.8).normalize().multiplyScalar(radius*2.8))};
 },[model,selected,visibility,frame]);
 useFrame((_,delta)=>{
  const g=goal.current,c=controls.current;if(!g||!c)return;
  const alpha=1-Math.exp(-5*Math.min(delta,.05));camera.position.lerp(g.position,alpha);c.target.lerp(g.target,alpha);c.update();
  if(camera.position.distanceTo(g.position)<.002&&c.target.distanceTo(g.target)<.002)goal.current=null;
 });
 return <>
  <color attach="background" args={['#092630']}/>
  <hemisphereLight args={['#e8f5ff','#273d40',2.3]}/>
  <directionalLight position={[4,6,10]} intensity={3.2}/><directionalLight position={[-6,-8,4]} color="#87b8d8" intensity={1.3}/>
  {model.meshes.map(({structure,geometry})=>{
   if(visibility==='isolate'&&selected&&structure.id!==selected)return null;
   const active=structure.id===selected,faded=!!selected&&visibility==='fade'&&!active;
   return <ReferencePart key={structure.id} entry={{structure,geometry}} active={active} faded={faded} onSelect={onSelect}/>;
  })}
  <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.075} minDistance={.3} maxDistance={55}
   onStart={()=>{goal.current=null;}}/>
 </>;
}
function ReferencePart({entry,active,faded,onSelect}:{entry:FdaReferenceModel['meshes'][number];active:boolean;faded:boolean;onSelect:(id:string)=>void}){
 const material=useRef<MeshStandardMaterial>(null);
 // The model loader owns geometry; the component owns its display material.
 useEffect(()=>{const owned=material.current;return ()=>owned?.dispose();},[]);
 return <mesh geometry={entry.geometry} dispose={null} renderOrder={faded?1:0} onClick={event=>{event.stopPropagation();onSelect(entry.structure.id);}}>
  <meshStandardMaterial ref={material} color={colors[entry.structure.tissue]} roughness={.62} metalness={0} side={DoubleSide}
   emissive={active?'#236875':'#000000'} emissiveIntensity={active?.22:0} transparent={faded} opacity={faded?.14:1} depthWrite={!faded}/>
 </mesh>;
}
/** Source-scoped review draft. Not an installed learner route or a metric/anatomical frame. */
export default function FdaShoulderReference({assetBase='',expectedRevision=fdaReferenceCatalogueSha256,selectedId,onSelect}:Props){
 const id=useId(),[retry,setRetry]=useState(0),[loaded,setLoaded]=useState<{key:string;model:FdaReferenceModel}|null>(null),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[selected,setSelected]=useState<string|null>(selectedId??null),[visibility,setVisibility]=useState<Visibility>('all'),[frame,setFrame]=useState(0);
 const key=assetBase+'|'+expectedRevision+'|'+retry,model=loaded?.key===key?loaded.model:null;
 useEffect(()=>{
  let current=true,owned:FdaReferenceModel|undefined;const controller=new AbortController();setError('');setLoaded(null);
  loadFdaReference({assetBase,expectedRevision,signal:controller.signal}).then(value=>{
   if(!current){value.dispose();return;}owned=value;setLoaded({key,model:value});
  }).catch(reason=>{if(current&&reason?.name!=='AbortError')setError(reason instanceof Error?reason.message:'Reference loading failed');});
  return ()=>{current=false;controller.abort();owned?.dispose();};
 },[assetBase,expectedRevision,key]);
 useEffect(()=>{setSelected(selectedId??null);setVisibility('all');},[selectedId,key]);
 const catalogue=model?.catalogue,structure=catalogue?.structures.find(s=>s.id===selected);
 const invalidSelection=!!selected&&!!catalogue&&!structure;
 const select=(value:string)=>{setSelected(value);onSelect?.(value);};
 const reset=()=>{setSelected(null);setVisibility('all');setQuery('');setFrame(n=>n+1);};
 return <section className="fda-reference" aria-label="Independent shoulder reference draft">
  <header className="fda-reference-heading"><div><span className="fda-reference-eyebrow">VISIBLE MEDICINE · SOURCE REFERENCE</span><h1>Inside the shoulder</h1><p>A separate donor assembly, not a replacement for the whole-body Atlas.</p></div><span className="fda-reference-badge">Unvalidated draft</span></header>
  <div className="fda-reference-grid">
   <aside className="fda-reference-parts" aria-label="Source structures">
    <label htmlFor={id+'search'}>Find a structure</label><input id={id+'search'} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name or source ID"/>
    <p className="fda-reference-muted">{catalogue?'6 source parts · 1 held':error?'Source not loaded':'Verifying source files…'}</p>
    <div className="fda-reference-list">{catalogue&&filterFdaReference(catalogue,query).map(s=><button type="button" key={s.id} aria-pressed={s.id===selected} onClick={()=>select(s.id)}><span className="fda-reference-dot" style={{background:colors[s.tissue]}}/><span>{s.name}<small>{s.tissue}{s.sourcePart==='Hcart'?' · constructed':''}</small></span></button>)}</div>
    {catalogue&&filterFdaReference(catalogue,query).length===0&&<p role="status">No matching admitted part.</p>}
    <details className="fda-reference-hold"><summary>Why one part is held</summary><p>Constructed glenoid cartilage (Gcart) has two nonmanifold edges and three affected source vertices. It is not included in this viewer. No automatic repair was applied.</p></details>
   </aside>
   <main className="fda-reference-main">
    <div className="fda-reference-toolbar" role="group" aria-label="Inspection controls">
     <div role="group" aria-label="Other structures">{(['all','fade','isolate'] as const).map(mode=><button type="button" key={mode} aria-pressed={visibility===mode} disabled={mode!=='all'&&!structure} onClick={()=>setVisibility(mode)}>{mode==='all'?'Show all':mode==='fade'?'Fade others':'Isolate'}</button>)}</div>
     <button type="button" onClick={()=>setFrame(n=>n+1)} disabled={!model||invalidSelection}>Frame view</button><button type="button" onClick={reset}>Reset</button>
    </div>
    <div className="fda-reference-canvas" aria-label="Rotatable shoulder source assembly">
     {!model&&!error&&<p role="status">Checking source and geometry checksums…</p>}
     {error&&<div role="alert"><p>{error}</p><p>No substitute model was loaded.</p><button type="button" onClick={()=>setRetry(n=>n+1)}>Retry verified source</button></div>}
     {invalidSelection&&<div role="alert"><p>This structure ID does not belong to the admitted source revision.</p><button type="button" onClick={reset}>Show the source assembly</button></div>}
     {model&&!invalidSelection&&<SceneError key={key}><Canvas camera={{position:[10,-14,6],up:[0,0,1],fov:36,near:.01,far:200}} dpr={[1,2]} aria-label="Shoulder model: drag to rotate, scroll to zoom; use the structure list for keyboard selection">
      <ReferenceScene model={model} selected={selected} visibility={visibility} frame={frame} onSelect={select}/>
     </Canvas></SceneError>}
     <span className="fda-reference-canvas-caption">Free rotation · unitless source coordinates · no anatomical orientation presets</span>
    </div>
    <footer className="fda-reference-help">Drag to rotate · scroll to zoom · select a surface or use the list. Physical measurements and CT/MRI synchronization are disabled.</footer>
   </main>
   <aside className="fda-reference-info" aria-label="Structure information">
    <span className="fda-reference-eyebrow">{structure?'SELECTED SOURCE PART':'ASSEMBLY OVERVIEW'}</span>
    <h2>{structure?.name??'Six parts. One source.'}</h2>
    <p>{structure?structure.provenance==='publisher-reported-offset-constructed'?'Publisher-constructed cartilage offset, not segmented donor cartilage.':'Publisher-reported CT segmentation. Shape, attachments and anatomical extent still require review.':'Inspect the source assembly or isolate individual surfaces. No cross-donor fitting, mirroring or alignment to the existing Atlas was applied.'}</p>
    {structure&&<dl><dt>Source part</dt><dd>{structure.sourcePart}</dd><dt>Sampled triangles</dt><dd>{structure.triangles.toLocaleString('en-GB')}</dd><dt>Coverage</dt><dd>Source part only; anatomical extent unvalidated</dd></dl>}
    <div className="fda-reference-note"><strong>Before clinical use</strong><p>Validate anatomy, attachments, intersections, bone extent, physical scale and anatomical axes. The publisher reports a right shoulder; that is not independent coordinate validation.</p></div>
    <details><summary>Source &amp; revision</summary>{catalogue&&<><p>{fdaReferenceSourceNotice(catalogue)}</p><a href={catalogue.source.repository} target="_blank" rel="noreferrer">Publisher source · CC0-1.0</a><p className="fda-reference-code">{structure?.id??catalogue.specimenId}</p><p className="fda-reference-code">Catalogue {model?.revision}</p></>}</details>
    <p className="fda-reference-muted">Draft material only. Protected Website Review and decision writing are not connected in this component.</p>
   </aside>
  </div>
 </section>;
}
