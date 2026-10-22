// Pure source-byte proof; imports no website product or native test module.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {restoreQuestionFamilyPrior,questionFamilyNames} from './CODE/tests/question-source-family-inverse.mjs';
const root=new URL('.',import.meta.url).pathname.replace(/^\/(?=[A-Z]:\/)/,'');
const sha=b=>createHash('sha256').update(b).digest('hex');
const oldHashes={
 'clinical-review-spinal-disc-ultrasound.test.ts':'0c28be9eefcd1378b3e498e3aa1de9f2be2f9c3be1e3652d487b3a4f587522bf',
 'clinical-review-thoracic-quiz.test.ts':'3cfd396b7380760b75443b4ba76e1e0aa9bd85433c700bcd7f22da230543936a',
 'clinical-review-suprahyoid-quiz.test.ts':'302c5bf4d5bdb567932497cd2cdf7d71d8e286a4ff5274908fc04905f6f31b43',
};
const newHashes={
 'clinical-review-spinal-disc-ultrasound.test.ts':'223b09e5473e293925b1e990b5a572b2d5fa084178939201c43e578fece1fd59',
 'clinical-review-thoracic-quiz.test.ts':'891cc344b49840b6f259989b8fdff6c652c37a6c76e4f12027d08b4ac2b0afd0',
 'clinical-review-suprahyoid-quiz.test.ts':'a3b05ac7918d48cad0231a4a01dd36a743492b0bc3bfc9713e896e15f905d0c1',
};
assert.deepEqual(Object.keys(oldHashes),questionFamilyNames);
for(const name of questionFamilyNames){
 const raw=readFileSync(join(root,'RAW/tests',name));
 const code=readFileSync(join(root,'CODE/tests',name));
 const fixture=readFileSync(join(root,'CODE/tests/fixtures/question-family-prior',name+'.raw'));
 assert.equal(sha(raw),oldHashes[name]);assert.equal(sha(fixture),oldHashes[name]);
 assert.equal(sha(code),newHashes[name]);
 assert.deepEqual(restoreQuestionFamilyPrior(name,code),raw);
 for(const mutant of [code.subarray(1),Buffer.concat([code,code]),
  Buffer.concat([code.subarray(0,1),Buffer.from([code[1]^1]),code.subarray(2)])])
  assert.throws(()=>restoreQuestionFamilyPrior(name,mutant),name+' source mutant refusal');
 const bad=Buffer.concat([fixture.subarray(0,1),Buffer.from([fixture[1]^1]),fixture.subarray(2)]);
 assert.throws(()=>restoreQuestionFamilyPrior(name,code,{readPrior:()=>bad}),name+' fixture mutant refusal');
}
assert.throws(()=>restoreQuestionFamilyPrior('other',Buffer.alloc(0)),'undeclared source refusal');

