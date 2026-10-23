import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=text=>createHash('sha256').update(text).digest('hex');
export const closed56LaterEdits=[
 [" assert.equal(pin.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');"," assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
 [" assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');"," assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');"],
 [" assert.equal(pin.reviewSourceFiles,review.files.length);"," assert.equal(pin.reviewSourceFiles,review.files.length);\n assert.equal(review.files.length,1553);\n assert.equal(inputs.inputs.length,1710);\n const inventory=JSON.parse(readFileSync(new URL('../lib/atlas-model-inventory.json',import.meta.url)));\n assert.equal(inventory.models.length,137);\n assert.equal(inventory.models.flatMap(model=>model.paths).length,144);"],
 [" assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"," assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"],
 [" assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');"," assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');\n assert.deepEqual(pin.runtimeSources,{'head-neck':pin.source,shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9','lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9','female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9'});"],
 [" assert.equal(review.files.length,1553);"," assert.equal(review.files.length,1558);"],
 [" assert.equal(inputs.inputs.length,1710);"," assert.equal(inputs.inputs.length,1723);"],
];
const blocks=[
 ['  const familyTitle=','  let expected=text;','62a91d8ad39327bea7b2ec978f05de0fcb0fb05ab2335d43791cb3ae8433b7b1'],
 ['  const prior=expected;','  const actual=readFileSync','39f22aa8d720bcdc9613682e2517246417a031fc2d0c2eecbc4f7e760dbf7f40'],
 ['  assert.equal(expected.endsWith(familyRefusal)','  for(const [before,after,count] of edits.toReversed())','e591bae8fbae815e273246f73a961608b2b736f3d18afe633ea5717d08016114'],
];

// Invert only the three reviewed family additions and the independently observed
// current input count. Each removed span has its own byte identity and bounds.
export function reconstructClosed56BeforeFamily(current,expectedPrior){
 let prior=current;
 for(const [start,end,digest] of blocks){
  assert.equal(prior.split(start).length,2,'Unique family start: '+start);
  assert.equal(prior.split(end).length,2,'Unique family end: '+end);
  const from=prior.indexOf(start),to=prior.indexOf(end,from+start.length);
  assert(to>from,'Ordered family bounds: '+start);
  const removed=prior.slice(from,to);
  assert.equal(sha(removed),digest,'Exact reviewed family span: '+start);
  prior=prior.slice(0,from)+prior.slice(to);
 }
 const after=' assert.equal(inputs.inputs.length,1724);';
 const before=' assert.equal(inputs.inputs.length,1723);';
 assert.equal(prior.split(after).length,2,'Unique current 1724 input count');
 prior=prior.replace(after,before);
 assert(!prior.includes('familyRefusal')&&!prior.includes('reconstructFamilyPrior'),'No family addition remains');
 if(expectedPrior!==undefined)assert.equal(prior,expectedPrior,'Complete pre-family source restored');
 return prior;
}
