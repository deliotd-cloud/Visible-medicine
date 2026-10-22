// Main-owned local milestone and filtered source-only recovery; never installs the candidate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const renalRoot='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate';
const selectedPath=renalRoot+'/SOURCE_V3.json',source=json(selectedPath);
const renalTerminalPath=renalRoot+'/verification-v3/TERMINAL.json',renalTerminal=json(renalTerminalPath);
assert.equal(sha(read(renalTerminalPath)),'382e11caacb14e56308339fa28aed56588518e1e97b043cfa4162239f5ce937b');
assert.equal(renalTerminal.code,0);assert.deepEqual(renalTerminal.sourceDrift,[]);
assert.deepEqual(renalTerminal.commands.map(c=>[c.label,c.code]),[['decoding-source-proof',0],['types',0],['website',0]]);
assert.equal(renalTerminal.sourceReceiptSha256,sha(read(selectedPath)));
const stockPath=renalRoot+'/SOURCE_IMPORT.json',stock=json(stockPath);
assert.equal(stock.code,0);assert.equal(stock.commands.length,10);assert(stock.commands.every(c=>c.code===0));
assert.equal(source.review,'9aead9088895249b19b6a28f75fe824388b951055d6a62263ca14e6ed4e0eb5c');
assert.equal(stock.review,source.review);assert.equal(source.atlasHead,'4f20ae0b62b9e0dab5936b430575a983dcdd934e');
assert.equal(source.atlasTree,'64f085e1f8b63b5f17daf8b107efcbe40bb7596c');assert.equal(source.sourceRows.length,6222);
assert.equal(stock.boundInputs,1728);assert.equal(stock.importedSources,1561);assert.equal(stock.changedImported.length,5);
const originalNativePath=renalRoot+'/verification/TERMINAL.json',originalNative=json(originalNativePath);
assert.deepEqual(originalNative.sourceDrift,[]);assert.deepEqual(originalNative.priorSourceDrift,[]);
const native=originalNative.commands.find(c=>c.label==='current-native');
assert.deepEqual(native.counts,{tests:192,pass:191,fail:1,cancelled:0,skipped:0,todo:0});
const correctedPath=renalRoot+'/verification-v2/TERMINAL.json',corrected=json(correctedPath);
assert.deepEqual(corrected.commands[0].counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0});
assert.equal(corrected.commands[1].label,'types');assert.equal(corrected.commands[1].code,2);
const canonicalExportPath='F:/VisibleMedicine/staging/20261022-renal-canonical-checkout/RUNTIME_EXPORT.json',canonicalExport=json(canonicalExportPath);
assert.equal(sha(read(canonicalExportPath)),'4b754c4a4b8dc1cd6322bf644f4392753ae65c7176ab623c46e3358cde7a5277');
assert.equal(canonicalExport.code,0);assert.equal(canonicalExport.commands.length,12);assert(canonicalExport.commands.every(c=>c.code===0));
const assurancePath='F:/VisibleMedicine/staging/20261022-admission-importer-source-successor/SOURCE.json',assurance=json(assurancePath);
assert.equal(sha(read(assurancePath)),'fcccc077d15911a94d395832be0cfe28e8eb15e2b0d37e80f01463645e0c89f1');
const assuranceNativePath=path.dirname(assurancePath)+'/native-integration/TERMINAL.json',assuranceNative=json(assuranceNativePath);
assert.equal(assuranceNative.code,0);assert.deepEqual(assuranceNative.sourceDrift,[]);
assert.deepEqual(assuranceNative.counts,{tests:74,pass:74,fail:0,cancelled:0,skipped:0,todo:0});
assert.equal(assurance.atlasHead,'389bd0ca846a42c7f21055f55904bcf5df81a09f');
assert.equal(assurance.review,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');
const predecessorPath='F:/VisibleMedicine/staging/20261022-current-consumer-assurance-successor/SOURCE.json',predecessor=json(predecessorPath);
assert.equal(sha(read(predecessorPath)),'be8b13e91cb8dfeb8b420b91710437248c18ebe9232e6859a6fe54778b6a8079');
const nonTests=s=>s.sourceRows.filter(r=>!r.path.startsWith('tests/'));
assert.deepEqual(nonTests(assurance),nonTests(predecessor),'assurance branch never changes product bytes');
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;
assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);assert.equal(current.ownerPreviewPolicy.goalPaused,false);
const goalBefore=sha(Buffer.from(JSON.stringify(pointer.goal)));
const installed=[['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']];
const verify=()=>{
 for(const s of [source,assurance,predecessor])for(const r of s.sourceRows)assert.equal(sha(read(s.website+'/'+r.path)),r.sha256,s.website+' '+r.path);
 for(const s of [source,assurance]){
  assert.equal(runGit(['-C',s.atlas,'rev-parse','HEAD']).toString().trim(),s.atlasHead);
  assert.equal(runGit(['-C',s.atlas,'rev-parse','HEAD^{tree}']).toString().trim(),s.atlasTree);
  assert.equal(runGit(['-C',s.atlas,'status','--porcelain']).toString().trim(),'');
 }
 for(const[repo,head]of installed)assert.equal(runGit(['-C',repo,'rev-parse','HEAD']).toString().trim(),head);
 const listener=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  'Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
 assert.equal(listener.OwningProcess,297128);assert.equal(listener.LocalAddress,'127.0.0.1');
 assert.equal(sha(Buffer.from(JSON.stringify(json('CURRENT_CHECKPOINT.json').goal))),goalBefore,'full goal unchanged');
};verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-import-and-admission-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const[p,to]of [['CURRENT_CHECKPOINT.json','pointer.before.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md']])fs.copyFileSync(p,root+'/'+to);
const receipts=[selectedPath,stockPath,renalRoot+'/DELIVERY_ADMISSION.json',originalNativePath,correctedPath,renalTerminalPath,
 canonicalExportPath,'F:/VisibleMedicine/staging/20261022-renal-canonical-checkout/SOURCE.json',assurancePath,assuranceNativePath,
 'F:/VisibleMedicine/staging/20261022-admission-importer-source-followup/RESULT.json'];
