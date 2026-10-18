"use client";

import {Component,createRef,useEffect,useState,type ComponentType,type ReactNode} from 'react';
import {type HeadAtlasSurfaceProps} from './HeadAtlasSurface';

/** Keep a failed native renderer local: the study and slice controls are siblings. */
export class HeadAtlasSurfaceBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  private failureHeading=createRef<HTMLHeadingElement>();
  private view=createRef<HTMLDivElement>();
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.failureHeading.current?.focus();}
  componentDidUpdate(_previousProps:{children:ReactNode},previousState:{failed:boolean}){
    if(previousState.failed&&!this.state.failed)this.view.current?.focus();
  }
  render(){
    return <div ref={this.view} role="group" aria-label="3D scan view" tabIndex={-1} style={{width:'100%',height:'100%'}}>{this.state.failed?<div role="alert"><h3 ref={this.failureHeading} tabIndex={-1}>3D scan view unavailable</h3><p>Your scan and slice controls are still available. Try opening the 3D scan view again, or continue in a slice layout.</p><button type="button" onClick={()=>this.setState({failed:false})}>Retry 3D scan view</button></div>:this.props.children}</div>;
  }
}

/** Mount only for a visible native surface; slice-only work never imports WebGL. */
export function HeadAtlasSurfaceLoader(props:HeadAtlasSurfaceProps){
  const [Surface,setSurface]=useState<ComponentType<HeadAtlasSurfaceProps>|null>(null);
  const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let current=true;setFailed(false);
    import('./HeadAtlasSurface').then(module=>{if(current)setSurface(()=>module.HeadAtlasSurface);},()=>{if(current)setFailed(true);});
    return()=>{current=false;};
  },[attempt]);
  if(Surface)return <HeadAtlasSurfaceBoundary><Surface {...props}/></HeadAtlasSurfaceBoundary>;
  if(failed)return <div role="alert"><p>The 3D scan view could not open. Your scan is still available.</p><button type="button" onClick={()=>{setFailed(false);setAttempt(value=>value+1);}}>Retry 3D scan view</button></div>;
  return <p role="status">Opening 3D scan view…</p>;
}
