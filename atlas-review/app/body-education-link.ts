'use client';
import {useEffect,useLayoutEffect,useRef} from 'react';
import type {AnatomyLinkEntry} from '../lib/anatomy-link-registry';
import {installRootEducationApi} from '../lib/root-education-api';
import type {PausedTourImaging} from '../lib/paused-tour-imaging';

/** Separate specimens/nested dissection and assessment pause navigation;
 * they never inherit the root body's anatomical identity. */
export function useBodyEducationLink({entries,allowedIds,disabled,contextKey,enabled,pausedTour,allowPausedTour=false}:{
  entries:AnatomyLinkEntry[];allowedIds:string[];disabled:boolean;contextKey:string;enabled:boolean;
  pausedTour?:PausedTourImaging;allowPausedTour?:boolean;
}){
  const state=useRef({allowed:new Set(allowedIds),disabled,pausedTour,allowPausedTour});
  const installed=useRef<ReturnType<typeof installRootEducationApi>|null>(null);
  useLayoutEffect(()=>{
    state.current={allowed:new Set(allowedIds),disabled,pausedTour,allowPausedTour};
    // Tours do not enable manual navigation. An exact paused stop owns a
    // separate outgoing gate; retaining host opt-in never bypasses its policy.
    if(allowPausedTour===true)installed.current?.cancelPending();
    else installed.current?.pause();
  },[allowedIds,disabled,contextKey,pausedTour,allowPausedTour]);
  useLayoutEffect(()=>pausedTour?.subscribeInvalidation(()=>installed.current?.cancelPending()),[pausedTour]);
  useEffect(()=>{
    if(!enabled||!entries.length)return;
    const anatomy=entries.map(e=>({scope:'body' as const,structureId:e.id,sources:e.sources}));
    const start=()=>{
      if(installed.current)return;
      installed.current=installRootEducationApi(window,'body',anatomy,{
        canNavigate:()=>!state.current.disabled ||
          (state.current.allowPausedTour===true&&state.current.pausedTour?.canNavigate()===true),
        canAccessAnatomy:a=>a.scope==='body'&&state.current.allowed.has(a.structureId)&&
          (!state.current.disabled ||
            (state.current.allowPausedTour===true&&state.current.pausedTour?.canAccessAnatomy(a)===true)),
      });
    };
    const stop=()=>{state.current.pausedTour?.suspend();const current=installed.current;installed.current=null;current?.dispose();};
    start();window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);
    return ()=>{window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',start);stop();};
  },[enabled,entries]);
}
