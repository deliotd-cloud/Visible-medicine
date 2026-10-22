// Tiny pure-text proof only; no bundler, generated output or concurrent broad validation.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(path),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const proposal='F:/VisibleMedicine/staging/20261022-arterial-history-diagnostic/arterial-history-preservation.proposed.mjs';
const root='F:/VisibleMedicine/staging/20261022-arterial-history-main-proof';assert(!existsSync(root));
const harness=read(website+'/tests/arterial-history-preservation.test.mjs').toString();
const proposed=read(proposal).toString(),subject=read(website+'/tests/atlas-arterial-evidence-limits.test.mjs');
const fixture=read(website+'/tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt');
assert.equal(sha(subject),'d04a1842fc6b68f0b7be42a2d0206e93598b29e9d34c40ec7b5d3b1914296dbb');
assert.equal(sha(fixture),'b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15');
assert.equal(sha(read('F:/VisibleMedicine/website/tests/atlas-arterial-evidence-limits.test.mjs')),'f2c10d8ced49d7049860487cc202c12ed3725b96863cdea1e3b74745588aede6');
assert.equal(sha(read('F:/VisibleMedicine/website/tests/arterial-history-preservation.test.mjs')),sha(Buffer.from(harness)));
const unique=(source,from,to)=>{assert.equal(source.split(from).length,2,'Unique inverse '+from.slice(0,60));return source.replace(from,to);};
let inverse=unique(proposed,'// Proposal only. Install into candidate/tests after the frozen broad run ends.\n','');
inverse=unique(inverse,"const currentSubjectSha6d7='d04a1842fc6b68f0b7be42a2d0206e93598b29e9d34c40ec7b5d3b1914296dbb';\n",'');
const helpersStart=inverse.indexOf('function replaceUnique('),helpersEnd=inverse.indexOf("test('arterial admission retains");
assert(helpersStart>0&&helpersEnd>helpersStart);inverse=inverse.slice(0,helpersStart)+inverse.slice(helpersEnd);
const outerStart=" assert.equal(sha(admittedBytes),currentSubjectSha6d7,'Exact source6d7 arterial whole-test bytes');\n";
const outerEnd=" const source190Pin=\"  assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\";";
assert.equal(inverse.split(outerStart).length,2);assert.equal(inverse.split(outerEnd).length,2);
const a=inverse.indexOf(outerStart),b=inverse.indexOf(outerEnd);assert(b>a);
inverse=inverse.slice(0,a)+" assert.equal(sha(admittedBytes),'f2c10d8ced49d7049860487cc202c12ed3725b96863cdea1e3b74745588aede6','Exact source190 arterial whole-test bytes');\n"+inverse.slice(b);
inverse=unique(inverse,' const nativeCurrent=source190;',' const nativeCurrent=admittedBytes.toString(\'utf8\');');
assert.equal(inverse,harness,'Entire original preservation harness survives exact inverse, not just selected assertions');
mkdirSync(root);
const scenarios=[
 {name:'exact-current-to-complete-original',subject,fixture,expected:0},
 {name:'unknown-current-edit-refused',subject:Buffer.concat([subject,Buffer.from('\n// unknown mutation\n')]),fixture,expected:1},
 {name:'tampered-frozen-original-refused',subject,fixture:Buffer.concat([fixture,Buffer.from('\n')]),expected:1},
 {name:'historical-source190-not-current',subject:read('F:/VisibleMedicine/website/tests/atlas-arterial-evidence-limits.test.mjs'),fixture,expected:1},
];
const results=[];
for(const row of scenarios){
 const folder=root+'/'+row.name;mkdirSync(folder+'/fixtures',{recursive:true});
 writeFileSync(folder+'/arterial-history-preservation.test.mjs',proposed,{flag:'wx'});
 writeFileSync(folder+'/atlas-arterial-evidence-limits.test.mjs',row.subject,{flag:'wx'});
 writeFileSync(folder+'/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt',row.fixture,{flag:'wx'});
 const child=spawnSync(process.execPath,['--test','--test-reporter=tap','arterial-history-preservation.test.mjs'],{cwd:folder,windowsHide:true,encoding:'utf8',env:{...process.env},timeout:10000,maxBuffer:2e6});
 const text=(child.stdout??'')+(child.stderr??'');writeFileSync(folder+'/test.log',text,{flag:'wx'});
 const result={name:row.name,status:child.status,expected:row.expected,error:child.error?String(child.error):null,log:folder+'/test.log',logSha256:sha(Buffer.from(text))};results.push(result);assert.equal(child.status,row.expected,row.name);
 if(row.expected===0){assert.match(text,/# pass 1\b/);assert.match(text,/# fail 0\b/);}else assert.match(text,/Exact (?:source6d7 arterial|frozen original) whole-test bytes/);
}
const receipt={at:new Date().toISOString(),website,proposal,proposalSha256:sha(read(proposal)),originalHarnessSha256:sha(Buffer.from(harness)),exactEntireHarnessInverse:true,results,allFourExpectedOutcomes:true,actualNativeArterialSemanticRootRerun:false,canonicalInstalled:false,frozenFullRunCandidateEdited:false,heavyBuildOrBroadValidation:false,clinicalApproval:false,publicDeployment:false};
writeFileSync(root+'/RESULT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json')),outcomes:results.map(row=>({name:row.name,status:row.status,expected:row.expected})),canonicalInstalled:false}));
