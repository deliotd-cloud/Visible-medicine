"use client";

import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useThree,type ThreeEvent} from '@react-three/fiber';
import {Bounds,OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {type LoadedEntry} from '../lib/head-atlas-import';
import {type Vec3} from '../lib/head-atlas-geometry.mjs';
import {headLabel} from '../lib/head-atlas-display';
import {bindHeadSurfaceContext} from '../lib/head-surface-context';
import './head-surface.css';

export type HeadAtlasSurfaceProps={selected:LoadedEntry;regionalCourse:boolean;onPick:(point:Vec3)=>void};

function Surface({selected,onPick}:{selected:LoadedEntry;onPick:(point:Vec3)=>void}){
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry();
    if(selected.positions&&selected.indices){g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(selected.positions),3));g.setIndex(new THREE.BufferAttribute(selected.indices,1));g.computeVertexNormals();}
    else {const points=selected.entry.sampled_path_ras_mm??selected.entry.points_ras_mm??[];g.setFromPoints(points.map(point=>new THREE.Vector3(point[0],point[1],point[2])));}
    g.computeBoundingBox();g.computeBoundingSphere();
    if(g.boundingBox&&g.boundingSphere&&g.boundingSphere.radius<2.5){g.boundingBox.expandByScalar(2.5);g.boundingSphere.radius=2.5;}
    return g;
  },[selected]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const color=new THREE.Color(...selected.entry.color as [number,number,number]);
  const curve=useMemo(()=>new THREE.Line(geometry,new THREE.LineBasicMaterial({color:new THREE.Color(...selected.entry.color as [number,number,number])})),[geometry,selected]);
  useEffect(()=>()=>curve.material.dispose(),[curve]);
  const pick=(event:ThreeEvent<MouseEvent>)=>{event.stopPropagation();onPick(event.point.toArray() as Vec3);};
  if(selected.positions)return <mesh geometry={geometry} onClick={pick}><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.65}/></mesh>;
  if((selected.entry.sampled_path_ras_mm?.length??0)>1)return <primitive object={curve} onClick={pick}/>;
  return <points geometry={geometry} onClick={pick}><pointsMaterial color={color} size={2.5} sizeAttenuation/></points>;
}

function RegionalCourse({points,color}:{points:number[][];color:number[]}){
  const line=useMemo(()=>new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],p[1],p[2]))),new THREE.LineBasicMaterial({color:new THREE.Color(color[0],color[1],color[2])})),[points,color]);
  useEffect(()=>()=>{line.geometry.dispose();line.material.dispose();},[line]);
  return <primitive object={line}/>;
}

function HeadSurfaceContextObserver({onState}:{onState:(lost:boolean)=>boolean}){
  const {gl,invalidate}=useThree();
  useEffect(()=>bindHeadSurfaceContext(gl.domElement,gl.getContext(),lost=>{
    if(onState(lost)&&!lost)invalidate();
  }),[gl,invalidate,onState]);
  return null;
}

/** Saved native RAS geometry only; the generic anatomical Atlas remains separate. */
export function HeadAtlasSurface({selected,regionalCourse,onPick}:HeadAtlasSurfaceProps){
  const [attempt,setAttempt]=useState(0);
  const [status,setStatus]=useState<'opening'|'ready'|'lost'|'restored'>('opening');
  const session=useMemo(()=>({valid:false,lost:false}),[attempt]);
  const active=useRef<typeof session|null>(null),restoreFocus=useRef(false);
  const view=useRef<HTMLDivElement>(null),notice=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    session.valid=true;active.current=session;
    return()=>{session.valid=false;if(active.current===session)active.current=null;};
  },[session]);
  useLayoutEffect(()=>{
    if((status==='ready'||status==='restored')&&restoreFocus.current){
      restoreFocus.current=false;view.current?.focus({preventScroll:true});
    }
  },[status]);
  const onState=useCallback((lost:boolean)=>{
    if(!session.valid||active.current!==session)return false;
    const wasLost=session.lost;
    session.lost=lost;
    if(lost)setStatus('lost');
    else if(wasLost){
      restoreFocus.current=typeof document!=='undefined'&&!!notice.current?.contains(document.activeElement);
      setStatus('restored');
    }else setStatus(value=>value==='opening'?'ready':value);
    return true;
  },[session]);
  const retry=()=>{
    if(!session.valid||active.current!==session||!session.lost)return;
    restoreFocus.current=typeof document!=='undefined'&&!!notice.current?.contains(document.activeElement);
    // Retire synchronously: queued clicks and old canvas events cannot reset a
    // replacement renderer, including before React commits the keyed remount.
    session.valid=false;active.current=null;
    setStatus('opening');setAttempt(value=>value+1);
  };
  const pick=(point:Vec3)=>{
    if(session.valid&&active.current===session&&!session.lost)onPick(point);
  };
  return <div className="head-surface-renderer" ref={view} role="group" aria-label="Native 3D surface" tabIndex={-1} aria-busy={status==='opening'}>
    <Canvas key={attempt} camera={{position:[0,250,100],up:[0,0,1],fov:40}} aria-label={`Rotatable native ${headLabel(selected.entry)} surface or locator`}>
      <HeadSurfaceContextObserver onState={onState}/><color attach="background" args={['#0b1413']}/><ambientLight intensity={1.2}/><directionalLight position={[100,200,150]} intensity={2}/><Bounds fit clip observe margin={1.4}><Surface key={selected.entry.id} selected={selected} onPick={pick}/>{regionalCourse&&selected.entry.supplementary_geometries?.map(part=><RegionalCourse key={part.part_id} points={part.sampled_path_ras_mm} color={selected.entry.color}/>)}</Bounds><OrbitControls makeDefault enableDamping dampingFactor={0.12}/>
    </Canvas>
    {status==='lost'&&<div ref={notice} className="head-surface-interruption" role="alert"><h3>3D scan view interrupted</h3><p>Your scan and slice controls are still available. The browser may restore the 3D view automatically, or you can retry it.</p><button type="button" onClick={retry}>Retry 3D scan view</button></div>}
    {status==='restored'&&<span className="head-slice-help" role="status">3D scan view restored.</span>}
  </div>;
}
