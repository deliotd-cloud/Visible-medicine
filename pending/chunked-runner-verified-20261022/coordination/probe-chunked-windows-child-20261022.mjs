import fs from 'node:fs';
import assert from 'node:assert/strict';
import {main} from 'file:///F:/VisibleMedicine/staging/20261022-release-chunked-runner-revision2/scripts/run-website-tests-chunked.mjs';
import {inspectProcess} from 'file:///F:/VisibleMedicine/staging/20261022-release-chunked-runner-revision2/scripts/website-test-process.mjs';
import {sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-release-chunked-runner-revision2';
const fixture=stage+'/main-windows-child';
const mode=process.argv[2]??'initial';assert(['initial','final-run','final-resume'].includes(mode));
assert.equal(process.platform,'win32');
const identity=inspectProcess(process.pid);assert.equal(identity.state,'alive');
const before=Date.now(),prior=console.log,output=[];let code,error;
console.log=value=>output.push(value);
const args=mode==='final-resume'?['--resume',JSON.parse(JSON.parse(fs.readFileSync(stage+'/MAIN_WINDOWS_final-run.json')).output[0]).batch,'--root',fixture]:['--run','--root',fixture,'--chunk-size','1'];
try{code=await main(args,{preflight:()=>({history:{synthetic:true},preview:{synthetic:true},synthetic:true})});}catch(e){error=e.message;}finally{console.log=prior;}
const result={at:new Date().toISOString(),code,error,elapsedMs:Date.now()-before,realWindowsProcessIdentity:identity,output,source:'Synthetic one-test root with actual default Windows inspector; no Website roots, normal preview or full gate executed',previewChanged:false};
const receipt=stage+(mode==='initial'?'/MAIN_WINDOWS_PROBE.json':'/MAIN_WINDOWS_'+mode+'.json');
fs.writeFileSync(receipt,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt,sha256:sha(fs.readFileSync(receipt)),...result}));
