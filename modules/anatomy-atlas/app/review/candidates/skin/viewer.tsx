'use client';
import {Component,Suspense,useEffect,useRef,useState,type ReactNode} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {Html,OrbitControls,useGLTF} from '@react-three/drei';
import {DoubleSide,Mesh} from 'three';
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib';
import candidate from '@/content/skin-review-candidate.json';
type View='body'|'head'|'left'|'back';
// Stable identity: changing a control must not reapply the initial camera pose.
const initialCamera={position:[0,0,26] as [number,number,number],fov:45};
class ModelBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="alert">The candidate model could not load. Reload this page to retry. No review decision has been saved.</p>:this.props.children;}
}
function Model({opacity,context}:{opacity:number;context:boolean}){
  const skin=useGLTF(candidate.model.url).nodes[candidate.model.nodeName];
  if(!(skin instanceof Mesh))throw new Error('Missing skin candidate node');
  return <><mesh geometry={skin.geometry}>
    <meshStandardMaterial color="#caa782" roughness={.85} side={DoubleSide} transparent={opacity<1} opacity={opacity} depthWrite={opacity===1}/>
  </mesh>{context&&<Frontal/>}</>;
}
function Frontal(){
  const node=useGLTF(candidate.context.bundleUrl).nodes[candidate.context.nodeName];
  if(!(node instanceof Mesh))throw new Error('Missing pinned frontal context');
  return <mesh geometry={node.geometry}><meshStandardMaterial color="#087b88" roughness={.8} side={DoubleSide}/></mesh>;
}
function Camera({view,revision}:{view:View;revision:number}){
  const {camera,invalidate}=useThree();const controls=useRef<OrbitControlsImpl>(null);
  useEffect(()=>{
    const target=view==='head'?[0,7.2,.5]:[0,-.2,0];
    camera.position.set(...(view==='head'?[0,7.2,5]:view==='left'?[26,0,0]:view==='back'?[0,0,-26]:[0,0,26]) as [number,number,number]);
    camera.up.set(0,1,0);controls.current?.target.set(...target as [number,number,number]);controls.current?.update();invalidate();
  },[camera,invalidate,view,revision]);
  return <OrbitControls ref={controls} makeDefault enableDamping={false} minDistance={1} maxDistance={45}/>;
}
export function SkinCandidateViewer(){
  const [opacity,setOpacity]=useState(.45),[context,setContext]=useState(true),[view,setView]=useState<View>('body'),[revision,setRevision]=useState(0);
  const choose=(next:View)=>{setView(next);setRevision(r=>r+1);};
  return <section aria-label="Read-only 3D skin candidate">
    <div className="skin-candidate-controls">
      <label htmlFor="skin-opacity">Skin opacity <output>{Math.round(opacity*100)}%</output>
        <input id="skin-opacity" type="range" min="0" max="1" step=".05" value={opacity} onChange={e=>setOpacity(Number(e.target.value))}/></label>
      <label><input type="checkbox" checked={context} onChange={e=>setContext(e.target.checked)}/> Show frontal bone context</label>
      <div className="skin-candidate-views" aria-label="Camera presets">{(['body','head','left','back'] as View[]).map(v=><button type="button" key={v} onClick={()=>choose(v)}>{v==='body'?'Whole body':v==='head'?'Inspect head':v==='left'?'Left side':'Posterior'}</button>)}</div>
    </div>
    <p className="skin-candidate-help">Drag to rotate · scroll or pinch to zoom · two-finger drag to pan. Camera presets restore a known view.</p>
    <ModelBoundary><section className="skin-candidate-canvas" aria-label="Interactive whole-body skin candidate with optional frontal bone context">
      <Canvas fallback={<p role="alert">3D graphics are unavailable. The original source sections remain available below.</p>} camera={initialCamera} frameloop="demand" dpr={[1,1.5]}>
        <color attach="background" args={['#edf3f4']}/><ambientLight intensity={1.5}/><directionalLight position={[5,8,12]} intensity={2}/>
        <Suspense fallback={<Html center><span role="status">Loading source model…</span></Html>}><Model opacity={opacity} context={context}/></Suspense><Camera view={view} revision={revision}/>
      </Canvas>
    </section></ModelBoundary>
  </section>;
}
