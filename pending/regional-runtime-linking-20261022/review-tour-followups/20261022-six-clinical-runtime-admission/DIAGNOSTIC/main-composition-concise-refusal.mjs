import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';

const stage='F:/VisibleMedicine/staging/20261022-six-clinical-runtime-admission';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
assert.equal(sha(read(root+'/PRODUCT_SOURCE_V5.json')),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const website=json(root+'/PRODUCT_SOURCE_V5.json').website;
const text=file=>read(file).toString('utf8');
function once(value,from,to){assert.equal(value.split(from).length,2,'Exact unique declared seam');return value.replace(from,to);}
function array(code,name){const marker='const '+name+'=',start=code.indexOf(marker);assert(start>=0);const end=code.indexOf('\n];',start);assert(end>start);return runInNewContext('('+code.slice(start+marker.length,end+2)+')',{}, {timeout:1000});}
const checks=[];
for(const spec of [
 {witness:'regional-tour-role-preservation-20261021.test.mjs',name:'clinical-review-tour-imaging.test.ts',seams:'currentTourSeams',rawDir:'fixtures/regional-tour-before-role-batch-20261021'},
 {witness:'limb-suprahyoid-role-preservation-20261021.test.mjs',name:'clinical-review-um-ankle-imaging.test.ts',seams:'currentAnkleSeams',rawDir:'fixtures/limb-suprahyoid-before-role-batch-20261021'},
]){
 const code=text(stage+'/CODE/tests/'+spec.witness),entries=array(code,'allowed'),newest=array(code,spec.seams);
 const entry=entries.find(entry=>entry.name===spec.name);assert(entry);
 let recovered=text(stage+'/CODE/tests/'+spec.name);
 for(const [before,after]of [...newest].reverse())recovered=once(recovered,after,before);
 assert.equal(recovered,text(stage+'/RAW/tests/'+spec.name),'Actual newest adapter recovers full V5 root');
 const original=read(website+'/tests/'+spec.rawDir+'/'+spec.name+'.raw');assert.equal(sha(original),entry.sha);
 let expected=original.toString('utf8');for(const [before,after]of entry.edits)expected=once(expected,before,after);
 assert.equal(recovered,expected,'Entire preceding historical witness theorem survives');
 for(const [before,after]of [...entry.edits].reverse())recovered=once(recovered,after,before);
 assert.equal(recovered,original.toString('utf8'));
 assert.notEqual(recovered+'\nconst unknown=true;\n',original.toString('utf8'));
 checks.push({path:'tests/'+spec.name,witness:'tests/'+spec.witness,originalSha256:entry.sha,completeHistoricalRootRecovered:true});
}
{
 const code=text(stage+'/CODE/tests/venous-urinary-role-preservation-20261021.test.mjs');
 const start=code.indexOf('const cases=')+'const cases='.length,end=code.indexOf(';\nfor(const spec of cases)',start);assert(end>start);
 const entry=JSON.parse(code.slice(start,end)).find(entry=>entry.path==='tests/clinical-review-upper-venous-tour.test.ts');assert(entry);
 let recovered=text(stage+'/CODE/'+entry.path);
 for(const [before,after]of array(code,'newestUpperSeams').reverse())recovered=once(recovered,after,before);
 assert.equal(recovered,text(stage+'/RAW/'+entry.path));
 const original=read(website+'/'+entry.raw);assert.equal(sha(original),entry.digest);
 let expected=original.toString('utf8');for(const [before,after]of entry.seams)expected=once(expected,before,after);
 assert.equal(recovered,expected);assert(recovered.includes(entry.refusal));
 for(const [before,after]of [...entry.seams].reverse())recovered=once(recovered,after,before);
 assert.equal(recovered,original.toString('utf8'));
 checks.push({path:entry.path,originalSha256:entry.digest,completeHistoricalRootRecovered:true});
}
const atlas='F:/VisibleMedicine/atlas',current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',authored='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),current);
const git=(commit,file)=>runGit(['-C',atlas,'show',commit+':'+file]);
const unchanged=['content/regional-teaching/head-neck.json','content/tongue-palate-quiz-pins.json','content/tongue-palate-quiz.ts','lib/tongue-palate-quiz.ts'];
for(const file of unchanged)assert(git(current,file).equals(git(authored,file)),'Exact authored source retained: '+file);
let body=git(current,'app/body-content.ts').toString('utf8');
for(const addition of ["import {dentalMriLesson} from '../lib/dental-mri';\n","import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\n",'  const dentalMri=dentalMriLesson(s,tab);\n  if(dentalMri)return dentalMri;\n','  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\n  if (colicUltrasound) return colicUltrasound;\n'])body=once(body,addition,'');
assert(Buffer.from(body).equals(git(authored,'app/body-content.ts')),'Exact authored body recovered');
const notice=git(current,'LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8');
const dental=notice.indexOf('## Dental MRI methods orientation — 21 October 2026'),tongue=notice.indexOf('## Tongue and soft-palate quick checks — 20 October 2026'),corpus=notice.indexOf('## Corpus spongiosum CT boundary teaching — 20 October 2026');
assert(dental>=0&&tongue>dental&&corpus>tongue);
assert.equal(notice.slice(0,dental)+notice.slice(tongue,corpus-1),git(authored,'LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8'));
const output=stage+'/MAIN_COMPOSITION.json';assert(!fs.existsSync(output));
const result={at:new Date().toISOString(),sourceOnly:true,sourceProofSha256:sha(read(stage+'/SOURCE_PROOF.mjs')),checks,
 tongue:{current,authored,unchangedSourceFiles:unchanged,exactBodyBranchInverse:true,exactNoticeSectionInverse:true},
 nativeTestsRun:false,candidateChanged:false,clinicalApproval:false};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:output,sha256:sha(read(output)),historicalRoots:checks.length,tongueSourceComposition:true,nativeTestsRun:false}));
