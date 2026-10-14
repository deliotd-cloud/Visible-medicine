'use client';

import {createContext,useContext,useLayoutEffect,useMemo,useRef,type ReactNode} from 'react';
import {bodyRegion,connectBodySelectionChannel,createBodySelectionState,type BodySelectionState,type BodySelection} from '../lib/body-selection-channel';
import type {BodyCatalog,BodyStructure} from './body-types';
import {sourceCanonical} from '../lib/body-source-additions';

const Context=createContext<ReturnType<typeof createBodySelectionState>|null>(null);
const unavailable:BodySelectionState={status:'blocked',reason:'unavailable'};

/** Root leg/thigh identity only. Never inherits the nested head or specimen channel. */
export function BodySelectionChannel({revision,region,children}:{revision:string;region:string;children:ReactNode}){
 const bridge=useMemo(()=>{
  let notify=()=>{};
  const state=createBodySelectionState(()=>notify());
  return {state,notify(fn:()=>void){notify=fn;}};
 },[]);
 useLayoutEffect(()=>{
  if(!bodyRegion(region))return;
  let connection:ReturnType<typeof connectBodySelectionChannel>|null=null;
  const hide=()=>{bridge.notify(()=>{});connection?.close();connection=null;};
  const show=()=>{
   if(document.hidden||connection)return;
   connection=connectBodySelectionChannel(window,revision,region,
    ()=>document.hidden?unavailable:bridge.state.current(),
    target=>!document.hidden&&bridge.state.focus(target));
   bridge.notify(connection.publish);
  };
  const visibility=()=>{if(document.hidden)hide();else show();};
  show();window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
  document.addEventListener('visibilitychange',visibility);
  return()=>{hide();window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);document.removeEventListener('visibilitychange',visibility);};
 },[bridge,revision,region]);
 return <Context.Provider value={bridge.state}>{children}</Context.Provider>;
}

export function useBodyRootSelection(value:BodySelectionState,focus?:(target:BodySelection)=>boolean){
 const bridge=useContext(Context),key=JSON.stringify(value),focusRef=useRef(focus);
 useLayoutEffect(()=>{focusRef.current=focus;},[focus]);
 useLayoutEffect(()=>{
  bridge?.root(JSON.parse(key) as BodySelectionState,target=>focusRef.current?.(target)??false);
  return()=>bridge?.root(unavailable);
 },[bridge,key]);
}

/** Whole canonical record and unique bundle, not a name/FMA match or a presentation part. */
export function bodyRootSelection(catalog:BodyCatalog|null,selected:BodyStructure|null,region:string):BodySelectionState{
 if(!bodyRegion(region)||!catalog)return unavailable;
 if(!selected)return {status:'empty'};
 const candidates=catalog.structures.filter(s=>s.id===selected.id);
 if(candidates.length!==1)return unavailable;
 const canonical=candidates[0],bundles=catalog.bundles.filter(b=>b.id===canonical.bundle);
 if(sourceCanonical(canonical)!==sourceCanonical(selected)||!canonical.regions.includes(region)||bundles.length!==1)return unavailable;
 return {status:'selected',selection:{kind:'root',id:canonical.id,source:bundles[0].sha256,laterality:canonical.laterality}};
}
