import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Mechanical source-only queue assembly. Never imports website or validator code.
const staging='F:/VisibleMedicine/staging';
const basePath=`${staging}/20261022-regional-tour-orbital-family-consolidated/QUEUE.json`;
const output=`${staging}/20261022-clinical-runtime-family-consolidated/QUEUE.json`;
const website=`${staging}/20261022-review-recovery-website-candidate/website`;
const receiptPath=`${staging}/20261022-review-recovery-website-candidate/VERIFIED_SOURCE.json`;
const receiptSha='1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3';
const baseSha='fe42957087638a24a934a5f1edddd7c44b38841951f8b0e76b2d2584df282a76';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fileSha=path=>sha(readFileSync(path));
const stage=name=>`${staging}/20261022-${name}`;
const shoulder=stage('shoulder-source-family-admission');
const pancreatic=stage('pancreatic-portal-renal-family-admission');
const connective=stage('connective-source-family-admission');
const thoracic=stage('thoracic-family-admission');
const question=stage('question-imaging-family-admission');
const teaching=stage('teaching-question-family-admission-v2');
const salivary=stage('salivary-family-admission');
const product=stage('regional-link-product-preservation');
const inlineProduct=stage('regional-mri-runtime-linking');

const packets=[
 {name:'shoulder',root:shoulder,code:'CODE/tests',raw:'RAW/tests',
  repairs:[
   'clinical-review-shoulder-ct.test.ts','clinical-review-shoulder-girdle-artery-quiz.test.ts',
   'clinical-review-shoulder-muscle-xray.test.ts','clinical-review-shoulder-vessel-xray.test.ts',
   'clinical-review-thoracoacromial-ultrasound.test.ts',
   'clinical-imaging-role-preservation-20261021.test.mjs',
   'limb-suprahyoid-role-preservation-20261021.test.mjs',
   'shoulder-muscle-role-preservation-20261021.test.mjs'],
  extras:[
   'shoulder-source-family-inverse.mjs',
   ...['clinical-review-shoulder-ct.test.ts','clinical-review-shoulder-girdle-artery-quiz.test.ts',
    'clinical-review-shoulder-muscle-xray.test.ts','clinical-review-shoulder-vessel-xray.test.ts',
    'clinical-review-thoracoacromial-ultrasound.test.ts'].map(n=>`fixtures/shoulder-family-prior/${n}.raw`)],
  proofs:['SOURCE_PROOF.mjs']},
 {name:'pancreatic',root:pancreatic,code:'proposal/tests',raw:'original/tests',
  repairs:[
   'clinical-review-pancreatic-arterial-tour.test.ts','clinical-review-pancreatic-arterial-xray.test.ts',
   'clinical-review-pancreatic-vessel-teaching.test.ts','clinical-review-portal-venous-xray.test.ts',
   'clinical-review-renal-xray.test.ts','clinical-epoch-batch-d-preservation.test.mjs',
   'clinical-review-portal-venous-current-admission.test.mjs','ui-teaching-admission-contract.test.mjs'],
  extras:[
   'clinical-pancreatic-portal-composition.mjs',
   'fixtures/pancreatic-portal-frozen/clinical-review-pancreatic-vessel-teaching.test.ts.raw',
   'fixtures/pancreatic-portal-frozen/clinical-review-portal-venous-current-admission.test.mjs.raw',
   'fixtures/pancreatic-portal-frozen/clinical-review-portal-venous-xray.test.ts.raw'],
  proofs:['prove-source.mjs','prove-witness-source.mjs']},
 {name:'connective',root:connective,code:'CODE/tests',raw:'RAW/tests',
  repairs:['clinical-review-lower-limb-connective-xray.test.ts','connective-xray-original-preservation.test.mjs'],
  extras:['connective-current-family-inverse.mjs','fixtures/connective-current-family-prior/clinical-review-lower-limb-connective-xray.test.ts.raw'],
  proofs:['SOURCE_PROOF.mjs'],skipProofExecution:true},
 {name:'thoracic',root:thoracic,code:'proposal/tests',raw:'original/tests',
  repairs:['clinical-review-thoracic-detail-ultrasound.test.ts','clinical-review-thoracic-mediastinal-arterial-xray.test.ts',
   'clinical-review-thoracic-systemic-teaching.test.ts','clinical-review-thoracic-venous-xray.test.ts',
   'clinical-review-thoracic-wall-xray.test.ts'],extras:[],proofs:['prove-source.mjs']},
 {name:'question-imaging',root:question,code:'CODE/tests',raw:'RAW/tests',
  repairs:['clinical-review-spinal-disc-ultrasound.test.ts','clinical-review-suprahyoid-quiz.test.ts',
   'clinical-review-thoracic-quiz.test.ts','clinical-imaging-role-preservation-20261021.test.mjs',
   'limb-suprahyoid-role-preservation-20261021.test.mjs'],
  extras:['question-source-family-inverse.mjs',
   ...['clinical-review-spinal-disc-ultrasound.test.ts','clinical-review-suprahyoid-quiz.test.ts',
    'clinical-review-thoracic-quiz.test.ts'].map(n=>`fixtures/question-family-prior/${n}.raw`),
   'fixtures/question-family-witness-base/clinical-imaging-role-preservation-20261021.test.mjs.raw',
   'fixtures/question-family-witness-base/limb-suprahyoid-role-preservation-20261021.test.mjs.raw'],
  proofs:['SOURCE_PROOF.mjs']},
 {name:'teaching-question-v2',root:teaching,code:'proposal/tests',raw:'original/tests',
  repairs:['clinical-review-nested-duct-xray.test.ts','clinical-review-pharyngeal-muscle-teaching.test.ts',
   'clinical-review-pelvic-tributary-xray.test.ts','clinical-review-thigh-avulsion-xray.test.ts',
   'clinical-review-reasoning.test.ts','clinical-question-role-preservation-20261021.test.mjs'],
  extras:['clinical-teaching-question-composition.mjs',
   'fixtures/teaching-question-frozen/clinical-review-reasoning.test.ts.raw'],
  proofs:['prove-source.mjs']},
 {name:'salivary',root:salivary,code:'CODE/tests',raw:'RAW/tests',
  repairs:['clinical-review-salivary-stylohyoid-quiz.test.ts','salivary-cache-epoch-preservation.test.mjs',
   'atlas190-current-delivery.test.mjs','clinical-review-git-root-preservation.test.mjs',
   'salivary-cache-guard-adaptation.test.mjs','current-head-index-whole-role-transition-20261021.test.mjs'],
  extras:['salivary-current-family-inverse.mjs',
   'fixtures/salivary-family-prior/clinical-review-salivary-stylohyoid-quiz.test.ts.raw',
   'fixtures/salivary-family-prior/salivary-cache-guard-adaptation.test.mjs.raw'],
  existingCode:['fixtures/salivary-cache-epoch-20261021/original.ts.raw'],
  skipCode:['admission485-final-role-transition-20261021.test.mjs','salivary-cache-epoch-adapter.mjs'],
  proofs:['SOURCE_PROOF.mjs']},
 {name:'regional-link-product',root:product,code:'CODE/tests',raw:'RAW/tests',
  repairs:['regional-link-role-preservation-20261021.test.mjs'],
  extras:['regional-mri-inline-source-inverse.mjs',
   'fixtures/regional-mri-inline-prior/historical87ed.test.ts.raw',
   'fixtures/regional-mri-inline-prior/regional-mri-inline-inspection.test.ts.raw'],
  proofs:['SOURCE_PROOF.mjs']},
];