const witnesses=[];
for(let i=0;i<receipts.length;i++){
 const from=receipts[i],to=root+'/receipts/'+String(i).padStart(2,'0')+'-'+path.basename(from);
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);witnesses.push({path:from,sha256:sha(read(from)),localCopy:to});
}
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-and-consumer-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'83abf7e822b8c576eeaade5b8cdc12e6bd824258575935e90de014dc27e1bc6a');
const parent=json(parentPath);assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const parentRepo='F:/VisibleMedicine/history/website-work/github-renal-tour-and-consumer-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));
for(const r of manifest.files)assert.equal(sha(read(selected.get(r.path))),r.sha256);
const prefix='pending/renal-import-admission-20261022/';
function add(from,to){
 assert(/\.(?:mjs|ts|tsx|raw)$/.test(from)&&!from.endsWith('.json.raw'),'code-only source backup '+from);
 const bytes=read(from);assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes,'UTF8 source');
 const p=prefix+to;assert(!selected.has(p));selected.set(p,from);
 const local=root+'/source/'+to;fs.mkdirSync(path.dirname(local),{recursive:true});fs.copyFileSync(from,local,fs.constants.COPYFILE_EXCL);
}
const before=new Map(predecessor.sourceRows.map(r=>[r.path,r]));
for(const[role,s]of [['renal-website',source],['assurance-website',assurance]])for(const row of s.sourceRows){
 if(row.sha256!==before.get(row.path)?.sha256&&/\.(?:mjs|ts|tsx|raw)$/.test(row.path)&&!row.path.endsWith('.json.raw')){
  add(s.website+'/'+row.path,role+'/'+row.path);
  if(before.has(row.path))add(predecessor.website+'/'+row.path,role+'-preimages/'+row.path);
 }
}
for(const stem of ['20261022-zero-registration-source-followup','20261022-admission-dependent-source-followup','20261022-admission-importer-source-followup']){
 const dir='F:/VisibleMedicine/staging/'+stem,result=json(dir+'/RESULT.json');
 for(const[p,h]of Object.entries({...result.files,...result.evidence})){
  assert.equal(sha(read(dir+'/'+p)),h);
  if(/\.(?:mjs|ts|raw)$/.test(p)&&!p.endsWith('.json.raw'))add(dir+'/'+p,'worker-proposals/'+stem+'/'+p);
 }
}
for(const p of ['prepare-renal-tour-website-20261022.mjs','import-renal-tour-website-20261022.mjs',
 'prepare-renal-canonical-checkout-20261022.mjs','verify-build-renal-canonical-20261022.mjs','prepare-renal-gitbytes-website-20261022.mjs',
 'import-renal-gitbytes-website-20261022.mjs','admit-renal-gitbytes-delivery-20261022.mjs','verify-renal-gitbytes-website-20261022.mjs',
 'finalize-renal-gitbytes-website-20261022.mjs','renal-tour-website-integration-20261022.test.mjs','renal-delivery-transition-20261022.test.mjs',
 'prepare-zero-registration-admission-20261022.mjs','prepare-admission-dependent-source-20261022.mjs','prepare-admission-importer-source-20261022.mjs',
 'prove-renal-type-decoding-20261022.mjs','verify-renal-typefix-20261022.mjs','checkpoint-renal-import-admission-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
for(const p of ['verification/renal-transition-test.before-unique-target.mjs','verification-v2/median.before-typed-decoding.ts','verification-v2/teaching-helper.before-typed-decoding.mjs'])add(renalRoot+'/'+p,'correction-preimages/'+p);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const r of files)assert.equal(sha(read(selected.get(r.path))),r.sha256,r.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-import-admission-source-backup';
let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-renal-import-admission-20261022.git',branch:'backup/renal-import-admission-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,websiteSourceReceiptSha256:sha(read(selectedPath)),separateAssuranceAtlas:assurance.atlasHead,assuranceSourceReceiptSha256:sha(read(assurancePath))},
 scope:'Inherited filtered source plus renal website import/source guards, exact historical admission repairs, authored proofs and code preimages. Separate old and new source roles remain explicit. Generated bindings/pins/coverage JSON, compiled runtimes/viewer, private records/DB/env/decisions/references, held assets, scans/models/masks, media/raw logs and raw canonical ancestry remain local. Not full, private or runnable recovery. Not installed or deployed.',
 proof:{stockImportChecks:10,canonicalByteAtlasChecks:12,websiteTypesAndProductionBuild:true,renalNative:{originalTests:192,pass:191,fail:1,correctedProofPass:1,noNewCombined192PassRun:true},assuranceNative:assuranceNative.counts,wholeOriginalAssertionInversesRetained:true,
  sourceOnlyTestTypeCorrection:true,renalPacketsChanged:5,otherPacketsUnchanged:1099,teachingPlacementsUnchanged:9936,full71AndEightIdeasPreserved:true,
  wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,ownerPreviewChanged:false,publicDeployment:false}});}
catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();const backupPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,independentlyVerified:!!saved,wholePrivateOrRunnableBackup:false,...(failure?{failure}:{})};
const next='Owner preview unchanged. Selected renal website6222/Atlas4f20/Review9aead is coherently imported, typechecked and production-built but not installed. Preserve separate older Atlas389/Review811b assurance branch with74/74checks. Next main-review worker review-navigation/ui-teaching source-role packet, then actual focused native tests in its own coherent source. Continue full71/eight roadmap and useful source-backed linked learning without waiting for sign-off. No whole-suite, clinical, spatial or public completion inferred.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Source-bound renal tour coherently imported with actual stock gates, full website types/build and focused integration; two formerly unregistered historical admission modules/dependent consumers pass74checks in a separate immutable source branch.',
 sourceReceipt:selectedPath,sourceReceiptSha256:sha(read(selectedPath)),sourcePaths:source.sourceRows.length,atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,boundInputs:1728,importedSources:1561,
 renalNative:{originalReceipt:originalNativePath,originalCounts:native.counts,correctedProofReceipt:correctedPath,correctedProofPass:1,newCombinedRun:false},websiteTypesAndBuild:{receipt:renalTerminalPath,sha256:sha(read(renalTerminalPath)),passed:true},
 separateAssurance:{sourceReceipt:assurancePath,sourceReceiptSha256:sha(read(assurancePath)),atlas:assurance.atlasHead,review:assurance.review,nativeReceipt:assuranceNativePath,counts:assuranceNative.counts,productBytesUnchanged:true},
 receipts:witnesses,sourceBackup,preview:{address:'127.0.0.1:3000',pid:297128,unchanged:true},ownerPreviewPolicy:current.ownerPreviewPolicy,next,
 full71AndEightIdeasPreserved:true,canonicalInstalled:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json'),active=latest.activeWork.current;
Object.assign(active,{at:result.at,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),currentCandidate:source.website,sourceReceipt:selectedPath,sourceReceiptSha256:sha(read(selectedPath)),sourcePaths:source.sourceRows.length,
 sourceBackup,renalWebsiteImport:result,separateAssurance:result.separateAssurance,next,beforeFurtherWork:next,wholeSuitePassing:false,full71AndEightIdeasPreserved:true});
Object.assign(active.pendingRenalTour??={}, {websiteImportPending:false,websiteImported:true,websiteSourceReceipt:selectedPath,websiteSourceReceiptSha256:sha(read(selectedPath)),websiteReview:source.review,typesAndBuildPassed:true,canonicalInstalled:false,clinicalApproval:false});
latest.activeWork.updated=result.at;assert.equal(sha(Buffer.from(JSON.stringify(latest.goal))),goalBefore);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),sourceBackup,ownerPreviewChanged:false}));
