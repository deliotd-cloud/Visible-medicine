'use client';
import { useLayoutEffect, useRef } from 'react';
import { connectSpecimenSelectionChannel, specimenAvailableSnapshot, type SpecimenSelectionState, type SpecimenTarget } from '../lib/specimen-selection-channel';

/** The ref is updated only after a committed layout; speculative renders cannot receive commands. */
export function useSpecimenSelectionChannel(revision:string|undefined,state:SpecimenSelectionState,
  focus:(target:SpecimenTarget)=>boolean,available:()=>boolean) {
  const current=useRef<{state:SpecimenSelectionState;focus:(target:SpecimenTarget)=>boolean;available:()=>boolean}>({
    state:{status:'blocked',reason:'unavailable'},focus:()=>false,available:()=>false,
  });
  const connection=useRef<ReturnType<typeof connectSpecimenSelectionChannel>|null>(null);
  useLayoutEffect(()=>{
    if(!revision)return;
    const active=connectSpecimenSelectionChannel(window,revision,
      ()=>specimenAvailableSnapshot(current.current.state,current.current.available()),target=>current.current.focus(target));
    connection.current=active;
    return ()=>{
      current.current={state:{status:'blocked',reason:'unavailable'},focus:()=>false,available:()=>false};
      connection.current=null;active.close();
    };
  },[revision]);
  useLayoutEffect(()=>{
    current.current={state,focus,available};
  });
  const key=JSON.stringify(state);
  useLayoutEffect(()=>{connection.current?.publish();},[revision,key]);
}
