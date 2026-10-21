'use client';

import {createContext,useContext,useLayoutEffect,useMemo,type ReactNode} from 'react';
import {atlasLearningRegion,connectAtlasLearningSelectionChannel,createAtlasLearningSelectionState,
  type AtlasLearningSelectionState} from '../lib/atlas-learning-selection-channel';
import {sourceCanonical} from '../lib/body-source-additions';
import type {BodyCatalog,BodyStructure} from './body-types';

const Context=createContext<ReturnType<typeof createAtlasLearningSelectionState>|null>(null);
const unavailable:AtlasLearningSelectionState={status:'blocked',reason:'unavailable'};

/** Independently scoped, read-only publisher for the twelve contained root regions. */
export function AtlasLearningSelectionChannel({revision,region,children}:{revision:string;region:string;children:ReactNode}){
  const bridge=useMemo(()=>{
    let notify=()=>{};
    const state=createAtlasLearningSelectionState(()=>notify());
    return {state,notify(fn:()=>void){notify=fn;}};
  },[]);
  useLayoutEffect(()=>{
    if(!atlasLearningRegion(region))return;
    let connection:ReturnType<typeof connectAtlasLearningSelectionChannel>|null=null;
    const hide=()=>{bridge.notify(()=>{});connection?.close();connection=null;};
    const show=()=>{
      if(document.hidden||connection)return;
      connection=connectAtlasLearningSelectionChannel(window,revision,region,
        ()=>document.hidden?unavailable:bridge.state.current());
      bridge.notify(connection.publish);
    };
    const visibility=()=>{if(document.hidden)hide();else show();};
    show();window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
    document.addEventListener('visibilitychange',visibility);
    return()=>{hide();window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);
      document.removeEventListener('visibilitychange',visibility);};
  },[bridge,revision,region]);
  return <Context.Provider value={bridge.state}>{children}</Context.Provider>;
}

export function useAtlasLearningRootSelection(value:AtlasLearningSelectionState){
  const bridge=useContext(Context);
  const key=JSON.stringify(value);
  useLayoutEffect(()=>{
    bridge?.root(JSON.parse(key) as AtlasLearningSelectionState);
    return()=>bridge?.root(unavailable);
  },[bridge,key]);
}

/** Exact loaded catalog record and unique bundle; whole body includes raw source regions. */
export function atlasLearningRootSelection(catalog:BodyCatalog|null,selected:BodyStructure|null,
  region:string):AtlasLearningSelectionState{
  if(!atlasLearningRegion(region)||!catalog)return unavailable;
  if(!selected)return {status:'empty'};
  const roots=catalog.structures.filter(s=>s.id===selected.id);
  if(roots.length!==1)return unavailable;
  const canonical=roots[0],bundles=catalog.bundles.filter(b=>b.id===canonical.bundle);
  if(sourceCanonical(canonical)!==sourceCanonical(selected)||
    (region!=='whole-body'&&!canonical.regions.includes(region))||bundles.length!==1||
    !/^[a-f0-9]{64}$/.test(bundles[0].sha256))return unavailable;
  return {status:'selected',selection:{kind:'root',id:canonical.id,
    source:bundles[0].sha256,laterality:canonical.laterality}};
}
