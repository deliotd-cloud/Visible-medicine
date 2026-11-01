import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {budgets,inspect,safeChild,finalSourceEvidence} from './plan.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {memoryGate} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/native-website-integration-stage-20261025.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-hepatic-delivery';
const [mode,attempt]=process.argv.slice(2);assert.equal(mode,'--run');assert(/^attempt-[1-9]\d*$/.test(attempt));
const {source}=inspect();finalSourceEvidence({required:true});memoryGate(budgets.types.minimum);
execFileSync(process.execPath,[own+'/prepare.mjs',attempt],{stdio:'inherit',windowsHide:true});
const root=safeChild('G:/VisibleMedicine-temp/staging/20261101-hepatic-delivery',attempt),site=root+'/website';
const jobs=[
 ['native-build',source.native,'node_modules/vite/bin/vite.js build --config integration/head-neck/vite.config.mjs',budgets.native],
 ['assemble',site,own+'/assemble.mjs',budgets.assembly],
 ['review-build',site,'scripts/build-clinical-review-viewer.mjs',budgets.review],
 ['focused-checks',site,own+'/verify.mjs',budgets.checks],
 ['full-types',site,'node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false',budgets.types],
 ['full-build',site,'G:/VisibleMedicine-temp/proposals/20261101-inbox-catalogue/build-checker.mjs',budgets.build],
];
for(const [name,cwd,command,limits]of jobs){
 // Build tools may clear their output folders. Verify the existing ancestors
 // before invoking them, including any junction that could escape this scope.
 const outputs=name==='native-build'?['.sites-runtime/head-neck-module']:name==='review-build'?['public/atlas-review-viewer']:name==='full-build'?['dist','.next']:[];
 for(const relative of outputs){let ancestor=safeChild(cwd,relative);while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);const real=fs.realpathSync(ancestor),base=fs.realpathSync(cwd);assert(real===base||real.startsWith(base+path.sep),'Build output escapes its source checkout');}
 const result=await guarded({site:cwd,dir:root+'/checks/'+name,command,...limits,extraEnv:{VM_ATLAS_SOURCE_REPO:source.native,ATLAS_SOURCE_REPO:source.native,VM_CATALOG_DELIVERY_ATTEMPT:root,TEMP:root+'/tmp',TMP:root+'/tmp'}});
 fs.writeFileSync(root+'/'+name+'-RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 assert(result.passing,name+' failed; preserve the attempt and restore the unchanged installed preview');
}
fs.writeFileSync(root+'/PIPELINE_RESULT.json',JSON.stringify({at:new Date().toISOString(),passing:true,stages:jobs.map(j=>j[0]),installed:false,publicDeployment:false,clinicalApproval:false,remaining:['Broader release regression checks','Authenticated isolated browser acceptance','Final source sealing and recoverable local installation']},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verified:root,installed:false}));
