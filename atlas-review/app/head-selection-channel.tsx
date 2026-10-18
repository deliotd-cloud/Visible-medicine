'use client';
import {createContext,useContext,useLayoutEffect,useMemo,useRef,type ReactNode} from 'react';
import {createHeadSelectionState,connectHeadSelectionChannel,type HeadRootState,type HeadSelectionState} from '../lib/head-selection-channel';
import type {BodyCatalog,BodyStructure} from './body-types';
import {nestedPartsFor,nestedBundleHash,type NestedStudy} from '../lib/nested-anatomy';
import {sourceCanonical} from '../lib/body-source-additions';
import type {HeadFocusTarget} from '../lib/head-focus-command';
const Context=createContext<ReturnType<typeof createHeadSelectionState>|null>(null);
const unavailable:HeadSelectionState={status:'blocked',reason:'unavailable'};
export function HeadSelectionChannel({revision,children}:{revision:string;children:ReactNode}){
  const bridge=useMemo(()=>{
    let notify=()=>{};
    const state=createHeadSelectionState(()=>notify());
    return {state,notify(fn:()=>void){notify=fn;}};
  },[]);
  useLayoutEffect(()=>{
    const connection=connectHeadSelectionChannel(window,revision,()=>bridge.state.current(),target=>bridge.state.focus(target));
    bridge.notify(connection.publish);
    return ()=>{bridge.notify(()=>{});connection.close();};
  },[bridge,revision]);
  return <Context.Provider value={bridge.state}>{children}</Context.Provider>;
}
export function useHeadRootSelection(value:HeadRootState,focus?:(target:HeadFocusTarget)=>boolean){
  const bridge=useContext(Context),key=JSON.stringify(value);
  const focusRef=useRef(focus);
  useLayoutEffect(()=>{focusRef.current=focus;},[focus]);
  useLayoutEffect(()=>{
    bridge?.root(JSON.parse(key) as HeadRootState,target=>focusRef.current?.(target)??false);
    return ()=>bridge?.root({nested:false,state:unavailable});
  },[bridge,key]);
}
export function headRootSelection(catalog:BodyCatalog|null,selected:BodyStructure|null):HeadSelectionState{
  if(!selected)return {status:'empty'};
  const canonical=catalog?.structures.find(s=>s.id===selected.id),bundle=catalog?.bundles.find(b=>b.id===selected.bundle);
  if(!canonical||sourceCanonical(canonical)!==sourceCanonical(selected)||!bundle)return unavailable;
  return {status:'selected',selection:{kind:'root',id:canonical.id,source:bundle.sha256,laterality:canonical.laterality}};
}
export function useHeadNestedSelection({catalog,parent,study,selected,blocked,onFocus}:{catalog?:BodyCatalog;parent:BodyStructure;study:NestedStudy;selected?:BodyStructure;blocked:HeadSelectionState&{status:'blocked'}|null;onFocus?:(id:string)=>boolean}){
  const bridge=useContext(Context),owner=useMemo(()=>({}),[]);
  const focusRef=useRef(onFocus);
  useLayoutEffect(()=>{focusRef.current=onFocus;},[onFocus]);
  const state=useMemo<HeadSelectionState>(()=>{
    if(blocked)return blocked;
    const canonical=catalog?.structures.find(s=>s.id===parent.id),bundle=catalog?.bundles.find(b=>b.id===parent.bundle);
    if(!canonical||sourceCanonical(canonical)!==sourceCanonical(parent)||!bundle)return unavailable;
    if(!selected)return {status:'empty'};
    const child=nestedPartsFor(canonical,study).find(s=>s.id===selected.id),hash=child&&nestedBundleHash(study,child.bundle);
    if(!child||!hash||sourceCanonical(child)!==sourceCanonical(selected))return unavailable;
    return {status:'selected',selection:{kind:'nested',id:child.id,source:hash,laterality:child.laterality,parentId:canonical.id,parentSource:bundle.sha256,study}};
  },[catalog,parent,study,selected,blocked?.reason]);
  const key=JSON.stringify(state);
  useLayoutEffect(()=>{
    bridge?.nested(owner,JSON.parse(key) as HeadSelectionState,target=>{
      if(blocked||target.kind!=='nested'||target.parentId!==parent.id||target.study!==study)return false;
      const canonical=catalog?.structures.find(s=>s.id===parent.id),bundle=catalog?.bundles.find(b=>b.id===parent.bundle);
      if(!canonical||sourceCanonical(canonical)!==sourceCanonical(parent)||bundle?.sha256!==target.parentSource)return false;
      const child=nestedPartsFor(canonical,study).find(s=>s.id===target.id);
      if(!child||child.laterality!==target.laterality||nestedBundleHash(study,child.bundle)!==target.source)return false;
      return focusRef.current?.(child.id)??false;
    });
    return ()=>bridge?.remove(owner);
  },[bridge,owner,key,catalog,parent,study,blocked?.reason]);
}
