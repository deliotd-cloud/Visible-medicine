'use client';
import {useEffect,useRef,useState} from 'react';
import type {HeadEntry,LoadedStudy,Modality} from '../lib/head-atlas-import';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import';
import {HEAD_STUDY_SET_LIMIT} from '../lib/head-study-set';
import {HEAD_STUDY_PLAN_KEY,parseHeadStudyPlan,resolveHeadStudyPlan,type HeadStudyPlan} from '../lib/head-study-plan';

/** Explicit concept-only persistence; no source labels, masks, paths or answers. */
export function HeadAtlasSavedStudyPlan(props:{plan:HeadStudyPlan|null;entries:HeadEntry[];
  study:LoadedStudy;modality:Modality;canUse:()=>boolean;onRestore:(plan:HeadStudyPlan)=>void}){
  const [raw,setRaw]=useState<string|null>(null),[available,setAvailable]=useState(false),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const latest=useRef(props);latest.current=props;
  const rawRef=useRef(raw);rawRef.current=raw;
  const mounted=useRef(false),pending=useRef(false);
  const saved=parseHeadStudyPlan(raw),candidate=props.plan?parseHeadStudyPlan(JSON.stringify(props.plan)):null;
  const candidateKey=candidate?JSON.stringify(candidate):null;
  const identity=useRef({study:props.study,modality:props.modality,entries:props.entries,candidateKey,epoch:0});
  const previous=identity.current;
  if(previous.study!==props.study||previous.modality!==props.modality||previous.candidateKey!==candidateKey||
    previous.entries.length!==props.entries.length||previous.entries.some((entry,index)=>entry!==props.entries[index])){
    identity.current={study:props.study,modality:props.modality,entries:props.entries,candidateKey,epoch:previous.epoch+1};
  }
  const renderEpoch=identity.current.epoch;
  useEffect(()=>{
    mounted.current=true;
    const read=()=>{try{const value=window.localStorage.getItem(HEAD_STUDY_PLAN_KEY);if(rawRef.current!==value)identity.current.epoch++;
      rawRef.current=value;setRaw(value);setAvailable(true);}
      catch{if(rawRef.current!==null)identity.current.epoch++;rawRef.current=null;setRaw(null);setAvailable(false);setNotice('Browser storage is unavailable. This scan’s study set still works.');}};
    const storage=(event:StorageEvent)=>{if(event.key===null||event.key===HEAD_STUDY_PLAN_KEY){setNotice('');read();}};
    read();window.addEventListener('storage',storage);
    return()=>{mounted.current=false;identity.current.epoch++;window.removeEventListener('storage',storage);};
  },[]);
  const resolved=resolveHeadStudyPlan(saved,props.study,HEAD_MANIFEST_SHA256,props.modality);
  const additions=resolved.filter(entry=>!props.entries.includes(entry));
  const count=Math.min(additions.length,HEAD_STUDY_SET_LIMIT-props.entries.length);
  const same=!!saved&&!!candidate&&JSON.stringify(saved)===JSON.stringify(candidate);
  function current(){
    if(!mounted.current||identity.current.epoch!==renderEpoch||!latest.current.canUse())return false;
    if(rawRef.current!==raw){setNotice('The saved plan changed in another tab. Review it before continuing.');return false;}
    try{const stored=window.localStorage.getItem(HEAD_STUDY_PLAN_KEY);
      if(stored!==raw){rawRef.current=stored;identity.current.epoch++;setRaw(stored);setNotice('The saved plan changed in another tab. Review it before continuing.');return false;}
      return true;
    }catch{setNotice('Browser storage is unavailable. No study set changed.');return false;}
  }
  async function mutate(kind:'save'|'remove'){
    if(pending.current||!mounted.current||identity.current.epoch!==renderEpoch||!latest.current.canUse()||!available||kind==='save'&&!candidateKey)return;
    if(rawRef.current!==raw){setNotice('The saved plan changed in another tab. Review it before continuing.');return;}
    if(typeof navigator==='undefined'||!navigator.locks?.request){
      setNotice('Safe cross-tab plan storage is unavailable in this browser. Saving and removal are disabled; you can still restore a saved plan.');return;
    }
    pending.current=true;setBusy(true);setNotice('Checking the saved plan…');
    try{
      await navigator.locks.request(`visible-medicine:head-study-plan:${HEAD_STUDY_PLAN_KEY}`,()=>{
        // The lock serializes the read, comparison and write across tabs.
        if(!current())return;
        if(kind==='save'){
          const value=candidateKey!;
          window.localStorage.setItem(HEAD_STUDY_PLAN_KEY,value);
          if(window.localStorage.getItem(HEAD_STUDY_PLAN_KEY)!==value)throw Error('Not retained');
          rawRef.current=value;identity.current.epoch++;setRaw(value);setNotice('Mapped anatomy concepts saved in this browser. No scan or score saved.');
        }else{
          window.localStorage.removeItem(HEAD_STUDY_PLAN_KEY);
          if(window.localStorage.getItem(HEAD_STUDY_PLAN_KEY)!==null)throw Error('Not removed');
          rawRef.current=null;identity.current.epoch++;setRaw(null);setNotice('Saved plan removed. The current study set is unchanged.');
        }
      });
    }catch{
      if(mounted.current&&identity.current.epoch===renderEpoch)setNotice(kind==='save'?'The plan could not be saved. Browser storage may be blocked or full.':'The saved plan could not be removed.');
    }finally{pending.current=false;if(mounted.current){
      setNotice(previous=>previous==='Checking the saved plan…'?'The plan action was cancelled. Review the current study set before continuing.':previous);
      setBusy(false);
    }}
  }
  function save(){void mutate('save');}
  function restore(){if(pending.current||!saved||!count||!current())return;latest.current.onRestore(saved);setNotice(`${count} available concepts added. Existing entries stay; practice has not started.`);}
  function remove(){void mutate('remove');}
  return <details className="head-saved-study-plan" onKeyDown={event=>{
    if(event.key!=='Escape'||!event.currentTarget.open)return;
    event.preventDefault();event.stopPropagation();event.currentTarget.open=false;
    event.currentTarget.querySelector('summary')?.focus();
  }}>
    <summary>Save or restore a plan{saved?` · ${saved.conceptIds.length}`:''}</summary>
    <p>Optional: keep one mapped anatomy plan in this browser. Shared-device users can see it. No scans, filenames, scores or annotations are saved.</p>
    {props.entries.length>0&&<><button type="button" disabled={busy||!available||!candidate||same} onClick={save}>{same?'This mapped plan is saved':raw?'Replace saved plan':'Save mapped plan'}</button>
      <p>{candidate?.conceptIds.length??0} of {props.entries.length} study-set entries have a supported concept. Unmapped entries are not saved.</p></>}
    {saved?<><p>{saved.conceptIds.length} saved concepts · {resolved.length} available as unambiguous masks in this scan.</p>
      <button type="button" disabled={busy||!available||!count} onClick={restore}>Add saved concepts to this set ({count})</button>
      <p>{additions.length>count?`${count} of ${additions.length} new matches fit; the ${HEAD_STUDY_SET_LIMIT}-item limit preserves existing entries. `:''}Only available matches in the loaded scan are added, in saved order. Different subjects are not spatially synchronized; no access is granted.</p></>:raw!==null?<p>This saved plan is invalid or outdated. It cannot be restored.</p>:<p>No plan saved yet.</p>}
    {raw!==null&&<button type="button" disabled={busy||!available} onClick={event=>{event.currentTarget.closest('details')?.querySelector('summary')?.focus();remove();}}>Remove saved plan</button>}
    <p role="status">{notice}</p>
  </details>;
}
