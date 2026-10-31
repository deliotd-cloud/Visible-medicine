import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {restoreRegionalScopeCatalogue,regionalScopeCatalogueHashes} from './regional-scope-catalogue-inverse.mjs';
const sha=text=>createHash('sha256').update(text).digest('hex');
/** Historical step proposal proof only. Current duration behavior has its own tests. */
export function restoreRegionalDurationCatalogue(source){
 if(sha(source)===regionalScopeCatalogueHashes.current)source=restoreRegionalScopeCatalogue(source);
 assert.equal(sha(source),'84aef27d93e941ef938a0a63bb3bc3eebe7b4ee689ad179968d465bde282272d','Exact duration-aware catalogue');
 const seams=[
  ["import {guidedPlaybackDuration} from '../atlas-review/lib/guided-playback';\n",''],
  ['      const continuousPlaybackMs=tour.steps.reduce((total,step)=>total+guidedPlaybackDuration(step.caption,step.durationMs,1),0);\n',''],
  ['        limitations:regionalTourLimitations(tour),steps,\n        ...(Number.isSafeInteger(continuousPlaybackMs)&&continuousPlaybackMs>0&&continuousPlaybackMs<=24*60*60*1000?{continuousPlaybackMs}:{} )});','        limitations:regionalTourLimitations(tour),steps});'],
 ];
 for(const [after,before]of seams){assert.equal(source.split(after).length,2,'One exact authored duration seam');source=source.replace(after,before);}
 assert.equal(sha(source),'ce8ed296310c459fac979b4d8f1f52745e46a0877ec10801a728aeaebeedba93','Entire preceding catalogue');return source;
}
