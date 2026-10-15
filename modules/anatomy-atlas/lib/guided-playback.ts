/** Shared cinematic playback for existing and future 3D guided learning. */
export const GUIDED_SWEEP_MS=8000;
export const GUIDED_MIN_STEP_MS=24000;
export const GUIDED_CAPTION_WORDS_PER_MINUTE=180;
export const GUIDED_PLAYBACK_RATES=[0.5,1,1.5,2,3] as const;
export type GuidedPlaybackRate=typeof GUIDED_PLAYBACK_RATES[number];

export function isGuidedPlaybackRate(value:unknown):value is GuidedPlaybackRate{
  return typeof value==='number'&&GUIDED_PLAYBACK_RATES.some(rate=>rate===value);
}

/** Runtime preference only; authored evidence remains the original 1x policy. */
export function guidedSweepDuration(rate:GuidedPlaybackRate=1):number{
  return Math.ceil(GUIDED_SWEEP_MS/(isGuidedPlaybackRate(rate)?rate:1));
}

/** Allow a slow camera arrival, then enough time to read the complete caption. */
export function guidedPlaybackDuration(caption:string,authoredDuration=0,rate:GuidedPlaybackRate=1):number{
  const words=caption.trim().split(/\s+/u).filter(Boolean).length;
  const authored=Number.isFinite(authoredDuration)&&authoredDuration>0?authoredDuration:0;
  const baseline=Math.max(GUIDED_MIN_STEP_MS,authored,
    GUIDED_SWEEP_MS+Math.ceil(words*60000/GUIDED_CAPTION_WORDS_PER_MINUTE));
  return Math.ceil(baseline/(isGuidedPlaybackRate(rate)?rate:1));
}

export function guidedPlaybackEvidence(steps:readonly {caption:string;durationMs?:number}[]){
  return {version:1,start:'explicit-play-full-tour',transition:'quintic-orbit',
    transitionMs:GUIDED_SWEEP_MS,minimumStepMs:GUIDED_MIN_STEP_MS,
    captionWordsPerMinute:GUIDED_CAPTION_WORDS_PER_MINUTE,
    stepDurationsMs:steps.map(step=>guidedPlaybackDuration(step.caption,step.durationMs)),
    final:'hold',reducedMotion:'no-camera-sweep'} as const;
}
