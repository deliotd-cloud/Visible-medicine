'use client';
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {BodyCatalog,BodyStructure} from './body-types';
import {createImagingBridge} from '../lib/imaging-sync';
import {learningAnatomyBindingKey} from '../lib/learning-resources';
import {prostateEducationBinding} from '../lib/prostate-education-binding';
import {installNestedEducationApi} from '../lib/root-education-api';
import {useImagingLink} from './imaging-link';

/** The schematic owns a separate semantic bridge. Neither body coordinates nor
 * parent-organ links are inherited by its original internal compartments. */
export function useProstateEducationLink({catalog,parent,disabled,onSelect}:{
  catalog?:BodyCatalog;parent:BodyStructure;disabled:boolean;onSelect:(id:string)=>void;
}){
  const [bridge]=useState(createImagingBridge);
  const binding=useMemo(()=>prostateEducationBinding(catalog,parent),[catalog,parent]);
  const key=JSON.stringify(binding.records.map(learningAnatomyBindingKey).sort());
  const allowedIds=useMemo(()=>binding.entries.map(entry=>entry.id),[binding]);
  const state=useRef({disabled,allowed:new Set(allowedIds),optedIn:false,active:false});
  const installed=useRef<ReturnType<typeof installNestedEducationApi>|null>(null);
  const link=useImagingLink({bridge,entries:binding.entries,allowedIds,disabled,onSelect});
  const pause=()=>{
    state.current.optedIn=false;
    link.setEnabled(false);
    installed.current?.cancelPending();
  };
  useLayoutEffect(()=>{
    state.current.disabled=disabled;
    state.current.allowed=new Set(allowedIds);
    pause();
  },[key,disabled]);
  useEffect(()=>bridge.subscribe(pause),[bridge]);
  useEffect(()=>{
    if(!binding.records.length)return;
    const start=()=>{
      if(installed.current)return;
      state.current.active=true;
      state.current.optedIn=false;
      installed.current=installNestedEducationApi(window,bridge,binding.records,{
        canNavigate:()=>state.current.active&&!state.current.disabled&&state.current.optedIn&&!document.hidden,
        canAccessAnatomy:anatomy=>anatomy.scope==='nested'&&anatomy.nested.study==='prostate-zones'&&state.current.allowed.has(anatomy.structureId),
      });
    };
    const stop=()=>{
      state.current.active=false;
      pause();
      const owner=installed.current;installed.current=null;owner?.dispose();
    };
    const visibility=()=>{if(document.hidden)pause();};
    start();window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);
    document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',start);document.removeEventListener('visibilitychange',visibility);stop();};
  },[bridge,key]);
  return {...link,
    setEnabled(value:boolean){
      if(!value){pause();return;}
      state.current.optedIn=state.current.active&&!state.current.disabled&&!document.hidden&&!!bridge.getAdapter();
      link.setEnabled(state.current.optedIn);
    },
    publish(id:string){if(state.current.optedIn&&state.current.active&&!state.current.disabled&&!document.hidden)link.publish(id);},
  };
}
