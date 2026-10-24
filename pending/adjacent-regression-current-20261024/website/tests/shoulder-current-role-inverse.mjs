import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const contracts={
 'clinical-review-elbow-us-followup.test.ts':{
  current:'2bea7ad3337d9e3dd912ae061203dbd6d036a61e1a03624c809b12944c0d9ead',
  prior:'8c52a386cff7675adf9862592386e28e4167d6e389f7b8a9c1780190e47fbe40'},
 'clinical-review-forearm-vascular-xray.test.ts':{
  current:'b6df69f8035211bf2ee253fa2d216cb598259e771917eefa44a468506cbcf85f',
  prior:'03a72a733f624b619737793d7bac519a5e9c2fef47f849be2481ac01f33a88d4'},
};

export function restoreShoulderCurrentRole(name,bytes){
 const contract=contracts[name];assert(contract,'Declared shoulder consumer only');
 assert.equal(sha(bytes),contract.current,'Exact current shoulder consumer');
 let source=bytes.toString();const eol=source.includes('\r\n')?'\r\n':'\n';
 const once=(after,before)=>{
  after=after.replaceAll('\n',eol);before=before.replaceAll('\n',eol);
  assert.equal(source.split(after).length,2,'One exact shoulder source-role seam');
  source=source.replace(after,before);
 };
 once("import {assertHistoricalShoulderSourceRole} from './historical-shoulder-source-role.mjs';\n",'');
 once("  const historicalShoulder=assertHistoricalShoulderSourceRole(checkedCurrent);\n  assert.equal(git(['merge-base',historicalShoulder,checkedCurrent.source]).toString().trim(),\n    historicalShoulder,'Earlier 190a runtime epoch precedes current Review');",
  "  assert.equal(checkedCurrent.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9',\n    'Earlier non-head runtime source remains pinned');\n  assert.equal(git(['merge-base',checkedCurrent.runtimeSources.shoulder,checkedCurrent.source]).toString().trim(),\n    checkedCurrent.runtimeSources.shoulder,'Earlier 190a runtime epoch precedes current Review');");
 const restored=Buffer.from(source);
 assert.equal(sha(restored),contract.prior,'Whole reviewed shoulder consumer restored');
 return restored;
}
