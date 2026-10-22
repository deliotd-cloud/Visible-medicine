// Pure whole-source inverse. No Atlas corpus or clinical test module is imported.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const historical='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const cases=[
 ['internal-iliac-ultrasound','61cf9e46f449ff2f842d6c8e47da95b7fc2bcab49dd4a1c60e7115678f792e5a','d463ac9cde2fe0ceeb1edf2a348c679b3ddc16bb644050aa8af228bf1874dc3d','sourceCommit','sourceFiles',"['head-neck']",2],
 ['pectoral-ultrasound','815c986d956ea88382005a5a5170d888f4f61903ed30ffe0fb0abebcd3193317','3d243b0041685bcaac16eb271be4f7d6891a2485f7fbfeff406e53b83ba0d1fc','revision','sourceHashes',"['head-neck','shoulder']",2],
 ['orbital-support-quiz','a32c560ec260c8e61d5323f3b2b6609fe835605c5787acc0165c5a218432d94a','fe12516289eb6a2c6d971d3d0e44b186d6cfba00beda3deda7bc95150a436954','revision','sourceHashes',"['head-neck','shoulder']",2],
 ['root-cuff-xray','2c93c2858c3182fca210eefd015354cb33649f33292b75fe8c41297293c5ebb5','d2c4793602ca673a0ed31b050304a74f523941cd47730ed02fb4f900ae2b258e','sourceCommit','sourceFiles',"['head-neck']",2],
 ['iliac-xray','a7286bfc1a0b77f08d55df7059d41a9a4ab7cf7d52e21cba04a7d179218fb77e','421e61f85dce6d50bb7a1dff92d9e7e8af40f207e3f12650a5c741787e7b955b','revision','sourceHashes',"['head-neck']",4],
];
function once(text,needle,replacement){
 assert.equal(text.split(needle).length,2,`exact seam ${needle.slice(0,75)}`);
 return text.replace(needle,replacement);
}
function inverse(candidate,[name,, ,historicalName,sourceName,scopes,count]){
 let text=candidate;
 const admission=historicalName==='revision'&&sourceName==='sourceHashes'?'revision,sourceHashes':`revision:${historicalName},sourceHashes:${sourceName}`;
 const line=`const currentRevision=admitPreservedClinicalReview({${admission},learnerModules:${scopes}});`;
 text=once(text,(name==='orbital-support-quiz'||name==='iliac-xray'?' ':'  ')+line+'\n','');
 const gate=/assert\.equal\((?:review\.revision|learner\.sourceCommit|manifest\.sourceCommit|viewer\.sourceCommit),currentRevision(?=[,)])/g;
 assert.equal((text.match(gate)||[]).length,name==='iliac-xray'?3:count,`${name}: moving gates`);
 text=text.replace(gate,match=>match.replace(',currentRevision',','+historicalName));
 if(name==='iliac-xray'){
  text=once(text,'const committed=source(currentRevision,path);','const committed=source(revision,path);');
  text=once(text,"const atlas=currentAtlasDeliveryRoot();\nconst sourceHashes={\n 'content/iliac-arterial-imaging-pins.json':'6abb3fc545c8810c55ad12acb14c55cde194874e6d181193a38f33a0a257a6a9',\n 'content/iliac-arterial-xray.ts':'dfbc8796c47cd4f796911e385892594f0579917b028a3ecb7e1369b58f1e3420',\n 'lib/iliac-arterial-xray.ts':'af3da9dd5e960844b3dc1b52231aa472944887b83e8dc98df360e0a5b1c162d6',\n};", "const atlas='F:/VisibleMedicine/atlas';");
  text=once(text,"import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n",'');
 }
 return once(text,"import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';\n",'');
}
function verify(row,bytes){
 const [name,oldHash,newHash]=row;
 const old=readFileSync(new URL(`./fixtures/clinical-review-${name}.original.ts.raw`,import.meta.url));
 assert.equal(sha(old),oldHash,`${name}: exact frozen preimage`);
 assert.equal(sha(bytes),newHash,`${name}: exact candidate`);
 assert(!old.includes(13)&&!bytes.includes(13),`${name}: LF-only byte scope`);
 const actual=bytes.toString('utf8'),expected=old.toString('utf8');
 assert.equal(Buffer.byteLength(actual),bytes.length);
 assert.equal(Buffer.byteLength(expected),old.length);
 assert.equal((actual.match(/^test\(/gm)||[]).length,(expected.match(/^test\(/gm)||[]).length,`${name}: registrations`);
 assert.equal(inverse(actual,row),expected,`${name}: complete controlled inverse`);
}
test('five current imaging seams preserve entire exact originals and reject tampering',()=>{
 for(const row of cases){
  const name=row[0],bytes=readFileSync(new URL(`./clinical-review-${name}.test.ts`,import.meta.url));
  verify(row,bytes);
  for(const [from,to] of [['currentRevision','revision'],['admitPreservedClinicalReview','admitWeakReview']])
   assert.throws(()=>verify(row,Buffer.from(bytes.toString().replace(from,to))),`${name}: ${from} tamper`);
  assert.throws(()=>verify(row,Buffer.from('if(false){\n'+bytes+'\n}')),`${name}: disabled-body tamper`);
 }
});
