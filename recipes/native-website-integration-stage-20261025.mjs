import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
export const stage='F:/VisibleMedicine/staging/20261025-native-integrated-website';
export const site=stage+'/website';
export const prepHash='ee6cfd58b8abd0155913ab13c48f9d39996a951c37f06900c04fbe9a4afb0685';
assert.equal(hash(stage+'/PREPARATION.json'),prepHash);
export const prep=json(stage+'/PREPARATION.json');
export const row=path=>({path,bytes:fs.statSync(site+'/'+path).size,sha256:hash(site+'/'+path)});
export const save=(path,value)=>fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
export function memoryGate(minimumMiB){
 const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
 if(memory.AvailableMBytes<minimumMiB||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,memory,minimumMiB}));process.exit(75);}return memory;
}
export function verify(state=json(stage+'/CURRENT_STOCK_METADATA.json')){
 const expected=new Map(prep.baseSourceRows.map(r=>[r.path,{...r}]));
 expected.get('scripts/import-clinical-review.mjs').sha256=json(stage+'/IMPORTER_INVERSE.json').afterSha256;
 for(const r of state.mutable)expected.set(r.path,r);
 for(const r of expected.values())assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const r of prep.runtimeRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 assert.equal(hash(site+'/atlas-review/manifest.json'),state.importManifestSha256);
 for(const r of json(site+'/atlas-review/manifest.json').files)assert.equal(hash(site+'/atlas-review/'+r.path),r.importedSha256,r.path);
 if(state.integrationInputsSha256)assert.equal(hash(site+'/atlas-review/integration-inputs.json'),state.integrationInputsSha256);
 for(const [repo,head]of [[prep.atlas,prep.atlasHead],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270']])assert.equal(execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
 assert.equal(execFileSync('git',['-C',prep.atlas,'status','--porcelain'],{encoding:'utf8',windowsHide:true}).trim(),'');
 const index=json('CURRENT_CHECKPOINT.json');assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);
 return state;
}
export function updateState(state,phase,paths=[],extra={}){
 const mutable=new Map(state.mutable.map(r=>[r.path,r]));for(const path of paths)mutable.set(path,row(path));
 const next={...state,at:new Date().toISOString(),phase,mutable:[...mutable.values()].sort((a,b)=>a.path.localeCompare(b.path)),...extra};
 fs.writeFileSync(stage+'/CURRENT_STOCK_METADATA.json',JSON.stringify(next,null,2)+'\n');return next;
}
