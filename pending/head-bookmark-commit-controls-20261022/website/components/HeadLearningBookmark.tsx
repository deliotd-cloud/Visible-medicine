'use client';
import {useEffect,useLayoutEffect,useRef,useState,type MouseEvent} from 'react';
import Link from 'next/link';
import type {HeadLearningPosition} from '../lib/head-atlas-learning';
import {HEAD_LEARNING_BOOKMARK_KEY,createHeadLearningBookmark,parseHeadLearningBookmark,resolveHeadLearningBookmark} from '../lib/head-learning-bookmark';
import './head-learning-bookmark.css';

const changed='vm-head-learning-bookmark-changed';
/** Explicit browser-only bookmark, never an automatic progress or patient record. */
export function HeadLearningBookmark({position,modality,onOpenCurrent}:{position?:HeadLearningPosition;
  modality?:'CT'|'MRI';onOpenCurrent?:(position:HeadLearningPosition)=>boolean}){
  const [raw,setRaw]=useState<string|null>(null),[notice,setNotice]=useState('');
  const [available,setAvailable]=useState(false),[busy,setBusy]=useState(false);
  const rawRef=useRef<string|null>(null),mounted=useRef(false),pending=useRef(false);
  const identity=useRef<{candidate:string|null;epoch:number;token:object|null}>({candidate:null,epoch:0,token:null});
  const candidate=position?createHeadLearningBookmark(position):null;
  const candidateKey=candidate?JSON.stringify(candidate):null;
  const renderToken={};
  useLayoutEffect(()=>{
    if(identity.current.candidate!==candidateKey)identity.current.epoch++;
    identity.current.candidate=candidateKey;
    identity.current.token=renderToken;
    return()=>{if(identity.current.token===renderToken)identity.current.token=null;};
  });
  useEffect(()=>{
    mounted.current=true;
    function read(){try{const value=window.localStorage.getItem(HEAD_LEARNING_BOOKMARK_KEY);
      if(rawRef.current!==value)identity.current.epoch++;
      rawRef.current=value;setRaw(value);setAvailable(true);}
      catch{if(rawRef.current!==null)identity.current.epoch++;rawRef.current=null;setAvailable(false);setRaw(null);setNotice('Browser storage is unavailable. You can still use the tour.');}}
    const storage=(event:StorageEvent)=>{if(event.key===null||event.key===HEAD_LEARNING_BOOKMARK_KEY){setNotice('');read();}};
    read();window.addEventListener(changed,read);window.addEventListener('storage',storage);
    return()=>{mounted.current=false;identity.current.epoch++;identity.current.token=null;window.removeEventListener(changed,read);window.removeEventListener('storage',storage);};
  },[]);
  const saved=parseHeadLearningBookmark(raw),navigation=saved?resolveHeadLearningBookmark(saved):null;
  const same=!!saved&&!!candidate&&saved.schema===candidate.schema&&
    saved.sequenceId===candidate.sequenceId&&saved.conceptId===candidate.conceptId&&
    saved.headRevision===candidate.headRevision&&saved.sequenceRevision===candidate.sequenceRevision;
  async function mutate(kind:'save'|'remove'){
    if(identity.current.token!==renderToken||pending.current||!mounted.current||!available||kind==='save'&&!candidateKey||kind==='remove'&&raw===null)return;
    if(rawRef.current!==raw){setNotice('The saved step changed. Review it before continuing.');return;}
    if(!window.navigator?.locks?.request){setNotice('Safe cross-tab bookmark storage is unavailable in this browser. Saving and removal are disabled; saved links remain available.');return;}
    const snapshot={raw,candidateKey,epoch:identity.current.epoch};
    pending.current=true;setBusy(true);setNotice('Checking the saved step…');
    const current=()=>mounted.current&&identity.current.token!==null&&identity.current.epoch===snapshot.epoch&&identity.current.candidate===snapshot.candidateKey&&rawRef.current===snapshot.raw;
    try{
      await window.navigator.locks.request(`visible-medicine:head-learning-bookmark:${HEAD_LEARNING_BOOKMARK_KEY}`,()=>{
        if(!current())return;
        const stored=window.localStorage.getItem(HEAD_LEARNING_BOOKMARK_KEY);
        if(stored!==snapshot.raw){rawRef.current=stored;identity.current.epoch++;setRaw(stored);setNotice('The saved step changed in another tab. Review it before continuing.');return;}
        if(kind==='save'){
          if(!snapshot.candidateKey)return;
          window.localStorage.setItem(HEAD_LEARNING_BOOKMARK_KEY,snapshot.candidateKey);
          if(window.localStorage.getItem(HEAD_LEARNING_BOOKMARK_KEY)!==snapshot.candidateKey)throw Error('Not retained');
          rawRef.current=snapshot.candidateKey;identity.current.epoch++;setRaw(snapshot.candidateKey);
          setNotice('Step saved in this browser. No progress or completion recorded.');
        }else{
          window.localStorage.removeItem(HEAD_LEARNING_BOOKMARK_KEY);
          if(window.localStorage.getItem(HEAD_LEARNING_BOOKMARK_KEY)!==null)throw Error('Not removed');
          rawRef.current=null;identity.current.epoch++;setRaw(null);setNotice('Saved step removed.');
        }
        window.dispatchEvent(new Event(changed));
      });
    }catch{if(current())setNotice(kind==='save'?'The step could not be saved. Browser storage may be blocked or full.':'The saved step could not be removed. Check browser storage settings.');}
    finally{pending.current=false;if(mounted.current&&identity.current.token!==null){
      if(identity.current.epoch!==snapshot.epoch)setNotice(previous=>previous==='Checking the saved step…'?'The bookmark action was cancelled. Review the current step before continuing.':previous);
      setBusy(false);
    }}
  }
  function save(){void mutate('save');}
  function remove(){void mutate('remove');}
  function openSavedInCurrentView(event:MouseEvent<HTMLAnchorElement>,target:'CT'|'MRI'){
    if(!onOpenCurrent||modality!==target||event.defaultPrevented||event.button!==0||
      event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||
      event.currentTarget.hasAttribute('download')||
      (event.currentTarget.target&&event.currentTarget.target!=='_self'))return;
    // The rendered link is only a snapshot. Re-read and revalidate the exact
    // bookmark before handing its semantic position to this loaded viewer.
    if(!mounted.current||identity.current.token!==renderToken){event.preventDefault();return;}
    let stored:string|null;
    try{stored=window.localStorage.getItem(HEAD_LEARNING_BOOKMARK_KEY);}catch{
      event.preventDefault();setNotice('Browser storage is unavailable. Review the saved step before continuing.');return;
    }
    if(stored!==raw||rawRef.current!==raw){
      event.preventDefault();rawRef.current=stored;identity.current.epoch++;setRaw(stored);
      setNotice('The saved step changed. Review it before continuing.');return;
    }
    const current=stored?parseHeadLearningBookmark(stored):null;
    const resolved=current?resolveHeadLearningBookmark(current):null;
    const href=target==='CT'?resolved?.current.ctHref:resolved?.current.mriHref;
    if(!current||!navigation||href!==(target==='CT'?navigation.current.ctHref:navigation.current.mriHref)){
      event.preventDefault();setNotice('The saved step is outdated or unavailable. Review it before continuing.');return;
    }
    if(onOpenCurrent({sequenceId:current.sequenceId,conceptId:current.conceptId}))event.preventDefault();
  }
  return <details className="head-learning-bookmark" onKeyDown={event=>{
    if(event.key!=='Escape'||!event.currentTarget.open)return;
    event.preventDefault();event.stopPropagation();event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();
  }}>
    <summary>Saved step</summary>
    <div className="head-learning-bookmark-panel">
      <p>One bookmark in this browser only. No scans, scores or completion saved. Shared-device users can see it.</p>
      {candidate&&<button type="button" disabled={busy||!available||same} onClick={save}>{same?'This step is saved':raw?'Replace with this step':'Save this step'}</button>}
      {navigation?<>
        <p><strong>{navigation.sequenceLabel}</strong><br/>Step {navigation.index+1} / {navigation.total} · {navigation.label}</p>
        <nav aria-label="Open saved tour step">
          {navigation.current.atlasHref&&<a href={navigation.current.atlasHref} aria-label={`Open saved ${navigation.label} step in the 3D Atlas`}>3D</a>}
          {navigation.current.ctHref&&<Link href={navigation.current.ctHref} prefetch={false} onClick={event=>openSavedInCurrentView(event,'CT')} aria-label={`Open saved ${navigation.label} step in CT`}>CT</Link>}
          {navigation.current.mriHref&&<Link href={navigation.current.mriHref} prefetch={false} onClick={event=>openSavedInCurrentView(event,'MRI')} aria-label={`Open saved ${navigation.label} step in MRI`}>MRI</Link>}
        </nav>
        <p>A configured local CT/MRI preview opens automatically; otherwise choose the approved folder. Separate subjects; no spatial synchronization or access granted.</p>
      </>:<p>{raw!==null?'This bookmark is outdated or invalid. It cannot be resumed; choose a current tour step.':'No step saved yet. Open a linked tour and choose Save this step.'}</p>}
      {raw!==null&&<button type="button" disabled={busy||!available} onClick={remove}>Remove saved step</button>}
      <p role="status">{notice}</p>
    </div>
  </details>;
}
