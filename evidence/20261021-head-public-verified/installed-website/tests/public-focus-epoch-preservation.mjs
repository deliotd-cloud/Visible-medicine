import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function historicalSource(raw, recipe) {
 assert.equal(sha(raw), recipe.originalSha256, 'Complete original source witness');
 let source = raw.toString();
 for (const [before, after] of recipe.publicFocusSeams) {
  assert.equal(source.split(before).length, 2, 'Unique public-focus dependency seam');
  source = source.replace(before, after);
 }
 if (recipe.publishingDisclosure) {
  const {before, after} = recipe.publishingDisclosure;
  assert.equal(source.split(before).length, 2, 'Unique historical publishing assertion');
  source = source.replace(before, after);
 }
 assert.equal(sha(source), recipe.historicalSha256, 'Authentic complete Review preimage');
 assert.equal(Buffer.byteLength(source), recipe.historicalBytes);
 return source;
}
export function currentSource(historical, recipe) {
 assert.equal(sha(historical), recipe.historicalSha256, 'Exact historical epoch input required');
 let previousEnd = -1;
 for (const seam of recipe.currentSeams) {
  assert(Number.isSafeInteger(seam.at) && seam.at >= 0 && seam.at + seam.before.length <= historical.length, 'Seam offset stays within complete historical source');
  assert(seam.at > previousEnd, 'Ordered non-overlapping exact source seams');
  previousEnd = seam.at + seam.before.length - 1;
 }
 let source = historical;
 // Offsets are UTF-16 code units in the authenticated historical string.
 // Descending application keeps every declared offset tied to the original.
 for (const seam of [...recipe.currentSeams].reverse()) {
  assert.equal(source.slice(seam.at, seam.at + seam.before.length), seam.before, 'Exact forward source seam');
  source = source.slice(0, seam.at) + seam.after + source.slice(seam.at + seam.before.length);
 }
 assert.equal(sha(source), recipe.currentSha256, 'Entire reconstructed current source');
 assert.equal(Buffer.byteLength(source), recipe.currentBytes);
 return source;
}
export function inverseSource(current, recipe) {
 assert.equal(sha(current), recipe.currentSha256, 'Exact current epoch input required');
 let source = current, delta = 0;
 const seams = recipe.currentSeams.map(seam => {
  const at = seam.at + delta;
  delta += seam.after.length - seam.before.length;
  return {...seam, at};
 });
 for (const seam of seams.reverse()) {
  assert.equal(source.slice(seam.at, seam.at + seam.after.length), seam.after, 'Exact inverse source seam');
  source = source.slice(0, seam.at) + seam.before + source.slice(seam.at + seam.after.length);
 }
 assert.equal(sha(source), recipe.historicalSha256, 'Entire reconstructed historical source');
 return source;
}
export function admitCurrent(current, historical, recipe) {
 assert.equal(sha(current), recipe.currentSha256, 'Current mutations cannot enter the epoch proof');
 assert.deepEqual(Buffer.from(current), Buffer.from(currentSource(historical, recipe)), 'Only exact authenticated epoch seams admitted');
 assert.deepEqual(Buffer.from(inverseSource(current.toString(), recipe)), Buffer.from(historical), 'Lossless complete inverse');
}

