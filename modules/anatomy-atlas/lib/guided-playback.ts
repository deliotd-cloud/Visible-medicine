/** Shared cinematic playback for existing and future 3D guided learning. */
export const GUIDED_SWEEP_MS=8000;
export const GUIDED_MIN_STEP_MS=24000;
export const GUIDED_CAPTION_WORDS_PER_MINUTE=180;

/** Allow a slow camera arrival, then enough time to read the complete caption. */
export function guidedPlaybackDuration(caption:string,authoredDuration=0):number{
  const words=caption.trim().split(/\s+/u).filter(Boolean).length;
  const authored=Number.isFinite(authoredDuration)&&authoredDuration>0?authoredDuration:0;
  return Math.max(GUIDED_MIN_STEP_MS,authored,
    GUIDED_SWEEP_MS+Math.ceil(words*60000/GUIDED_CAPTION_WORDS_PER_MINUTE));
}

export function guidedPlaybackEvidence(steps:readonly {caption:string;durationMs?:number}[]){
  return {version:1,start:'explicit-play-full-tour',transition:'quintic-orbit',
    transitionMs:GUIDED_SWEEP_MS,minimumStepMs:GUIDED_MIN_STEP_MS,
    captionWordsPerMinute:GUIDED_CAPTION_WORDS_PER_MINUTE,
    stepDurationsMs:steps.map(step=>guidedPlaybackDuration(step.caption,step.durationMs)),
    final:'hold',reducedMotion:'no-camera-sweep'} as const;
}
