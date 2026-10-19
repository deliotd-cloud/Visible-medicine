'use client';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {csfMarkerY,csfTracksFor} from '@/atlas-review/lib/csf-motion';
import type {BodyStructure} from './body-types';

/** Non-selectable teaching overlay; never modifies anatomy or owns a timer. */
export function CsfMotion({structure,bundleHash}:{structure:BodyStructure;bundleHash:string}){
  const tracks=useMemo(()=>csfTracksFor(structure,bundleHash),[structure,bundleHash]);
  const elapsed=useRef(0),invalidate=useThree(s=>s.invalidate);
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry();
    const positions=new Float32Array(tracks.length*3);
    tracks.forEach((t,i)=>{positions.set([t.center[0],csfMarkerY(t.center[1],t.amplitude,t.phase,0),t.center[2]],i*3);});
    g.setAttribute('position',new THREE.BufferAttribute(positions,3));return g;
  },[tracks]);
  useEffect(()=>{invalidate();return()=>geometry.dispose();},[geometry,invalidate]);
  useFrame((_state,delta)=>{
    // Hidden tabs/context loss cannot produce a catch-up jump on return.
    if(typeof document!=='undefined'&&document.hidden)return;
    elapsed.current+=Math.min(Math.max(delta,0),0.05);
    const p=geometry.getAttribute('position');
    tracks.forEach((t,i)=>p.setY(i,csfMarkerY(t.center[1],t.amplitude,t.phase,elapsed.current)));
    p.needsUpdate=true;invalidate();
  });
  if(!tracks.length)return null;
  return <points name={`csf-schematic:${structure.id}`} geometry={geometry} raycast={()=>null} frustumCulled={false}>
    <shaderMaterial transparent depthWrite={false} depthTest vertexShader={`
      void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=5.0;}`}
      fragmentShader={`void main(){float r=length(gl_PointCoord-vec2(0.5));if(r>0.5)discard;
        gl_FragColor=vec4(0.10,0.95,0.90,0.95*(1.0-smoothstep(0.25,0.5,r)));}`}/>
  </points>;
}
