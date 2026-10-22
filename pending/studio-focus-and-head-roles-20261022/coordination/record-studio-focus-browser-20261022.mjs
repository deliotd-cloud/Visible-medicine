// Bind observed synthetic browser results to exact source and test assets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-studio-details-focus-successor',stage=root+'/browser-specimen';
const sourcePath=root+'/SOURCE.json',source=json(sourcePath),inputsPath=stage+'/INPUTS.json',inputs=json(inputsPath),observedPath=stage+'/OBSERVED.json',observed=json(observedPath);
assert.equal(sha(read(sourcePath)),'ac4654d3c76ba13b449be34be5502f372ebf13f286c60e100d5933e221e41965');
assert.equal(inputs.sourceReceiptSha256,sha(read(sourcePath)));assert.equal(inputs.actualComponent,true);assert.equal(inputs.syntheticFormsAndNextRouting,true);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
assert.equal(sha(read(inputs.cssSource.path)),inputs.cssSource.sha256);
for(const row of inputs.generated)assert.equal(sha(read(stage+row.path)),row.sha256,row.path);
assert.equal(Object.keys(observed.checks).length,10);assert.equal(observed.checks.initial.focusTag,'BODY');
for(const [group,checks] of Object.entries(observed.checks))for(const [key,value] of Object.entries(checks))if(key!=='focusTag')assert.equal(value,true,group+'/'+key);
assert.deepEqual(observed.viewport,{width:1280,height:720});assert.equal(observed.consoleWarningsOrErrors,0);assert.equal(observed.ownedTabClosed,true);assert.equal(observed.ownedServerStopped,true);
await new Promise((resolve,reject)=>{const socket=net.connect({host:'127.0.0.1',port:3014});socket.setTimeout(1500);socket.once('connect',()=>{socket.destroy();reject(Error('Owned specimen listener still active'));});socket.once('error',error=>error.code==='ECONNREFUSED'?resolve():reject(error));socket.once('timeout',()=>{socket.destroy();reject(Error('Unverified specimen teardown'));});});
const result={at:new Date().toISOString(),sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),inputs:{path:inputsPath,sha256:sha(read(inputsPath))},observations:{path:observedPath,sha256:sha(read(observedPath))},
 recorder:{path:path.resolve(process.argv[1]),sha256:sha(read(process.argv[1]))},checks:observed.checks,viewport:observed.viewport,actualComponent:true,realReact:true,cssScope:inputs.cssSource.scope,syntheticFormsAndNextRouting:true,
 ownedTabClosed:true,ownedServerStopped:true,consoleWarningsOrErrors:0,accessibilityTreeFileSaved:false,snapshotFileLimitation:observed.toolEvidenceLimit,
 signedInEndToEndTested:false,screenReaderCertification:false,fullWebsiteAcceptance:false,clinicalApproval:false,ownerPreviewChanged:false,canonicalInstalled:false,publicDeployment:false};
fs.writeFileSync(stage+'/BROWSER_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:stage+'/BROWSER_RESULT.json',sha256:sha(read(stage+'/BROWSER_RESULT.json')),groups:Object.keys(result.checks).length,ownedServerStopped:true,ownerPreviewChanged:false}));