function descend(root,rel=''){
 return readdirSync(join(root,rel),{withFileTypes:true}).flatMap(entry=>{
  const next=rel?`${rel}/${entry.name}`:entry.name;
  return entry.isDirectory()?descend(root,next):[next];
 }).sort();
}
const baseBytes=readFileSync(basePath);
assert.equal(sha(baseBytes),baseSha,'frozen 124-entry selected queue');
const base=JSON.parse(baseBytes);
assert.equal(fileSha(receiptPath),receiptSha,'original 5,811-path frozen source receipt');
const receipt=JSON.parse(readFileSync(receiptPath));
assert.equal(receipt.sourceRows.length,5811);
assert.equal(receipt.website,website);
assert.equal(receipt.source,base.source);
assert.equal(receipt.review,base.review);
const receiptRows=new Map(receipt.sourceRows.map(row=>[row.path,row]));
assert.equal(base.website,website);
assert.equal(base.repairs.length,124);
assert.equal(base.additionalFiles.length,39);
assert.equal(new Set(base.repairs.map(row=>row.path)).size,124);
assert.equal(new Set(base.additionalFiles.map(row=>row.path)).size,39);
const repairMap=new Map(base.repairs.map(row=>[row.path,row]));
const extraMap=new Map(base.additionalFiles.map(row=>[row.path,row]));
const replaced=new Map();
const proofRows=[];
for(const packet of packets){
 const seen=new Set([...packet.repairs,...packet.extras,...(packet.skipCode??[]),...(packet.existingCode??[])]);
 assert.equal(seen.size,packet.repairs.length+packet.extras.length+(packet.skipCode?.length??0)+(packet.existingCode?.length??0),`${packet.name}: duplicate declared CODE`);
 assert.deepEqual(descend(`${packet.root}/${packet.code}`),[...seen].sort(),`${packet.name}: exact declared CODE inventory`);
 for(const name of packet.repairs){
  const path=`tests/${name}`;
  const proposal=`${packet.root}/${packet.code}/${name}`;
  const sourceRaw=`${packet.root}/${packet.raw}/${name}`;
  assert(existsSync(sourceRaw),`${packet.name}: complete source preimage ${name}`);
  const current=repairMap.get(path);
  let beforePath=current?.beforePath??sourceRaw;
  if(packet.name==='question-imaging'&&name.endsWith('role-preservation-20261021.test.mjs')){
   const shoulderCode=`${shoulder}/CODE/tests/${name}`;
   assert.equal(fileSha(sourceRaw),fileSha(shoulderCode),`${name}: question input is shoulder intermediate`);
   beforePath=`${shoulder}/RAW/tests/${name}`;
   assert.equal(fileSha(beforePath),name.startsWith('clinical-imaging')
    ?'6a5663260ede388a42fc262940c0c6f5300765ca536ae420c6d588fe8c4be5ff'
    :'b9359849ff93c19f51d555d33e0ca772625632a08855d6d1f6822dac84203aa7',`${name}: frozen witness`);
   assert.equal(repairMap.get(path)?.proposalSha256,fileSha(shoulderCode),`${name}: replace exactly shoulder intermediate`);
  }
  if(packet.name==='pancreatic'&&name==='clinical-epoch-batch-d-preservation.test.mjs'){
   assert(current,'Batch D selected124 present');
   assert.equal(fileSha(sourceRaw),current.proposalSha256,'Batch D input exactly selected orbital composition');
   assert.equal(current.beforeSha256,'c934a01dff830c1277b5648d7de81a86d60dfd1f977673779fa371d1f35d3746','Batch D frozen history');
  }
  if(packet.name==='teaching-question-v2'&&name==='clinical-question-role-preservation-20261021.test.mjs'){
   assert(current,'question-role selected124 present');
   assert.equal(fileSha(sourceRaw),current.proposalSha256,'question-role input exactly selected short-ciliary composition');
   assert.equal(current.beforeSha256,'d0bb91733cf0703739bf48db1c77bed53f592a6365e9231b984cc1d82c7c2d6a','question-role frozen theorem');
  }
  assert.equal(fileSha(beforePath),fileSha(`${website}/${path}`),`${path}: original frozen website bytes`);
  const beforeSha256=fileSha(beforePath);
  assert.equal(receiptRows.get(path)?.sha256,beforeSha256,`${path}: original 5,811-path receipt`);
  assert.equal(receiptRows.get(path)?.bytes,readFileSync(beforePath).length,`${path}: original receipt byte count`);
  if(current){
   assert.equal(beforeSha256,current.beforeSha256,`${path}: preserve selected frozen before SHA`);
   if(!replaced.has(path))replaced.set(path,[]);
   replaced.get(path).push({from:current.proposalSha256,to:fileSha(proposal),packet:packet.name});
  }else assert.equal(fileSha(sourceRaw),beforeSha256,`${path}: stage RAW is frozen input`);
  const row={path,beforePath,beforeSha256,proposal,proposalSha256:fileSha(proposal),wholeSourceInverse:true,nativeRootRerun:false};
  if(packet.name==='regional-link-product')row.dependsOn={path:'tests/regional-mri-inline-inspection.test.ts',
   proposal:`${inlineProduct}/CODE/tests/regional-mri-inline-inspection.test.ts`,
   proposalSha256:'6467bfb098644b04464969d98cbae9f8ca2974d9a54c320d29af39c1c419e716',
   reason:'Product runtime-revision overlay must precede historical witness replay'};
  repairMap.set(path,row);
 }
 for(const name of packet.extras){
  const path=`tests/${name}`;
  const from=`${packet.root}/${packet.code}/${name}`;
  assert(!extraMap.has(path),`${path}: extra collision`);
  assert(!repairMap.has(path),`${path}: extra/repair collision`);
  assert(!receiptRows.has(path),`${path}: additional path must not overwrite frozen source`);
  extraMap.set(path,{path,from,sha256:fileSha(from),bytes:readFileSync(from).length});
 }
 for(const name of packet.skipCode??[]){
  const from=`${packet.root}/${packet.code}/${name}`;
  const raw=`${packet.root}/${packet.raw}/${name}`;
  assert.deepEqual(readFileSync(from),readFileSync(raw),`${packet.name}: unchanged pure-proof support, not admitted`);
 }
 for(const name of packet.existingCode??[]){
  const path=`tests/${name}`;
  const from=`${packet.root}/${packet.code}/${name}`;
  assert.equal(fileSha(from),receiptRows.get(path)?.sha256,`${packet.name}: existing identical frozen fixture is not an addition`);
  assert.deepEqual(readFileSync(from),readFileSync(`${website}/${path}`));
 }
 for(const name of packet.proofs){
  const script=`${packet.root}/${name}`;
  const proof={script,sha256:fileSha(script),sourceOnlyExecuted:false,nativeWebsiteModulesExecuted:false};
  if(packet.skipProofExecution){
   const result=JSON.parse(readFileSync(`${packet.root}/SOURCE_PROOF_RESULT.json`));
   assert.equal(result.wholeSourceInverses,2);
   assert.equal(result.actualAdapterSuccess,true);
   assert.equal(result.nativeTestsRun,false);
   proof.priorSourceOnlyResult=`${packet.root}/SOURCE_PROOF_RESULT.json`;
   proof.priorSourceOnlyResultSha256=fileSha(proof.priorSourceOnlyResult);
  }else{
   const output=execFileSync(process.execPath,[script],{windowsHide:true,maxBuffer:32e6,encoding:'utf8'});
   assert(output.length>0,`${packet.name}: source-only proof output`);
   proof.sourceOnlyExecuted=true;
  }
  proofRows.push(proof);
 }
 console.log(`${packet.name}: ${packet.repairs.length} repairs, ${packet.extras.length} extras, ${packet.proofs.length} source proofs`);
}
assert.equal(repairMap.size,161,'expected 161 unique repairs');
assert.equal(extraMap.size,65,'65 genuinely new extras; salivary historical fixture is already frozen');
assert.equal(replaced.size,4,'Batch D, question-role and two shoulder witness replacements');
for(const [path,chain] of replaced)assert.equal(chain.length,1,`${path}: exactly one intermediate replacement`);
const inlinePath=`${inlineProduct}/CODE/tests/regional-mri-inline-inspection.test.ts`;
assert.equal(fileSha(inlinePath),'6467bfb098644b04464969d98cbae9f8ca2974d9a54c320d29af39c1c419e716','explicit external product overlay');
assert.equal(fileSha(`${product}/CODE/tests/fixtures/regional-mri-inline-prior/regional-mri-inline-inspection.test.ts.raw`),
 '05435a2b21ff1036064bc5d8e83f6c11ff3990afa8360599050e0da49b4fcfd8','product witness prior fixture');
