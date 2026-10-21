import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=path=>readFileSync(new URL(path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frozen='fixtures/body-learning-epoch-history/';
const one=(text,before,after)=>{
 assert.equal(text.split(before).length,2,'exactly one declared seam: '+before.slice(0,80));
 return text.replace(before,after);
};
const exact=(name,digest,edits,extra='')=>{
 const currentName={
  'atlas190-current-delivery-190.test.mjs':'atlas190-current-delivery.test.mjs',
  'head-neck-pilot-190.test.ts':'head-neck-pilot.test.ts',
  'head-neck-pilot-current-190.test.mjs':'head-neck-pilot-current.test.mjs',
  'current-190-coverage-190.test.mjs':'current-190-coverage.test.mjs',
 }[name];
 assert(currentName);
 const before=read(frozen+name+'.raw'),after=read('fixtures/drawable-epoch-preimage/'+currentName+'.raw');
 assert.equal(sha(before),digest,'frozen prior190 test bytes: '+name);
 let expected=before.toString();
 for(const [from,to]of edits)expected=one(expected,from,to);
 assert.equal(after.toString(),expected+extra,'whole-source equality outside declared current-epoch seams: '+name);
 let inverse=after.toString();
 if(extra){assert(inverse.endsWith(extra));inverse=inverse.slice(0,-extra.length);}
 for(const [from,to]of edits.toReversed())inverse=one(inverse,to,from);
 assert.equal(inverse,before.toString(),'whole-source inverse: '+name);
};

test('prior190 and coverage witnesses are frozen, including all historical and negative assertions',()=>{
 for(const [name,digest]of [
  ['atlas190-current-delivery-190.test.mjs','71b86ce39f4173198760b9fb6f1e8fbaF2afa422f89d51e791e6ce47b59250ef'],
  ['head-neck-pilot-190.test.ts','97d2ab7dfdeab8ac28656bbc779c0a8bec3c08bf98cf05ff545658930372d1e1'],
  ['head-neck-pilot-current-190.test.mjs','2f8ccf5be49d159d03624c57eee7d698a573df5fb76189a6b52842d1684dff16'],
  ['current-190-coverage-190.test.mjs','5ec7577052250b5e6cc7a772b2e4b7fdedc04bf0091a85317dcbb96253718234'],
  ['coverage-index-190.json','7f9f872a80e7b45f33f73377d73671ca5d9ddcc08cf8a6fc072a6681b6424d68'],
 ])assert.equal(sha(read(frozen+name+'.raw')),digest.toLowerCase(),name);
});

test('source190/485 delivery proof has a complete inverse outside explicit 0df seams',()=>{
 exact('atlas190-current-delivery-190.test.mjs','71b86ce39f4173198760b9fb6f1e8fbaf2afa422f89d51e791e6ce47b59250ef',[
  ["  ['assert.equal(sourceFiles,1550);assert.equal(inputs,1707);assert(artifacts>100);','assert.equal(sourceFiles,1553);assert.equal(inputs,1710);assert(artifacts>100);'],",
   "  ['assert.equal(sourceFiles,1550);assert.equal(inputs,1707);assert(artifacts>100);','assert.equal(sourceFiles,1553);assert.equal(inputs,1710);assert(artifacts>100);'],\n  ['assert.equal(sourceFiles,1553);assert.equal(inputs,1710);assert(artifacts>100);','assert.equal(sourceFiles,1553);assert.equal(inputs,1712);assert(artifacts>100);'],"],
  ["read('tests/current-atlas-delivery.test.mjs')","read('tests/fixtures/body-learning-current-admission/current-atlas-delivery-190.test.mjs.raw')"],
  ["assert.equal(current,old.replace(previous,source));assert.equal(current.replace(source,previous),old)","assert.equal(current,old.replace(previous,'0dfce15890cafc0a2b8e309193531daa29a672ed'));assert.equal(current.replace('0dfce15890cafc0a2b8e309193531daa29a672ed',previous),old)"],
  ["test('source190 Review and every emitted learner file","test('current Review and every emitted learner file"],
  ["assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree)","assert.equal(pin.source,'0dfce15890cafc0a2b8e309193531daa29a672ed');assert.equal(pin.sourceTree,'18f4fa612d0209123488a9104c2e26089b06cfe3')"],
  ["assert.equal(m.sourceCommit,source);assert.equal(m.patientDataIncluded,false)","assert.equal(m.sourceCommit,pin.runtimeSources[module]);assert.equal(m.patientDataIncluded,false)"],
 ]);
});

test('head-pilot 9f and current scene assertions have a complete inverse',()=>{
 exact('head-neck-pilot-190.test.ts','97d2ab7dfdeab8ac28656bbc779c0a8bec3c08bf98cf05ff545658930372d1e1',[
  ["test('current190 head-neck scene","test('current0df head-neck scene"],
  ["assert.equal(sha(manifestBytes),'74ba7688c8dfd8939a160f56a04e7825b11183f947f1074c6825c0f39904d4ec')","assert.equal(sha(manifestBytes),'3d9d76b574673f40c7d05c5bbf01d58cc534dc0f13ef3f978199a3d26bb98f1b')"],
  ["assert.equal(manifest.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9')","assert.equal(manifest.sourceCommit,'0dfce15890cafc0a2b8e309193531daa29a672ed')"],
 ]);
});

test('current head-pilot keeps complete 9f/87ed proof outside exact current seams',()=>{
 const old=read(frozen+'head-neck-pilot-current-190.test.mjs.raw').toString();
 const oldUndo=old.split('\n').find(line=>line.startsWith('  undo("test(\'current190 head-neck scene'));
 assert(oldUndo);
 const newUndo=`  const priorPilot=readFileSync(new URL('./fixtures/body-learning-epoch-history/head-neck-pilot-190.test.ts.raw',import.meta.url),'utf8');\n  const oldScene=priorPilot.slice(priorPilot.indexOf("test('current190 head-neck scene remains separately source-bound and non-clinical'"));\n  assert(oldScene.startsWith("test('current190 head-neck scene"));\n  const newScene=oldScene.replace("test('current190 head-neck scene","test('current0df head-neck scene")\n    .replace('74ba7688c8dfd8939a160f56a04e7825b11183f947f1074c6825c0f39904d4ec','3d9d76b574673f40c7d05c5bbf01d58cc534dc0f13ef3f978199a3d26bb98f1b')\n    .replace('190a63238eadcf906abe89dcbb6a67c88afe70b9','0dfce15890cafc0a2b8e309193531daa29a672ed');\n  undo(newScene,'');`;
 exact('head-neck-pilot-current-190.test.mjs','2f8ccf5be49d159d03624c57eee7d698a573df5fb76189a6b52842d1684dff16',[
  [oldUndo,newUndo],
  ["test('current190 head-neck delivery independently","test('current0df head-neck delivery independently"],
  ["assert.equal(validateCurrentAtlasDelivery().source,'190a63238eadcf906abe89dcbb6a67c88afe70b9')","assert.equal(validateCurrentAtlasDelivery().runtimeSources['head-neck'],'0dfce15890cafc0a2b8e309193531daa29a672ed')"],
  ["assert.equal(sha(manifestBytes),'74ba7688c8dfd8939a160f56a04e7825b11183f947f1074c6825c0f39904d4ec')","assert.equal(sha(manifestBytes),'3d9d76b574673f40c7d05c5bbf01d58cc534dc0f13ef3f978199a3d26bb98f1b')"],
  ["assert.equal(manifest.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9')","assert.equal(manifest.sourceCommit,'0dfce15890cafc0a2b8e309193531daa29a672ed')"],
  ["assert.equal(sha(inputBytes),'8fa0c2f7108f8735b491f5172a68a31653160d9678654bab7d0fcc4fc03eb04f')","assert.equal(sha(inputBytes),'842db50d355da8bd3f09950fa81c7ce9f3dfce1b358c190b383797b73174886f')"],
  ["assert.equal(inputs.length,1511);\n  assert.equal(new Set(inputs.map(input=>input.path)).size,1511)","assert.equal(inputs.length,1513);\n  assert.equal(new Set(inputs.map(input=>input.path)).size,1513)"],
 ]);
});

test('coverage retains old485 and historical190 refusals outside exact current seams',()=>{
 const after=read('fixtures/drawable-epoch-preimage/current-190-coverage.test.mjs.raw').toString();
 const extra=after.slice(after.indexOf("\ntest('exact source190 coverage remains historical"));
 assert.equal(sha(extra),'c0980eab6c0d445716054962c0aa48b1b1ba5f4838d9c6a15128ef5fd1f31edb');
 exact('current-190-coverage-190.test.mjs','5ec7577052250b5e6cc7a772b2e4b7fdedc04bf0091a85317dcbb96253718234',[
  ["const source='190a63238eadcf906abe89dcbb6a67c88afe70b9'","const source='0dfce15890cafc0a2b8e309193531daa29a672ed'"],
  ["const currentIndexSha='7f9f872a80e7b45f33f73377d73671ca5d9ddcc08cf8a6fc072a6681b6424d68'","const currentIndexSha='99444c9b9038b44c6c504ef827d64c843ec07855ed5f38dbe412708c215d0123'"],
  ["test('source 190 coverage is byte-bound","test('current coverage is byte-bound"],
  ["assert(view,'actual 190 coverage must project')","assert(view,'actual current coverage must project')"],
 ],extra);
});
