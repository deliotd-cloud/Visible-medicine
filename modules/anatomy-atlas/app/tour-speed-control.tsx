import {GUIDED_PLAYBACK_RATES,isGuidedPlaybackRate,type GuidedPlaybackRate} from '@/lib/guided-playback';
import './tour-speed-control.css';

/** Shared by every 3D tour; changing speed never starts or advances playback. */
export function TourSpeedControl({rate,onRateChange,disabled=false}:{rate:GuidedPlaybackRate;onRateChange:(rate:GuidedPlaybackRate)=>void;disabled?:boolean}){
  return <label className="tour-speed-control"><span>Tour speed</span><select aria-label="Tour speed" value={rate} disabled={disabled} onChange={event=>{
    const next=Number(event.currentTarget.value);
    if(!disabled&&isGuidedPlaybackRate(next)&&next!==rate)onRateChange(next);
  }}>{GUIDED_PLAYBACK_RATES.map(value=><option key={value} value={value}>{value}×{value===1?' · Normal':value===0.5?' · Slower':value===3?' · Fastest':''}</option>)}</select></label>;
}
