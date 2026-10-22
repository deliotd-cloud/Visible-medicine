import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,basename} from 'node:path';

const stage='F:/VisibleMedicine/staging/20261022-original-failure-coverage-triage';
const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const website=join(base,'website');
const triagePath='F:/VisibleMedicine/staging/20261022-full-regression-terminal-triage/EVIDENCE.json';
const planPath='F:/VisibleMedicine/staging/20261022-native-runtime-followups-consolidated/PLAN.json';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const triage=read(triagePath),plan=read(planPath);
const mri=read(join(base,'native-mri-runtime-v3/INPUTS.json'));
const head=read(join(base,'native-head-guard/INPUTS.json'));
const cranio=read(join(base,'native-craniofacial-current/TERMINAL.json'));
const live=read(join(base,'native-selected-repairs-v5/INPUTS.json'));
const roots=args=>args.filter(x=>x.startsWith('tests/'));
const passed=new Set([...mri.inputs.map(x=>x.path),...head.inputs.map(x=>x.path),...roots(cranio.args)]);
const running=new Set(roots(live.args));
const planned=new Set(plan.proposedNextNativeRoots);
const sourcePath=join(base,'PRODUCT_SOURCE_V5.json');
const sourceReceipt=read(sourcePath);
const tap=readFileSync(triage.childTapPath,'utf8');
const lines=tap.split(/\r?\n/);
const classify=(path,error)=>{
 const name=basename(path);
 if(name==='atlas-paused-tour-imaging-checks.mjs')return ['runtime-family','Review source 6d7 versus independent shoulder/female-pelvis/lower-limb runtime 190a; consumer atlas-paused-tour-imaging.test.ts is also unselected','tests/atlas-paused-tour-imaging-checks.mjs and its importing root'];
 if(['atlas-orbital-ultrasound.test.ts','atlas-pelvic-update.test.ts','atlas-pes-anserine-study.test.ts','atlas-posterior-mediastinal.test.ts','atlas-proper-digital-teaching.test.ts','atlas-pulmonary-hilar.test.ts','atlas-pulmonary-vein-ultrasound.test.ts'].includes(name))return ['runtime-family','First assertion compares nonregional inventory sourceCommit 190a with shared fixture expectation 6d7; retain manifest hashes, model counts, source pins and remaining assertions','these seven tests only; shared fixture/validator changes require main ownership'];
 if(/source revision changed|current Atlas graph|sourceCommit|6d7a356|190a632|87ed7e|46c43|aaa8a/.test(error))return ['source-epoch','First failure shows a source revision/family comparison; inspect the complete current-vs-historical proof before any exact-seam repair',path];
 if(/Pinned entire proposal|whole.original|inverse|adapter bytes|source outside|whole-source/.test(error))return ['inverse-witness','Whole-source or adapter inverse no longer matches its pinned postimage; preserve original fixture and refusal, derive only authenticated added seams',path];
 if(/Revision47 binding/.test(error))return ['historical-fixture','Frozen revision47 refusal was applied to newer current binding; inspect fixture/current target roles',path];
 if(/1558 !== 1553/.test(error))return ['review-input-count','Current Review has 1558 imported sources versus older expectation 1553; verify all added records and exact hashes before admission',path];
 if(/vm-current-atlas-test-delivery/.test(error))return ['register-version','Current pin schema version 1 versus expected 2; inspect complete register47 inverse and actual pin history',path];
 return ['unresolved-source-witness','First original TAP failure is source/hash/byte mismatch; inspect complete assertion and authenticated preimages before repair',path];
};
const entries=[];
for(const row of triage.pathSummary){
 if(passed.has(row.path)||running.has(row.path)||planned.has(row.path))continue;
 const file=join(website,row.path),bytes=readFileSync(file),src=bytes.toString('utf8');
 const marker=`not ok ${row.firstId} - `,at=lines.findIndex(x=>x.startsWith(marker));
 if(at<0)throw Error('Missing original TAP marker '+row.firstId);
 let end=at+1;while(end<lines.length&&lines[end]!=='  ...'&&end<at+1000)end++;
 const block=lines.slice(at,Math.min(end+1,at+1001));
 const errorStart=block.findIndex(x=>x.startsWith('  error:'));
 const summary=block.slice(errorStart,Math.min(errorStart+22,block.length)).join('\n');
 const [causeFamily,reason,ownership]=classify(row.path,summary+' '+row.firstError+' '+row.firstTitle);
 const importedBy=[];
 for(const root of [...passed,...running,...planned]){
  const rootFile=join(website,root);let text;try{text=readFileSync(rootFile,'utf8')}catch{continue}
  const fileName=basename(row.path);
  if(new RegExp(`(?:from\\s*|import\\s*)['\"]\\./${fileName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['\"]`).test(text))importedBy.push(root);
 }
 entries.push({path:row.path,originalScope:row.scope,originalFailures:row.failures,firstFailureId:row.firstId,firstTitle:row.firstTitle,firstError:row.firstError,sourceSha256:createHash('sha256').update(bytes).digest('hex'),lineCount:src.split(/\r?\n/).length,coverage:'no completed/live/planned direct root',fileRole:row.path==='tests/atlas-paused-tour-imaging-checks.mjs'?'test-registering helper imported by uncovered tests/atlas-paused-tour-imaging.test.ts':'standalone original test root',importedByCoveredRoots:importedBy,originalTapBlock:triage.childTapPath+'#not-ok-'+row.firstId,originalTapFirstFailureExcerpt:summary,causeFamily,causeAssessment:'source-only preliminary; no native rerun',reason,suggestedExclusiveOwnership:ownership});
}
const assertions={originalFailingPaths:triage.pathSummary.length,completedRootIntersection:triage.pathSummary.filter(x=>passed.has(x.path)).length,runningRootIntersection:triage.pathSummary.filter(x=>running.has(x.path)).length,plannedRootIntersection:triage.pathSummary.filter(x=>planned.has(x.path)).length,uncoveredFailingPaths:entries.length,uncoveredStandaloneRoots:entries.filter(x=>x.fileRole.startsWith('standalone')).length,uncoveredHelperFiles:entries.filter(x=>x.fileRole.startsWith('test-registering')).length,uncoveredImportedByCoveredRoots:entries.filter(x=>x.importedByCoveredRoots.length).length,uncoveredNoDirectExecution:entries.filter(x=>!x.importedByCoveredRoots.length).length};
if(entries.length!==33)throw Error('Expected 33 uncovered, got '+entries.length);
const output={at:new Date().toISOString(),kind:'read-only original-failure coverage triage',source:{website,sourceReceipt:sourcePath,sourceReceiptSha256:hash(sourcePath),originalEvidence:triagePath,originalEvidenceSha256:hash(triagePath),currentPlan:planPath,currentPlanSha256:hash(planPath),originalTap:triage.childTapPath,originalTapSha256:triage.childTapSha256},completedEvidence:[{path:join(base,'native-mri-runtime-v3/TERMINAL.json'),counts:read(join(base,'native-mri-runtime-v3/TERMINAL.json')).counts,sourceReceiptSha256:read(join(base,'native-mri-runtime-v3/TERMINAL.json')).sourceReceiptSha256},{path:join(base,'native-head-guard/TERMINAL.json'),counts:read(join(base,'native-head-guard/TERMINAL.json')).counts,sourceReceiptSha256:read(join(base,'native-head-guard/TERMINAL.json')).sourceReceiptSha256},{path:join(base,'native-craniofacial-current/TERMINAL.json'),counts:cranio.counts,sourceReceiptSha256:cranio.sourceReceiptSha256}],runningEvidence:{path:join(base,'native-selected-repairs-v5/INPUTS.json'),rootCount:running.size,terminalAtInspection:false},plannedEvidence:{path:planPath,rootCount:planned.size,sourceOnly:true},assertions,entries,limits:['A direct root list proves selection only. The 172-root run has no TERMINAL in inspected evidence.','Mri V3 and head V4 passes bind earlier receipts; the craniofacial pass binds V5. No whole-suite pass or preview cutover is inferred.','First TAP blocks identify earliest observed failures only; later assertions may reveal more. Preserve complete tests, historical inverses, strict pins and validators.','Current runtime has Review/head 6d7 and independent other-three 190a; do not normalize all to one revision.','No product, test, candidate, clinical data, source pin, validator, preview or deployment was edited by this triage.']};
writeFileSync(join(stage,'EVIDENCE.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(assertions));
