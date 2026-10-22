// Pure source-byte proof. Does not import or execute website tests, validators or products.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {restorePriorCurrentEpoch} from './CODE/tests/current-epoch-source-adapter.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const path=name=>new URL(name,import.meta.url);
const read=name=>readFileSync(path(name));
const one=(text,from,to,label)=>{
 assert.equal(text.split(from).length,2,'Exactly one '+label);
 return text.replace(from,to);
};
const oldImport="import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const newImport="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const oldCheck="  assert.equal(checkedCurrent.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');";
const newCheck="  assert.equal(checkedCurrent.source,CURRENT_ATLAS_REVISION,'Active Review source is authenticated current Atlas');\n  assert.equal(checkedCurrent.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9',\n    'Earlier non-head runtime source remains pinned');\n  assert.equal(git(['merge-base',checkedCurrent.runtimeSources.shoulder,checkedCurrent.source]).toString().trim(),\n    checkedCurrent.runtimeSources.shoulder,'Earlier 190a runtime epoch precedes current Review');";
const cases=[
 {name:'clinical-review-elbow-us-followup.test.ts',current:'8f16b3d999c5ee2964a5cce9d936debfeb5df51f8b3d50f6fa43183bf46f7776',raw:'dfe5b2522ed20791134dadd37a35e6fff235b4b7d8b139953a00252595159b7a',historical:'52ebcddab39cc165bf4c3c94dee0659abfea6814c92e55f85bf86f25eb6c57d8'},
 {name:'clinical-review-forearm-vascular-xray.test.ts',current:'90b1c26a19220053633a277b10d94b74c4d3c2f6ebc6e3cd8ccf4bccdd2fdda4',raw:'fca614cc591eb44623f87e36dd35cea42aa3ea0e755ede1118b368e871f06861',historical:'108d94b7a5b0ead7e302ab576b2f295d44eb7cd7c2229de686115402379b6778'},
];
assert.equal(sha(read('CODE/tests/current-epoch-source-adapter.mjs')),'2634cef4dc4e8c916cbe82d6ccb1d7d8068db259fb6b9f28dd8d3be11f8e6f65');
for(const item of cases){
 const current=read('CODE/tests/'+item.name),raw=read('RAW/tests/'+item.name);
 const historic=read('CODE/tests/fixtures/current-epoch-prior/'+item.name+'.raw');
 assert.equal(sha(current),item.current);assert.equal(sha(raw),item.raw);assert.equal(sha(historic),item.historical);
 assert.equal(current.includes(Buffer.from('\r\n')),false);assert.equal(raw.includes(Buffer.from('\r\n')),false);
 let inverse=current.toString('utf8');
 inverse=one(inverse,newImport,oldImport,item.name+' import inverse');
 inverse=one(inverse,newCheck,oldCheck,item.name+' source inverse');
 assert.deepEqual(Buffer.from(inverse),raw,'Full frozen current source inverse: '+item.name);
 assert.deepEqual(restorePriorCurrentEpoch(item.name,current),historic,'Actual authored adapter: '+item.name);
 for(const mutant of [
  current.toString('utf8').replace(newCheck,''),
  current.toString('utf8')+newCheck,
  current.toString('utf8').replace(newCheck,newCheck+' /* substituted */'),
 ])assert.throws(()=>restorePriorCurrentEpoch(item.name,Buffer.from(mutant)),
  'Actual adapter refuses missing, duplicate or substituted seam: '+item.name);
}
assert.throws(()=>restorePriorCurrentEpoch('not-admitted',Buffer.alloc(0)));

const witnessCases=[
 {name:'elbow-us-followup-preservation.test.mjs',raw:'63f4f423ece0998e8bd169d76aee2c46fe653e47593ee7f89cdc49fce2d29f4a',current:'8a6a1c29780e49def9403bd23a2f89a8929d8a15419ceadfa8471600b71e9431',source:'clinical-review-elbow-us-followup.test.ts'},
 {name:'forearm-xray-preservation.test.mjs',raw:'3d9822101754c23bd6a7d7e3645a30743f0ce0fc0299771c630634032f16a205',current:'00962f360369f102bacb269a8b3c328e277dd6c81bf4db0cf77282a7a26af40a',source:'clinical-review-forearm-vascular-xray.test.ts'},
];
for(const item of witnessCases){
 const raw=read('RAW/tests/'+item.name),current=read('CODE/tests/'+item.name);
 assert.equal(sha(raw),item.raw);assert.equal(sha(current),item.current);
 let inverse=current.toString('utf8');
 inverse=one(inverse,"import {restorePriorCurrentEpoch} from './current-epoch-source-adapter.mjs';\n",'',item.name+' adapter import');
 inverse=one(inverse,
  "candidateText=restorePriorCurrentEpoch(\n  '"+item.source+"',readFileSync(candidate)).toString('utf8')",
  "candidateText=readFileSync(candidate,'utf8')",item.name+' diagnostic inverse');
 const oldRegistered=item.name.startsWith('elbow')?
  'const bytes=readFileSync(candidate),text=bytes.toString(),inverse=changed=>inverseLaterXray(inversePlayback(changed));':
  'const bytes=readFileSync(candidate),text=bytes.toString(),proof=verify(bytes);';
 const newRegistered=item.name.startsWith('elbow')?
  "const bytes=restorePriorCurrentEpoch('"+item.source+"',readFileSync(candidate));\n const text=bytes.toString(),inverse=changed=>inverseLaterXray(inversePlayback(changed));":
  "const bytes=restorePriorCurrentEpoch('"+item.source+"',readFileSync(candidate));\n const text=bytes.toString(),proof=verify(bytes);";
 inverse=one(inverse,newRegistered,oldRegistered,item.name+' registered test inverse');
 if(item.name.startsWith('elbow')){
  // The exact added negative adapter test is bounded at EOF; the old test remains intact.
  const start="if(!process.argv.includes('--print-hunks'))test('current epoch adapter refuses missing, duplicate and substituted source or helper edits',()=>{\n";
  assert.equal(inverse.split(start).length,2,'Unique added refusal test');
  const at=inverse.indexOf(start);assert(inverse.slice(at).endsWith('});\n'),'Only complete EOF test removed');
  inverse=inverse.slice(0,at);
 }
 assert.deepEqual(Buffer.from(inverse),raw,'Full original witness inverse: '+item.name);
}
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const pin=JSON.parse(readFileSync(website+'/tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const atlas='F:/VisibleMedicine/atlas';
const git=args=>execFileSync('git',args,{cwd:atlas,encoding:'utf8'}).trim();
assert.equal(git(['rev-parse','HEAD']),pin.source);
assert.equal(git(['merge-base',pin.runtimeSources.shoulder,pin.source]),pin.runtimeSources.shoulder);
assert.equal(sha(readFileSync('F:/VisibleMedicine/staging/20261021-revision-guard-batch-v11/preimages/tests/clinical-review-elbow-us-followup.test.ts')),cases[0].historical);
assert.equal(sha(readFileSync('F:/VisibleMedicine/staging/20261021-revision-guard-batch-v11/preimages/tests/clinical-review-forearm-vascular-xray.test.ts')),cases[1].historical);
process.stdout.write('SOURCE_ONLY_OK: 4 whole-original inverses; 2 direct authored adapter successes; missing/duplicate/substituted mutants refused; historical preimages and Git roles authenticated. Native tests and validators deferred.\n');
