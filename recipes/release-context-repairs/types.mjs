import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='F:/VisibleMedicine/staging/20261028-release-context-repairs',sf=process.argv[2],sourceSha=process.argv[3],attempt=process.argv[4];
assert(sf?.startsWith(stage+'/SOURCE_CANDIDATE'));assert.match(sourceSha,/^[a-f0-9]{64}$/);assert.match(attempt,/^[1-9][0-9]*$/);
assert.equal(hash(sf),sourceSha);const s=json(sf),site=s.website,dir=stage+'/checks/types-'+attempt,output=stage+'/types-'+attempt;
const pin=p=>({path:p,sha256:hash(p)}),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const verify=()=>{assert.equal(hash(sf),sourceSha);for(const r of s.sourceRows){assert.equal(fs.statSync(site+'/'+r.path).size,r.bytes);assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}for(const d of s.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}};
verify();
const prior='F:/VisibleMedicine/staging/20261028-head-search-comparison/website';
const generated=[];
for(const name of ['next-env.d.ts','.next/types/routes.d.ts']){
 const target=site+'/'+name;fs.mkdirSync(path.dirname(target),{recursive:true});
 if(!fs.existsSync(target))fs.copyFileSync(prior+'/'+name,target,fs.constants.COPYFILE_EXCL);
 assert.equal(hash(target),hash(prior+'/'+name));generated.push({path:name,sha256:hash(target)});
}
fs.mkdirSync(output);const checker=output+'/checker.mjs';
fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/types-1/checker.mjs',checker,fs.constants.COPYFILE_EXCL);
save(output+'/PREPARATION.json',{source:pin(sf),checker:pin(checker),generatedTypeInputs:generated,scopeExclusionsAdded:false});
const i=json('CURRENT_CHECKPOINT.json');assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);
assert(i.activeWork.current.ownerWslPolicy.keepRunning&&!i.activeWork.current.ownerPreviewPolicy.restartPermitted);
i.activeWork.current.activeExecutionSessions=[{kind:'release-context-full-types',pid:process.pid,evidence:dir,source:pin(sf)}];saveIndex(i);
function clean(){const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.pid===process.pid){i.activeWork.current.activeExecutionSessions=[];saveIndex(i);}}
process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))clean();});
try{
 const tmp=stage+'/temp';fs.mkdirSync(tmp,{recursive:true});Object.assign(process.env,{TEMP:tmp,TMP:tmp,TMPDIR:tmp});global.gc?.();
 const run=await guarded({site,dir,command:'--max-old-space-size=3072 '+checker,heap:3072,aggregate:3584,minimum:5632,extraEnv:{TEMP:tmp,TMP:tmp,TMPDIR:tmp,npm_config_cache:tmp+'/npm-cache',VM_WEBSITE_ROOT:site,VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:sourceSha,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas}});
 verify();const tf=output+'/TYPE_RESULT.json',type=fs.existsSync(tf)?json(tf):null;
 const passing=run.passing&&type?.fullProjectTypes===true&&type.diagnosticCount===0&&type.scopeExclusionsAdded===false;
 save(dir+'/RESULT.json',{at:new Date().toISOString(),source:pin(sf),run,passing,types:type?pin(tf):null,roots:type?.roots.length,files:type?.sourceFiles.length,diagnostics:type?.diagnosticCount,allSourceAndDependenciesExact:true,scopeExclusionsAdded:false,normalPreviewChanged:false,wholeSuitePassing:false});
 console.log(JSON.stringify({result:pin(dir+'/RESULT.json'),passing,roots:type?.roots.length,files:type?.sourceFiles.length,diagnostics:type?.diagnosticCount}));process.exitCode=passing?0:1;
}finally{clean();}