function once(text,from,to,label){
 const at=text.indexOf(from);assert.notEqual(at,-1,label+' missing seam');
 assert.equal(text.indexOf(from,at+from.length),-1,label+' duplicate seam');
 return text.slice(0,at)+to+text.slice(at+from.length);
}
const importQuestion="import {restoreQuestionFamilyPrior} from './question-source-family-inverse.mjs';\n";
const importShoulder="import {restorePriorShoulderFamily} from './shoulder-source-family-inverse.mjs';\n";
const candidateBefore="  assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' unknown assertion or behavior edit');";
const imageShoulder="  const current=readFileSync(join(here,name));\n  const candidate=name==='clinical-review-shoulder-ct.test.ts'\n   ?restorePriorShoulderFamily(name,current):current;\n  assert.deepEqual(candidate,Buffer.from(expected),name+' unknown assertion or behavior edit');";
const imageQuestion="  const current=readFileSync(join(here,name));\n  const candidate=name==='clinical-review-shoulder-ct.test.ts'\n   ?restorePriorShoulderFamily(name,current)\n   :name==='clinical-review-spinal-disc-ultrasound.test.ts'||name==='clinical-review-thoracic-quiz.test.ts'\n    ?restoreQuestionFamilyPrior(name,current):current;\n  assert.deepEqual(candidate,Buffer.from(expected),name+' unknown assertion or behavior edit');";
const limbShoulder="  const current=readFileSync(join(here,name));\n  const candidate=name==='clinical-review-shoulder-girdle-artery-quiz.test.ts'\n   ?restorePriorShoulderFamily(name,current):current;\n  assert.deepEqual(candidate,Buffer.from(expected),name+' unknown assertion or behavior edit');";
const limbQuestion="  const current=readFileSync(join(here,name));\n  const candidate=name==='clinical-review-shoulder-girdle-artery-quiz.test.ts'\n   ?restorePriorShoulderFamily(name,current)\n   :name==='clinical-review-suprahyoid-quiz.test.ts'\n    ?restoreQuestionFamilyPrior(name,current):current;\n  assert.deepEqual(candidate,Buffer.from(expected),name+' unknown assertion or behavior edit');";
const witnesses={
 'clinical-imaging-role-preservation-20261021.test.mjs':{
  base:'6a5663260ede388a42fc262940c0c6f5300765ca536ae420c6d588fe8c4be5ff',
  shoulder:'92c0cb889ca52b374094b719562cfeac989d5deb465ae3869ac7022c578570e9',
  current:'b54a3ec4ed6982ab9c22d7be3c3c6ba761c434d805af1e196c01664a8c8d13d4',
  oldCandidate:imageShoulder,newCandidate:imageQuestion,
 },
 'limb-suprahyoid-role-preservation-20261021.test.mjs':{
  base:'b9359849ff93c19f51d555d33e0ca772625632a08855d6d1f6822dac84203aa7',
  shoulder:'f8391fa35956ff31b470673da1601a177fa6f4a33bd3dc63cb587c7f8d699f48',
  current:'81a6a02d6a25426c64e9cd7a313e19a3be1b4ab44183b0a89c0c90000076a038',
  oldCandidate:limbShoulder,newCandidate:limbQuestion,
 },
};
for(const [name,item] of Object.entries(witnesses)){
 const base=readFileSync(join(root,'CODE/tests/fixtures/question-family-witness-base',name+'.raw'));
 const shoulder=readFileSync(join(root,'RAW/tests',name));
 const code=readFileSync(join(root,'CODE/tests',name));
 assert.equal(sha(base),item.base);assert.equal(sha(shoulder),item.shoulder);assert.equal(sha(code),item.current);
 let expected=shoulder.toString();
 expected=once(expected,importShoulder,importShoulder+importQuestion,name);
 expected=once(expected,item.oldCandidate,item.newCandidate,name);
 assert.deepEqual(code,Buffer.from(expected),name+' shoulder→question forward whole-source proof');
 let inverse=code.toString();
 inverse=once(inverse,item.newCandidate,item.oldCandidate,name);
 inverse=once(inverse,importShoulder+importQuestion,importShoulder,name);
 assert.deepEqual(Buffer.from(inverse),shoulder,name+' question→shoulder whole-source inverse');
 inverse=once(inverse,item.oldCandidate,candidateBefore,name);
 inverse=once(inverse,importShoulder,'',name);
 assert.deepEqual(Buffer.from(inverse),base,name+' shoulder→original whole-source inverse');
 for(const mutant of [code.subarray(1),Buffer.concat([code,code]),
  Buffer.concat([code.subarray(0,1),Buffer.from([code[1]^1]),code.subarray(2)])])
  assert.notDeepEqual(mutant,Buffer.from(expected),name+' source mutant refusal');
}
const salivary='clinical-review-salivary-stylohyoid-quiz.test.ts';
assert.equal(sha(readFileSync(join(root,'RAW/tests',salivary))),
 'a6fea25a4dd1bde5c87d02cf993459a44c255a735e73ef9e0e7b20331309696a');

const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
assert.deepEqual(readFileSync(join(root,'RAW/tests',salivary)),readFileSync(join(website,'tests',salivary)),
 'Salivary frozen original retained; no CODE proposal pending separate coherent witness closure');
const atlas='F:/VisibleMedicine/atlas';
const pin=JSON.parse(readFileSync(join(website,'tests/fixtures/current-atlas-delivery.json')));
const review=JSON.parse(readFileSync(join(website,'atlas-review/manifest.json')));
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const family='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const historical='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const git=(...args)=>execFileSync('git',['-C',atlas,...args],
 {windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:32e6});
assert.equal(git('rev-parse','HEAD').toString().trim(),current);
assert.equal(pin.source,current);assert.equal(review.revision,current);
assert.equal(pin.runtimeSources['head-neck'],current);assert.equal(pin.runtimeSources.shoulder,family);
const paths=['content/spinal-disc-ultrasound.ts','lib/spinal-disc-ultrasound.ts','content/spine-imaging-pins.json',
 'content/thoracic-quiz.ts','content/thoracic-quiz-pins.json','lib/thoracic-quiz.ts',
 'content/suprahyoid-muscle-quiz-pins.json','content/suprahyoid-muscle-quiz.ts','lib/suprahyoid-muscle-quiz.ts'];
for(const path of paths){
 const old=git('show',historical+':'+path);
 assert.deepEqual(git('show',family+':'+path),old,path+' immutable shoulder-family source');
 assert.deepEqual(git('show',current+':'+path),old,path+' immutable current Review source');
}
assert.equal(sha(git('show',current+':app/body-content.ts')),
 '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
assert.equal(sha(git('show',family+':app/body-content.ts')),
 '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');
console.log('PASS: 3 actual clinical helper inverses/mutants; 2 complete question→shoulder→original witness inverses/mutants; exact family Git roles; salivary unchanged.');