for(const row of base.repairs){
 if(replaced.has(row.path))continue;
 const selected=repairMap.get(row.path);
 assert.deepEqual(selected,row,`${row.path}: original selected124 row untouched (including Batch C)`);
}
const rows=[...repairMap.values()].sort((a,b)=>a.path.localeCompare(b.path));
const extras=[...extraMap.values()].sort((a,b)=>a.path.localeCompare(b.path));
for(const row of [...rows,...extras]){
 assert.equal(fileSha(row.proposal??row.from),row.proposalSha256??row.sha256,`${row.path}: proposal bytes`);
 if(row.beforePath){
  assert.equal(fileSha(row.beforePath),row.beforeSha256,`${row.path}: preimage bytes`);
  assert.equal(receiptRows.get(row.path)?.sha256,row.beforeSha256,`${row.path}: original 5,811-path receipt SHA`);
  assert.equal(receiptRows.get(row.path)?.bytes,readFileSync(row.beforePath).length,`${row.path}: original receipt byte count`);
 }else assert(!receiptRows.has(row.path),`${row.path}: addition must not overwrite original receipt`);
}
const queue={...base,
 at:new Date().toISOString(),previousQueue:basePath,previousQueueSha256:baseSha,
 repairs:rows,additionalFiles:extras,sourceProofs:[...base.sourceProofs,...proofRows],
 completeOriginalSourceInverses:161,sourceBackupIncludesAll124:false,
 sourceBackupIncludesAll161:false,nativeRootsRerun:false,wholeSuitePassing:false,
 externalProductDependency:{path:'tests/regional-mri-inline-inspection.test.ts',
  proposal:inlinePath,proposalSha256:fileSha(inlinePath),
  requiredBefore:'tests/regional-link-role-preservation-20261021.test.mjs'},
 selectedReplacementLineage:{
  batchD:{frozenSha256:'c934a01dff830c1277b5648d7de81a86d60dfd1f977673779fa371d1f35d3746',
   intermediateSha256:'7707b1b30953ffa9e60a3f301ddafa698dd5bf7d113ae8b514a7231193891005',finalSha256:repairMap.get('tests/clinical-epoch-batch-d-preservation.test.mjs').proposalSha256},
  questionRole:{frozenSha256:'d0bb91733cf0703739bf48db1c77bed53f592a6365e9231b984cc1d82c7c2d6a',
   intermediateSha256:'3a346f1d610e31ff7b5084f44bf7f95a4bd8eb7dfd06d3a4bfc0011d32170fee',finalSha256:repairMap.get('tests/clinical-question-role-preservation-20261021.test.mjs').proposalSha256},
  clinicalImaging:{frozenSha256:'6a5663260ede388a42fc262940c0c6f5300765ca536ae420c6d588fe8c4be5ff',
   shoulderSha256:'92c0cb889ca52b374094b719562cfeac989d5deb465ae3869ac7022c578570e9',finalSha256:repairMap.get('tests/clinical-imaging-role-preservation-20261021.test.mjs').proposalSha256},
  limbSuprahyoid:{frozenSha256:'b9359849ff93c19f51d555d33e0ca772625632a08855d6d1f6822dac84203aa7',
   shoulderSha256:'f8391fa35956ff31b470673da1601a177fa6f4a33bd3dc63cb587c7f8d699f48',finalSha256:repairMap.get('tests/limb-suprahyoid-role-preservation-20261021.test.mjs').proposalSha256}},
 next:'Source-only 161 repair / 65 new extra selection. The salivary historical fixture already exists unchanged in the frozen 5,811-path receipt. Assemble later only after external regional MRI inline product overlay and coherent candidate backups; then run native affected roots, strict validators, types/build and full regression. No clinical approval or deployment is claimed.'};
if(existsSync(output)){
 const existing=JSON.parse(readFileSync(output));
 assert.deepEqual({...existing,at:queue.at},queue,'existing immutable output matches source-only recomputation');
}else{
 mkdirSync(join(staging,'20261022-clinical-runtime-family-consolidated'),{recursive:false});
 writeFileSync(output,JSON.stringify(queue,null,2)+'\n',{flag:'wx'});
}
console.log(`QUEUE ${output}`);
console.log(`SHA256 ${fileSha(output)}`);
console.log(`REPAIRS ${rows.length} EXTRAS ${extras.length} SOURCE_PROOFS ${queue.sourceProofs.length}`);
