// Test-only complete source mapping. It does not claim historical execution.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function restorePreHeadFocusCurrentDeliverySource(current){
 assert.equal(hash(current),'2bb765ce69cd47ca7821ba2320ac16659f9c0fc154939d82772228f75ec5f67d','Exact head-focus current delivery test source');
 const focusRow="  {path:'components/HeadAtlasInlineComparison.tsx',sha256:'01cb27b46a034bc50f21ec6b639f736e4d12c86b14f92b527d02adbba7c6081e'},\n";
 assert.equal(current.split(focusRow).length,2,'One exact component binding transition');
 assert.equal(current.split("'cd2912d0b7ba9458cba4eba9bb8a5321d49262602c5ead9f959a9d43946251a3'").length,2,'One exact Review binding transition');
 const prior=current.replace(focusRow,'').replace('cd2912d0b7ba9458cba4eba9bb8a5321d49262602c5ead9f959a9d43946251a3','1f36393188a11f9e8ff56cb54ff3cd9d50c504f3b47de3e21cde422b2104e996');
 assert.equal(hash(prior),'f37c68190b412a885a7e4bf9d3bfd33b08608844a6e46d5299d8f6ce1f7fb20e','Complete ef17831d delivery source restored');
 return prior;
}
function restoreNativeImagesAndDistributionAudit(current){
 assert.equal(hash(current),'f37c68190b412a885a7e4bf9d3bfd33b08608844a6e46d5299d8f6ce1f7fb20e','Exact 1866-input native-image delivery source');
 const marker="\ntest('native public images add exactly six bound input changes without changing source revisions'";
 assert.equal(current.split(marker).length,2,'One exact native-image successor case');
 let prior=current.slice(0,current.indexOf(marker));
 const one=(from,to)=>{assert.equal(prior.split(from).length,2,'Exact native-image inverse seam');prior=prior.replace(from,to);};
 one('assert.equal(inputs,1866);','assert.equal(inputs,1862);');
 one('assert.equal(binding.inputs.length,1866);','assert.equal(binding.inputs.length,1862);');
 one(" const baseline='G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final/website';\n const receipt=readFileSync('G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final/SOURCE2.json');assert.equal(sha(receipt),'a4a8e70bd6c17d8960f8f056f64558ced5756095c1a40501d636a6d06dca6356');\n const rows=JSON.parse(receipt).sourceRows;\n const historicalRead=path=>{const matches=rows.filter(row=>row.path===path);assert.equal(matches.length,1,'One exact historical source row: '+path);const bytes=readFileSync(baseline+'/'+path);assert.equal(bytes.length,matches[0].bytes,path+' receipt byte length');assert.equal(sha(bytes),matches[0].sha256,path+' receipt SHA-256');return bytes;};\n",'');
 one("const current=historicalRead('tests/current-atlas-delivery.test.mjs').toString();assert.equal(sha(current),'e968312bb048176b2fb0b3c2452fd4afad818aea99a89d737ab5935500cf075d');","const current=read('tests/current-atlas-delivery.test.mjs').toString();");
 one("const binding=JSON.parse(historicalRead('atlas-review/integration-inputs.json'));","const binding=JSON.parse(read('atlas-review/integration-inputs.json'));");
 one('sha(historicalRead(audit[0].path))','sha(read(audit[0].path))');
 assert.equal(hash(prior),'e968312bb048176b2fb0b3c2452fd4afad818aea99a89d737ab5935500cf075d','Complete 1862-input predecessor source');
 const distribution="\ntest('distribution audit binding accounts for the one additional source without changing the preceding contract'";
 assert.equal(prior.split(distribution).length,2,'One exact distribution-audit successor case');
 let earlier=prior.slice(0,prior.indexOf(distribution));
 for(const[from,to]of[['assert.equal(inputs,1862);','assert.equal(inputs,1861);'],['assert.equal(binding.inputs.length,1862);','assert.equal(binding.inputs.length,1861);']]){
  assert.equal(earlier.split(from).length,2,'One exact distribution input count');earlier=earlier.replace(from,to);
 }
 assert.equal(hash(earlier),'dfd4195012a9ac2661ba28b069416bfb2412d5859c96b71c1149aeacdcd2b2f7','Complete pre-audit delivery source');
 return earlier;
}
const edits=[
  [
    "9cef8900417bf592d3130f6ff92bf3e748cb55fc",
    "ea2413a6ea7e932f3ed6911bea15797037519ab7",
    6
  ],
  [
    "3d71e1e991e8a6cb69e6fac6f085c87ede58afd0",
    "24cb47f810f6454e06a6157a24899c1f39b3a8b3",
    2
  ],
  [
    ",1640",
    ",1625",
    3
  ],
  [
    ",1851",
    ",1833",
    2
  ],
  [
    "current 9cef delivery retains the verified abdominal ultrasound sources",
    "current 27b abdominal ultrasound delivery preserves all 44 predecessor cases",
    1
  ],
  [
    " const preferences=binding.inputs.filter(row=>row.path==='lib/head-tour-speed-preference.ts');assert.equal(preferences.length,1);assert.equal(preferences[0].sha256,sha(read('lib/head-tour-speed-preference.ts')),'The new playback preference is bound to the exact Review source');\n",
    "",
    1
  ],
  [
    "});\n\ntest('historical 27b delivery preserves all 44 predecessor cases',()=>{\n",
    "",
    1
  ]
];
export function restorePreRecoveryCurrentDeliverySource(current){
 assert.equal(typeof current,'string');assert.equal(hash(current),'dfd4195012a9ac2661ba28b069416bfb2412d5859c96b71c1149aeacdcd2b2f7','Exact c32 note-recovery current contract');
 const added=" const recovery=binding.inputs.filter(row=>row.path==='lib/head-teaching-review-recovery.ts');assert.equal(recovery.length,1);assert.equal(recovery[0].sha256,sha(read('lib/head-teaching-review-recovery.ts')),'Note recovery remains bound to the exact Review presentation');\n";assert.equal(current.split(added).length,2,'One exact new recovery binding assertion');let prior=current.replace(added,'');
 for(const [before,after,count]of [["9cef8900417bf592d3130f6ff92bf3e748cb55fc","c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3",6],["3d71e1e991e8a6cb69e6fac6f085c87ede58afd0","d7ead7f3673ddf5c4b68db755b559b08b921eec6",2],[",1640",",1647",3],[",1852",",1861",2],["current 9cef delivery retains the verified abdominal ultrasound sources","current c32 delivery retains the verified abdominal ultrasound sources",1]]){assert.equal(prior.split(after).length-1,count,'Exact c32 delivery transition');prior=prior.replaceAll(after,before);}
 assert.equal(hash(prior),'95f246d6f65f5b6afb06b8e4a9c6eb47a00313e03aadf22bba271822eaea3fdd','Every complete predecessor assertion remains intact');return prior;
}
export function predecessorDeliverySource(current){
 if(hash(current)==='2bb765ce69cd47ca7821ba2320ac16659f9c0fc154939d82772228f75ec5f67d')current=restorePreHeadFocusCurrentDeliverySource(current);
 if(hash(current)==='f37c68190b412a885a7e4bf9d3bfd33b08608844a6e46d5299d8f6ce1f7fb20e')current=restoreNativeImagesAndDistributionAudit(current);
 current=restorePreRecoveryCurrentDeliverySource(current);
 assert.equal(hash(current),'95f246d6f65f5b6afb06b8e4a9c6eb47a00313e03aadf22bba271822eaea3fdd','Exact successor contract including all active refusal cases');
 assert.equal(current.split(',1852').length-1,2,'Only the two current Review input counts change');
 const prior=current.replaceAll(',1852',',1851');
 assert.equal(hash(prior),'101be6f4288eff0f4c351207260095c32e86cfe02f38c1df218c420c0c5241ee','All preceding executable assertions remain byte-exact');
 let before=prior;for(const [a,b,count]of edits){assert.equal(before.split(a).length-1,count,'Exact declared delivery transition seam');before=before.replaceAll(a,b);}
 assert.equal(hash(before),'ad5a1db42623b9a35d023c5b867a85a6cc776c8cf4982c1d2664628161bf900e','Exact whole predecessor contract');
 return before;
}
