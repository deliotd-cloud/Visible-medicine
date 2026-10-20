import assert from 'node:assert/strict';

/** Remove only the authored guided-playback extraction from the later shoulder source.
 * The caller must compare the entire returned file to the immutable earlier Git blob. */
export function inverseGuidedShoulderTour(source){
 assert.equal(typeof source,'string');
 const importLine="import { guidedPlaybackEvidence } from './guided-playback';\n";
 const arrayHead='const shoulderTourSteps = [\n';
 const arrayTail='];\nexport const shoulderTour = {';
 const playback='  steps: shoulderTourSteps,\n  continuousPlayback: guidedPlaybackEvidence(shoulderTourSteps),';
 for(const marker of [importLine,arrayHead,arrayTail,playback])
  assert.equal(source.split(marker).length,2,'Guided shoulder marker must occur exactly once: '+marker.slice(0,45));
 const start=source.indexOf(arrayHead)+arrayHead.length,end=source.indexOf(arrayTail,start);
 assert(end>start,'Extracted shoulder steps missing');
 const steps=source.slice(start,end);
 assert.equal((steps.match(/^    step\('/gm)??[]).length,5,'Exact five authored shoulder stops required');
 return source.replace(importLine,'').replace(arrayHead+steps+arrayTail,'export const shoulderTour = {')
  .replace(playback,`  steps: [\n${steps}  ],`);
}
