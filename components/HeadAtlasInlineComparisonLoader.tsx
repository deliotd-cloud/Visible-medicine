'use client';

import {Component,createRef,useEffect,useLayoutEffect,useRef,useState,type ComponentProps,type ComponentType,type ReactNode} from 'react';
import {headInlineDestination} from '../lib/head-inline-comparison.ts';

type ComparisonProps=ComponentProps<typeof import('./HeadAtlasInlineComparison').HeadAtlasInlineComparison>;
type Props=ComparisonProps&{scope:object};
type LoadState={scope:object;attempt:number;Comparison:ComponentType<ComparisonProps>|null;failed:boolean};

/** A renderer failure belongs to this pane; the native scan is a sibling. */
export class HeadAtlasInlineComparisonBoundary extends Component<{children:ReactNode;onRetry:()=>void;onClose:()=>void;fallback?:ReactNode},{failed:boolean}>{
  state={failed:false};
  private heading=createRef<HTMLHeadingElement>();
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.heading.current?.focus();}
  render(){
    if(!this.state.failed)return this.props.children;
    return <section className="head-inline-comparison" role="alert"><h2 ref={this.heading} tabIndex={-1}>3D Atlas comparison unavailable</h2><p>Your scan and slice controls are still available.</p><button type="button" onClick={this.props.onRetry}>Retry 3D comparison</button><button type="button" onClick={this.props.onClose}>Close comparison</button>{this.props.fallback}</section>;
  }
}

/** Import the comparison only while its pane is mounted. No source or readiness decision is made here. */
export function HeadAtlasInlineComparisonLoader({scope,...props}:Props){
  const [attempt,setAttempt]=useState(0);
  const [load,setLoad]=useState<LoadState|null>(null);
  const generation=useRef(0),committed=useRef<object|null>(null),activeScope=useRef<object|null>(null);
  const token={};
  useLayoutEffect(()=>{
    activeScope.current=scope;generation.current++;
    return()=>{if(activeScope.current===scope){activeScope.current=null;generation.current++;}};
  },[scope]);
  useLayoutEffect(()=>{
    committed.current=token;
    return()=>{if(committed.current===token)committed.current=null;};
  });
  useEffect(()=>{
    let live=true;
    const current=++generation.current;
    setLoad({scope,attempt,Comparison:null,failed:false});
    import('./HeadAtlasInlineComparison').then(
      module=>{if(live&&generation.current===current&&activeScope.current===scope)setLoad({scope,attempt,Comparison:module.HeadAtlasInlineComparison,failed:false});},
      ()=>{if(live&&generation.current===current&&activeScope.current===scope)setLoad({scope,attempt,Comparison:null,failed:true});},
    );
    return()=>{live=false;generation.current++;};
  },[scope,attempt]);
  const current=()=>committed.current===token&&activeScope.current===scope;
  const retry=()=>{
    if(!current())return;
    generation.current++;committed.current=null;
    setLoad({scope,attempt:attempt+1,Comparison:null,failed:false});
    setAttempt(value=>value+1);
  };
  const close=()=>{
    if(!current())return;
    generation.current++;committed.current=null;activeScope.current=null;
    props.onClose();
  };
  const state=load?.scope===scope&&load.attempt===attempt?load:null;
  // Keep recovery independent of the optional renderer chunk. Only the current
  // admitted destination may be offered; no manual scan/session data is linked.
  const destination=props.selectionReady===false?null:headInlineDestination(props.conceptId,props.revision,props.modality);
  const fallback=destination?<a className="head-inline-fallback" href={destination.atlasHref} target="_blank" rel="noopener noreferrer" aria-label={`Open ${destination.label} in the full 3D Atlas (new tab)`}>Open full 3D Atlas ↗ <span>· keeps this scan open</span></a>:null;
  if(state?.failed)return <section className="head-inline-comparison" role="alert"><h2>3D Atlas comparison unavailable</h2><p>Your scan and slice controls are still available.</p><button type="button" onClick={retry}>Retry 3D comparison</button><button type="button" onClick={close}>Close comparison</button>{fallback}</section>;
  if(!state?.Comparison)return <section className="head-inline-comparison" role="status"><h2>3D Atlas comparison</h2><p>Opening 3D comparison… Your scan and slice controls remain available.</p><button type="button" onClick={close}>Close comparison</button></section>;
  const Comparison=state.Comparison;
  return <HeadAtlasInlineComparisonBoundary onRetry={retry} onClose={close} fallback={fallback}>
    <Comparison {...props} onSelectConcept={conceptId=>{if(current())props.onSelectConcept(conceptId);}} onClose={close} onPlaybackStatus={status=>{if(current())props.onPlaybackStatus?.(status);}}/>
  </HeadAtlasInlineComparisonBoundary>;
}
