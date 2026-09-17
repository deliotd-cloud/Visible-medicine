'use client';
import {useEffect,useLayoutEffect,useRef} from 'react';
import type {AnatomyLinkEntry} from '../lib/anatomy-link-registry';
import {installRootEducationApi} from '../lib/root-education-api';

/** Separate specimens/nested dissection and assessment pause navigation;
 * they never inherit the root body's anatomical identity. */
export function useBodyEducationLink({entries,allowedIds,disabled,contextKey,enabled}:{
  entries:AnatomyLinkEntry[];allowedIds:string[];disabled:boolean;contextKey:string;enabled:boolean;
}){
  const state=useRef({allowed:new Set(allowedIds),disabled});
  const installed=useRef<ReturnType<typeof installRootEducationApi>|null>(null);
  useLayoutEffect(()=>{
    state.current={allowed:new Set(allowedIds),disabled};
    installed.current?.pause();
  },[allowedIds,disabled,contextKey]);
  useEffect(()=>{
    if(!enabled||!entries.length)return;
    const anatomy=entries.map(e=>({scope:'body' as const,structureId:e.id,sources:e.sources}));
    const start=()=>{
      if(installed.current)return;
      installed.current=installRootEducationApi(window,'body',anatomy,{
        canNavigate:()=>!state.current.disabled,
        canAccessAnatomy:a=>a.scope==='body'&&state.current.allowed.has(a.structureId),
      });
    };
    const stop=()=>{const current=installed.current;installed.current=null;current?.dispose();};
    start();window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);
    return ()=>{window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',start);stop();};
  },[enabled,entries]);
}
