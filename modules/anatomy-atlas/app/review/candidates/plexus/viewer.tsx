'use client';
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { TubeGeometry, Vector3, type Curve } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { originalPlexusStudy as study, plexusConnectivity, validateOriginalPlexusStudy, type PlexusPart, type PlexusStage } from '@/lib/original-plexus';
import { connectionCurve, diagramFit, isCollateral, plexusDiagram, segmentCurve, spreadPoint, stageNames } from '@/lib/original-plexus-presentation';

type View = 'diagram' | 'oblique' | 'posterior' | 'focus';
const initialCamera = { position: [0, -.2, 19] as [number, number, number], fov: 42 };
const stages: PlexusStage[] = ['ramus', 'trunk', 'division', 'cord', 'median-root', 'nerve'];
const errors = validateOriginalPlexusStudy(study);
class GraphicsBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">The diagram could not render. The searchable structure list and reference notes remain available. No review decision has been saved.</p> : this.props.children; }
}
function Nerve({curve,colour,opacity=1,onSelect,radius=.09}:{curve:Curve<Vector3>;colour:string;opacity?:number;onSelect?:()=>void;radius?:number}) {
  const geometry = useMemo(() => new TubeGeometry(curve, 40, radius, 8, false), [curve, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} onClick={onSelect ? event => {event.stopPropagation(); onSelect();} : undefined}>
    <meshStandardMaterial color={colour} roughness={.5} metalness={.05} transparent={opacity<1} opacity={opacity} depthWrite={opacity===1}/>
  </mesh>;
}
function SmoothCamera({view,revision,selected,spread,reducedMotion,parts}:{view:View;revision:number;selected:string;spread:number;reducedMotion:boolean;parts:PlexusPart[]}) {
  const {camera,invalidate,size} = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const motion = useRef<{start:Vector3;targetStart:Vector3;end:Vector3;target:Vector3;elapsed:number}|null>(null);
  useEffect(() => {
    const direction: [number,number,number]=view==='oblique'?[.55,.28,1]:view==='posterior'?[0,0,-1]:[0,0,1];
    const fit=diagramFit(parts.map(p=>p.key),spread,size.width/Math.max(size.height,1),42,direction);
    let target = new Vector3(...fit.target), end = target.clone().add(new Vector3(...direction).normalize().multiplyScalar(fit.distance));
    if (view==='focus') { target = segmentCurve(selected, spread).getPoint(.5); end = target.clone().add(new Vector3(0,0,8)); }
    if (!controls.current || reducedMotion) { camera.position.copy(end); controls.current?.target.copy(target); controls.current?.update(); motion.current=null; }
    else motion.current={start:camera.position.clone(),targetStart:controls.current.target.clone(),end,target,elapsed:0};
    invalidate();
    // Selection/spread alone must not override a manually positioned camera.
    // The explicit preset/revision requests the move, using current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, revision, reducedMotion, camera, invalidate, size.width, size.height]);
  useFrame((_, delta) => {
    const m=motion.current;
    if (!m || !controls.current) return;
    m.elapsed += Math.min(delta,.05);
    const t=Math.min(1,m.elapsed/1.05), ease=t*t*t*(t*(t*6-15)+10);
    camera.position.lerpVectors(m.start,m.end,ease); controls.current.target.lerpVectors(m.targetStart,m.target,ease); controls.current.update();
    if(t===1) motion.current=null; else invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.1} minDistance={4} maxDistance={36} onStart={()=>{motion.current=null;}}/>;
}
function Diagram({parts,selected,setSelected,spread,isolate,trace,labels}:{parts:PlexusPart[];selected:string;setSelected:(key:string)=>void;spread:number;isolate:boolean;trace:boolean;labels:boolean}) {
  const partKeys=useMemo(()=>new Set(parts.map(p=>p.key)),[parts]);
  const related=useMemo(()=>{const links=plexusConnectivity(study,selected);return new Set([selected,...links.ancestors,...links.descendants]);},[selected]);
  const curves=useMemo(()=>Object.fromEntries(parts.map(p=>[p.key,segmentCurve(p.key,spread)])),[parts,spread]);
  const connections=useMemo(()=>study.connections.filter(c=>partKeys.has(c.from)&&partKeys.has(c.to)).map(c=>({ ...c,curve:connectionCurve(c.from,c.to,spread)})),[partKeys,spread]);
  const active=(key:string)=>key===selected||(trace&&related.has(key));
  const tone=(p:PlexusPart)=>active(p.key)?'#087b88':p.key.includes('posterior')?'#aa8138':'#d9b65e';
  const selectedPart=parts.find(p=>p.key===selected), anchor=curves[selected]?.getPoint(.55);
  return <>
    {connections.map(c=>c.curve&&<Nerve key={`${c.from}:${c.to}`} curve={c.curve} colour={active(c.from)&&active(c.to)?'#087b88':'#bd9d52'} radius={spread>.02?.035:.075} opacity={isolate&&!(active(c.from)&&active(c.to))?.1:spread>.02?.45:1}/>)}
    {parts.map(p=><Nerve key={p.key} curve={curves[p.key]} colour={tone(p)} opacity={isolate&&!active(p.key)?.1:1} onSelect={()=>setSelected(p.key)} radius={p.stage==='nerve'&&isCollateral(p)?.055:p.stage==='cord'?.115:.09}/>)}
    {labels&&parts.filter(p=>p.stage==='ramus').map(p=><Html key={p.key} position={spreadPoint(plexusDiagram[p.key].start,p.stage,spread)} center><button className="plexus-root-label" onClick={()=>setSelected(p.key)} aria-label={p.name}>{p.key.split('.')[1]}</button></Html>)}
    {labels&&selectedPart&&anchor&&<Html position={anchor} center zIndexRange={[20,0]}><button className="plexus-selected-label" onClick={()=>setSelected(selected)} title={selectedPart.name}>{selectedPart.name}</button></Html>}
  </>;
}
export function OriginalPlexusViewer() {
  const [selected,setSelected]=useState('cord.posterior'),[search,setSearch]=useState(''),[collaterals,setCollaterals]=useState(false);
  const [isolate,setIsolate]=useState(false),[trace,setTrace]=useState(false),[labels,setLabels]=useState(true),[spread,setSpread]=useState(0);
  const [view,setView]=useState<View>('diagram'),[revision,setRevision]=useState(0),[reducedMotion,setReducedMotion]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReducedMotion(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  const select=(key:string)=>{setSelected(key);if(isCollateral(study.parts.find(p=>p.key===key)!))setCollaterals(true);};
  const choose=(next:View)=>{setView(next);setRevision(r=>r+1);};
  const visibleParts=useMemo(()=>study.parts.filter(p=>collaterals||!isCollateral(p)),[collaterals]);
  const matches=useMemo(()=>study.parts.filter(p=>`${p.name} ${p.key}`.toLowerCase().includes(search.trim().toLowerCase())),[search]);
  const selectedPart=study.parts.find(p=>p.key===selected)!;
  const incoming=study.connections.filter(c=>c.to===selected).map(c=>study.parts.find(p=>p.key===c.from)!);
  const outgoing=study.connections.filter(c=>c.from===selected).map(c=>study.parts.find(p=>p.key===c.to)!);
  const reset=()=>{setSelected('cord.posterior');setSearch('');setCollaterals(false);setIsolate(false);setTrace(false);setLabels(true);setSpread(0);choose('diagram');};
  if(errors.length) return <p role="alert">The candidate contract failed validation. Diagram withheld; no decisions saved.</p>;
  return <section className="plexus-study" aria-label="Original 3D brachial plexus candidate">
    <aside className="plexus-list"><label htmlFor="plexus-search">Find a structure</label><input id="plexus-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="C5, posterior cord…"/>
      <p className="plexus-list-count">{matches.length} of {study.parts.length} named parts</p>
      <div className="plexus-list-scroll">{stages.map(stage=>{const items=matches.filter(p=>p.stage===stage);return items.length>0&&<details key={stage} open><summary>{stageNames[stage]} <span>{items.length}</span></summary>{items.map(p=><button key={p.key} type="button" aria-pressed={p.key===selected} onClick={()=>select(p.key)}>{p.name}</button>)}</details>;})}{!matches.length&&<p role="status">No matches. Try a nerve name or C5–T1.</p>}</div>
    </aside>
    <div className="plexus-main"><div className="plexus-toolbar" aria-label="Diagram controls"><div className="plexus-presets">{(['diagram','oblique','posterior'] as View[]).map(v=><button type="button" key={v} onClick={()=>choose(v)}>{v==='diagram'?'Overview':v==='oblique'?'Depth view':'From behind'}</button>)}<button type="button" onClick={()=>choose('focus')}>Focus selected</button><button type="button" onClick={reset}>Reset</button></div>
      <div className="plexus-options"><label><input type="checkbox" checked={collaterals} onChange={e=>{setCollaterals(e.target.checked);if(!e.target.checked&&isCollateral(selectedPart))setSelected('cord.posterior');}}/>Collateral branches</label><label><input type="checkbox" checked={isolate} onChange={e=>setIsolate(e.target.checked)}/>Fade others</label><label><input type="checkbox" checked={trace} onChange={e=>setTrace(e.target.checked)}/>Named connections</label><label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/>Labels</label></div>
      <label className="plexus-spread" htmlFor="plexus-spread">Diagram spacing <input id="plexus-spread" type="range" min="0" max="1" step=".05" value={spread} onChange={e=>setSpread(Number(e.target.value))}/><output>{Math.round(spread*100)}%</output></label>
    </div><GraphicsBoundary><div className="plexus-canvas"><Canvas camera={initialCamera} frameloop="demand" dpr={[1,1.5]} fallback={<p role="alert">3D unavailable; select structures in the list to inspect their connections.</p>}>
      <color attach="background" args={['#f5f7f4']}/><ambientLight intensity={1.7}/><directionalLight position={[4,7,12]} intensity={2.7}/><directionalLight position={[-6,-2,-5]} intensity={1.1}/>
      <Diagram parts={visibleParts} selected={selected} setSelected={select} spread={spread} isolate={isolate} trace={trace} labels={labels}/><SmoothCamera view={view} revision={revision} selected={selected} spread={spread} reducedMotion={reducedMotion} parts={visibleParts}/>
    </Canvas><span className="plexus-canvas-badge">Illustrative 3D · not to scale</span></div></GraphicsBoundary><p className="plexus-help">Drag to rotate · wheel to zoom · right-drag to pan. Spacing separates diagram stages, not a physical dissection. Crossings without a junction are not joins.</p>
    </div>
    <aside className="plexus-info" aria-label="Selected structure"><p className="plexus-eyebrow">{stageNames[selectedPart.stage]}</p><h2>{selectedPart.name}</h2><p>{selectedPart.summary}</p>
      <div className="plexus-connections"><h3>Receives named connection from</h3>{incoming.length?incoming.map(p=><button type="button" key={p.key} onClick={()=>select(p.key)}>{p.name}</button>):<p>Diagram entry; spinal nerve formation is not shown.</p>}<h3>Connects to</h3>{outgoing.length?outgoing.map(p=><button type="button" key={p.key} onClick={()=>select(p.key)}>{p.name}</button>):<p>Distal course and target distribution are not modelled.</p>}</div>
      <p className="plexus-trace-note">Named continuity only. Highlighting does not trace individual fibres or establish which root supplies a terminal nerve.</p>
      <details><summary>Identity and references</summary><code>{selectedPart.id}</code><ul>{selectedPart.referenceIds.map(id=>{const ref=study.references.find(r=>r.id===id);return ref&&<li key={id}><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a></li>;})}</ul></details>
    </aside>
  </section>;
}
