'use client';
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {BodyCatalog,BodyStructure} from './body-types';
import type {NestedLearningStudy} from '../lib/learning-resource-types';
import {learningAnatomyBindingKey} from '../lib/learning-resources';
import {nestedEducationBinding} from '../lib/nested-education-binding';
import {createImagingBridge} from '../lib/imaging-sync';
import {installNestedEducationApi} from '../lib/root-education-api';
import {useImagingLink} from './imaging-link';

export function useNestedEducationLink({catalog,parent,study,layers,allowedIds,disabled,onSelect}:{
  catalog?:BodyCatalog;parent:BodyStructure;study:NestedLearningStudy;layers:BodyStructure[];
  allowedIds:string[];disabled:boolean;onSelect:(id:string)=>void;
}){
  const [bridge]=useState(createImagingBridge);
  const binding=useMemo(()=>nestedEducationBinding(catalog,parent,study,layers),[catalog,parent,study,layers]);
  // Semantic keys avoid pausing on an ordinary selected-child rerender.
  const bindingKey=JSON.stringify(binding.records.map(learningAnatomyBindingKey).sort());
  const allowedKey=JSON.stringify([...new Set(allowedIds)].sort());
  const trustedAllowed=allowedIds.filter(id=>binding.entries.some(e=>e.id===id));
  const state=useRef({allowed:new Set(trustedAllowed),disabled});
  const installed=useRef<ReturnType<typeof installNestedEducationApi>|null>(null);
  const link=useImagingLink({bridge,entries:binding.entries,allowedIds:trustedAllowed,disabled,onSelect});
  useLayoutEffect(()=>{
    state.current={allowed:new Set(trustedAllowed),disabled};
    installed.current?.pause();
    link.setEnabled(false);
  },[bindingKey,allowedKey,disabled]);
  useEffect(()=>{
    if(!binding.records.length)return;
    const start=()=>{
      if(installed.current)return;
      installed.current=installNestedEducationApi(window,bridge,binding.records,{
        canNavigate:()=>!state.current.disabled,
        canAccessAnatomy:a=>a.scope==='nested'&&state.current.allowed.has(a.structureId),
      });
    };
    const stop=()=>{const owner=installed.current;installed.current=null;owner?.dispose();link.setEnabled(false);};
    start();
    window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);
    return ()=>{window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',start);stop();};
  },[bridge,bindingKey]);
  return link;
}
