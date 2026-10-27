// Exact outer projection of the viewport-era test harnesses to their parent
// sources. The compact manifest contains changed lines only, never a preimage.
import assert from 'node:assert/strict';
import {restoreHeadHistoryFlow} from './head-history-flow-inverse.mjs';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=readFileSync(new URL('./head-viewport-inverse-hunks.json',import.meta.url));
assert.equal(sha(manifestBytes),'2b43ec279251dd0a8cc6dac7d90ad9892d528bcd4c28e9bee4ad5c9aaac29b9e','Sealed viewport projection manifest');
const manifest=JSON.parse(manifestBytes.toString('utf8'));
const harnessNames=new Set([
 'head-image-history.test.ts','head-pan-interruption.test.ts','head-slice-zoom.test.ts',
 'head-pane-expansion-labels.test.mjs','native-slice-commit.test.mjs',
 'head-slice-keyboard.test.ts','head-mask-picking-ui.test.ts',
]);
function lines(bytes){
 const text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Lossless UTF-8 test source');
 assert(!text.includes('\r'),'Exact LF test source');
 return text.match(/[^\n]*\n|[^\n]+$/g)??[];
}
function project(spec,currentBytes){
 assert(Buffer.isBuffer(currentBytes),'Buffer source required');
 assert.equal(sha(currentBytes),spec.after,'Exact current viewport harness');
 const current=lines(currentBytes),prior=[...current];
 for(const h of [...spec.hunks].reverse()){
  assert.deepEqual(prior.slice(h.newStart,h.newStart+h.added.length),h.added,'Exact added hunk');
  prior.splice(h.newStart,h.added.length,...h.removed);
 }
 const previousBytes=Buffer.from(prior.join(''));
 assert.equal(sha(previousBytes),spec.before,'Exact reconstructed parent harness');
 const rebuilt=[...prior];
 for(const h of [...spec.hunks].reverse()){
  assert.deepEqual(rebuilt.slice(h.oldStart,h.oldStart+h.removed.length),h.removed,'Exact removed hunk');
  rebuilt.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.deepEqual(rebuilt,current,'Exact current harness rebuilt');
 return previousBytes;
}
export function restoreViewportHarness(name,currentBytes){
 assert(harnessNames.has(name),'Only seven named viewport harnesses');
 if(name==='head-image-history.test.ts')currentBytes=restoreHeadHistoryFlow(currentBytes);
 return project(manifest.harnesses[name],currentBytes);
}
export function restoreViewportTransition(currentBytes){
 return project(manifest.transition,currentBytes);
}
