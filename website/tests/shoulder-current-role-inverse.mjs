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

// The b79 shoulder source witness was added after the reviewed elbow adapter.
// Admit that complete later root, recover the exact prior input, then run the
// unchanged shoulder role inverse below.
function restoreElbowB79Successor(bytes){
 assert.equal(sha(bytes),'eddc3c4ae42e954aba37176ac0eeda8549b8e676c99702b03adcab8cb5e064bb',
  'Exact later elbow consumer');
 let source=bytes.toString('utf8');assert.deepEqual(Buffer.from(source),bytes,'Lossless elbow successor source');
 const eol=source.includes('\r\n')?'\r\n':'\n';
 const after=[
  "  const b79Root='F:/VisibleMedicine/staging/20261024-cervical-vascular-website/website';",
  "  const b79PinBytes=readFileSync(b79Root+'/tests/fixtures/current-atlas-delivery.json');",
  "  assert.equal(sha(b79PinBytes),'c6ae4cccc92593ab75982b1d0ad1c10f3ee2b4f408c85e86bf0a94460365bad0');",
  "  const b79Pin=JSON.parse(b79PinBytes.toString());",
  "  assert.equal(b79Pin.source,'b79e110d2d28f18993263926ba35aa7a3f478b20');",
  "  for(const path of ['public/atlas-runtime/shoulder/manifest.json','public/atlas-runtime/shoulder/source-inputs.json'])",
  "    assert.equal(sha(readFileSync(b79Root+'/'+path)),b79Pin.documents[path],path+' authenticated b79 artifact');",
  '  const historicalShoulder=assertHistoricalShoulderSourceRole(b79Pin);',
 ].join('\n').replaceAll('\n',eol);
 assert.equal(source.split(after).length,2,'One exact b79 shoulder source-witness block');
 source=source.replace(after,'  const historicalShoulder=assertHistoricalShoulderSourceRole(checkedCurrent);');
 const restored=Buffer.from(source);
 assert.equal(sha(restored),'2bea7ad3337d9e3dd912ae061203dbd6d036a61e1a03624c809b12944c0d9ead',
  'Complete prior elbow shoulder adapter input restored');
 return restored;
}

export function restoreShoulderCurrentRole(name,bytes){
 if(name==='clinical-review-elbow-us-followup.test.ts'&&sha(bytes)==='eddc3c4ae42e954aba37176ac0eeda8549b8e676c99702b03adcab8cb5e064bb')
  bytes=restoreElbowB79Successor(bytes);
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
