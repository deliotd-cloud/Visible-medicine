import assert from 'node:assert/strict';
import {loadLiveLearningComponent} from './learning-frame-loader-transition.mjs';

export const liveLearningConsumerModule=await loadLiveLearningComponent(new URL('../',import.meta.url));

/** An exact inverse for the additive loader seams in historical consumer tests. */
export function stripConsumerLoader(text,seams){
  for(const seam of seams){
    const [added,prior]=Array.isArray(seam)?seam:[seam,''];
    assert.equal(text.split(added).length,2,`Missing or duplicate consumer loader seam: ${added.trim()}`);
    text=text.replace(added,prior);
  }
  return text;
}
