'use client';

import {useEffect,useLayoutEffect,useRef,useState,type MutableRefObject} from 'react';
import {GUIDED_PLAYBACK_RATES,guidedPlaybackDuration,isGuidedPlaybackRate,type GuidedPlaybackRate} from '../atlas-review/lib/guided-playback';

type Props={
  context:object;step:number;total:number;caption:string;ready:boolean;blocked:boolean;
  pauseRef:MutableRefObject<(()=>void)|null>;onAdvance:(next:number)=>boolean;
};
type Snapshot=Props&{token:number};
type Timer={handle:ReturnType<typeof setTimeout>};
const valid=(value:Snapshot)=>Number.isSafeInteger(value.step)&&Number.isSafeInteger(value.total)&&value.total>=2&&value.step>=0&&value.step<value.total;

/** The parent alone proves that an image and its exact annotation are painted. */
export function RegionalMriGuidePlayback(props:Props){
  const {context,step,total,caption,ready,blocked,pauseRef,onAdvance}=props;
  const [playing,setPlaying]=useState(false);
  const [rate,setRate]=useState<GuidedPlaybackRate>(1);
  const [status,setStatus]=useState('Guide paused.');
  const [motionReduced,setMotionReduced]=useState(false);
  const renderCount=useRef(0),token=++renderCount.current;
  const committed=useRef<Snapshot|null>(null);
  const active=useRef(false),generation=useRef(0),timer=useRef<Timer|null>(null);
  const waitingFrom=useRef<number|null>(null);
  const mounted=useRef(true);
  const selectedRate=useRef<GuidedPlaybackRate>(1);

  const clearTimer=()=>{const old=timer.current;timer.current=null;if(old){generation.current++;clearTimeout(old.handle);}};
  const pause=(message='Guide paused.')=>{
    generation.current++;
    active.current=false;waitingFrom.current=null;clearTimer();
    if(mounted.current){setPlaying(false);setStatus(message);}
  };
  const unsafe=()=>typeof document!=='undefined'&&document.hidden||
    typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arm=(current:Snapshot)=>{
    if(!active.current||timer.current||waitingFrom.current!==null||!valid(current)||!current.ready||current.blocked||unsafe())return;
    if(current.step>=current.total-1){pause('Last step reached. Final annotation held.');return;}
    const owner=generation.current;
    const handle=setTimeout(()=>{
      const live=committed.current;
      if(owner!==generation.current||!active.current||timer.current?.handle!==handle)return;
      timer.current=null;
      if(!live||!valid(live)||live.context!==current.context||live.step!==current.step||
        live.total!==current.total||live.caption!==current.caption||!live.ready||live.blocked||unsafe()){
        pause('Guide paused because its source or availability changed.');return;
      }
      waitingFrom.current=current.step;
      setStatus('Waiting for the next verified annotation.');
      let accepted=false;
      try{accepted=live.onAdvance(current.step+1);}catch{pause('Next annotation unavailable. Select a step manually.');return;}
      if(owner!==generation.current||!active.current)return;
      if(!accepted){pause('Manual step selection needed to continue.');return;}
      // The parent may have committed synchronously inside onAdvance.
      const after=committed.current;
      if(after&&after.context===current.context&&after.step===current.step+1&&after.ready){
        waitingFrom.current=null;arm(after);
      }
    },guidedPlaybackDuration(current.caption,0,selectedRate.current));
    timer.current={handle};
  };

  useLayoutEffect(()=>{
    mounted.current=true;if(!active.current)setPlaying(false);
    return()=>{mounted.current=false;committed.current=null;generation.current++;active.current=false;waitingFrom.current=null;clearTimer();};
  },[]);
  useLayoutEffect(()=>{
    const previous=committed.current;
    const current:Snapshot={...props,token};
    committed.current=current;
    if(!active.current)return;
    if(!valid(current)||current.blocked||current.context!==previous?.context||current.total!==previous?.total||
      current.step===previous?.step&&current.caption!==previous.caption){
      pause('Guide paused because its source or availability changed.');return;
    }
    const expected=waitingFrom.current;
    if(expected!==null){
      if(current.step===expected){clearTimer();return;}
      if(current.step!==expected+1){pause('Guide paused after a manual step change.');return;}
      waitingFrom.current=null;
      clearTimer();
    }else if(current.step!==previous?.step){
      pause('Guide paused after a manual step change.');return;
    }
    if(!current.ready){clearTimer();setStatus('Waiting for this annotation to be painted.');return;}
    setStatus('Guide playing.');
    arm(current);
  });

  useLayoutEffect(()=>{
    const registered=()=>{if(mounted.current&&committed.current)pause();};
    pauseRef.current=registered;
    return()=>{if(pauseRef.current===registered)pauseRef.current=null;pause();};
  },[pauseRef]);
  useEffect(()=>{
    const interrupt=()=>pause();
    const visibility=()=>{if(document.hidden)interrupt();};
    const media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
    setMotionReduced(!!media?.matches);
    if(media?.matches)setStatus('Reduced motion is on. Use Previous and Next steps.');
    const motion=()=>{setMotionReduced(!!media?.matches);pause(media?.matches?'Reduced motion is on. Use Previous and Next steps.':'Guide paused.');};
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('blur',interrupt);
    media?.addEventListener?.('change',motion);
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',interrupt);media?.removeEventListener?.('change',motion);};
  },[]);

  const play=()=>{
    const current=committed.current;
    if(!mounted.current||!current||current.token!==token||active.current||current.blocked||!valid(current)||current.step>=current.total-1)return;
    if(unsafe()){pause('Automatic playback unavailable while hidden or reduced motion is on. Use Previous and Next steps.');return;}
    generation.current++;clearTimer();waitingFrom.current=null;
    active.current=true;setPlaying(true);
    setStatus(current.ready?'Guide playing.':'Waiting for this annotation to be painted.');
    if(current.ready)arm(current);
  };
  const changeRate=(value:string)=>{
    if(!mounted.current||committed.current?.token!==token)return;
    const parsed=Number(value);
    if(!isGuidedPlaybackRate(parsed))return;
    pause();selectedRate.current=parsed;setRate(parsed);
  };
  return <div className="regional-mri-review__guide-actions" role="group" aria-label="Automatic guide playback" data-regional-guide-playback="">
    <button type="button" onClick={playing?()=>{if(mounted.current&&committed.current?.token===token)pause();}:play}
      disabled={!playing&&(blocked||motionReduced||!Number.isSafeInteger(total)||!Number.isSafeInteger(step)||total<2||step<0||step>=total-1)}>{playing?'Pause':'Play guide'}</button>
    <label>Speed <select aria-label="Guide playback speed" value={rate}
      onChange={event=>changeRate(event.currentTarget.value)}>
      {GUIDED_PLAYBACK_RATES.map(value=><option key={value} value={value}>{value}×</option>)}
    </select></label>
    <span role="status">{status}</span>
  </div>;
}
