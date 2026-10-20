import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {copyFileSync,existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {main} from '../scripts/run-website-tests.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const site=join(here,'..');
const local=join(site,'.local','public-preview-runner-fixtures');mkdirSync(local,{recursive:true});
const assets=['manifest.json','NOTICES.md','3d-detail-preview.jpg','ct-preview.png','mri-preview.png','ultrasound-preview.jpg','xray-preview.png'];
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture({previews=true,producer=true,body="import test from 'node:test';import{writeFileSync}from'node:fs';test('synthetic child',()=>writeFileSync('.local/child-ran','yes'));\n"}={}){
 const root=mkdtempSync(join(local,'source-'));mkdirSync(join(root,'tests'));
 writeFileSync(join(root,'package.json'),'{"type":"module"}\n');writeFileSync(join(root,'tests','probe.test.mjs'),body);
 if(producer){mkdirSync(join(root,'lib'));writeFileSync(join(root,'lib','atlas-navigation.ts'),'// Synthetic declared public Atlas producer\n');}
 if(previews){const dir=join(root,'public','media','atlas');mkdirSync(dir,{recursive:true});for(const name of assets)copyFileSync(join(site,'public','media','atlas',name),join(dir,name));}
 return root;
}
async function capture(root,run=true){
 const prior=console.log;let summary;console.log=value=>{summary=JSON.parse(value);};
 try{const code=await main(['--root',root,run?'--run':'--list']);return{code,summary,manifest:JSON.parse(readFileSync(join(summary.output,'manifest.json'))),receipt:JSON.parse(readFileSync(join(summary.output,'receipt.json')))};}
 finally{console.log=prior;}
}

test('declared public Atlas inputs refuse missing tiles before any output, probe or child spawn',async()=>{
 const root=fixture({previews:false});
 await assert.rejects(main(['--root',root,'--run']),/Public Atlas preview preflight: missing directory/);
 assert.equal(existsSync(join(root,'.local')),false,'No output/probe/child may have been created');
 assert.equal(existsSync(join(root,'.local','child-ran')),false);
});

test('the actual CLI fails usefully before spawn on source-only Website recovery',()=>{
 const root=fixture({previews:false});const env={...process.env};delete env.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,[join(site,'scripts','run-website-tests.mjs'),'--root',root,'--run'],{cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:1e6});
 assert.equal(result.status,1);assert.equal(result.stdout,'');assert.match(result.stderr,/source-only backups may omit these binaries/);
 assert.equal(existsSync(join(root,'.local')),false);
});

test('the physical default Website root cannot evade the asset gate by omitting its Atlas producer',()=>{
 const root=fixture({previews:false,producer:false});mkdirSync(join(root,'scripts'));
 for(const file of ['run-website-tests.mjs','public-preview-preflight.mjs','website-test-history-preflight.mjs','website-test-local-archives-preflight.mjs'])copyFileSync(join(site,'scripts',file),join(root,'scripts',file));
 const env={...process.env};delete env.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,[join(root,'scripts','run-website-tests.mjs'),'--run'],{cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:1e6});
 assert.equal(result.status,1);assert.match(result.stderr,/Public Atlas preview preflight/);
 assert.equal(existsSync(join(root,'.local')),false);
});

test('the Atlas preview test entry requires its assets even without a producer module',async()=>{
 const root=fixture({previews:false,producer:false});
 writeFileSync(join(root,'tests','atlas-navigation.test.ts'),"import test from'node:test';test('synthetic Atlas declaration',()=>{});\n");
 await assert.rejects(main(['--root',root,'--run']),/Public Atlas preview preflight/);
 assert.equal(existsSync(join(root,'.local')),false);
});

test('list mode keeps discovery available without reading or claiming missing binary previews',async()=>{
 const root=fixture({previews:false});const result=await capture(root,false);
 assert.equal(result.code,0);assert.equal(result.receipt.launched,false);assert.equal(result.receipt.publicPreviewAssets,null);
 assert.equal(result.receipt.publicPreviewAssetDrift,null);assert.equal(result.receipt.passingClaim,false);
 assert.equal(existsSync(join(root,'.local','child-ran')),false);
 assert.deepEqual(result.manifest.execution.args,['--test','--experimental-strip-types','--test-concurrency=1','tests/*.test.ts','tests/*.test.mjs']);
});

test('minimal generic roots retain original run semantics without an Atlas asset claim',async()=>{
 const root=fixture({previews:false,producer:false});const result=await capture(root);
 assert.equal(result.code,0);assert.equal(result.receipt.passingClaim,true);assert.equal(result.receipt.testInputDrift,false);
 assert.deepEqual(result.receipt.publicPreviewAssets,{required:false,before:null});assert.equal(result.receipt.publicPreviewAssetDrift,null);
 assert.equal(existsSync(join(root,'.local','child-ran')),true);
});

test('stable public previews record their exact integrity and preserve both native reporter streams',async()=>{
 const root=fixture();const result=await capture(root);
 assert.equal(result.code,0);assert.equal(result.receipt.passingClaim,true);assert.equal(result.receipt.unskippedPassingClaim,true);
 assert.equal(result.receipt.testInputDrift,false);assert.equal(result.receipt.publicPreviewAssetDrift,false);
 assert.equal(result.summary.publicPreviewAssetDrift,false);
 assert.equal(result.receipt.publicPreviewAssets.required,true);assert.equal(result.receipt.publicPreviewAssets.before.assets.length,5);
 assert.deepEqual(result.manifest.publicPreviewAssets,result.receipt.publicPreviewAssets);
 assert.equal(result.receipt.counts.tests,1);assert.match(readFileSync(join(result.summary.output,'child.tap'),'utf8'),/^TAP version 13/);
 assert.match(readFileSync(join(result.summary.output,'child.log'),'utf8'),/synthetic child/);
 for(const a of result.receipt.publicPreviewAssets.before.assets)assert.equal(sha(readFileSync(join(root,a.file))),a.sha256);
 assert(!result.manifest.files.some(f=>/\.(png|jpg)$/.test(f.path)),'No general binary/scan inventory expansion');
});

test('an otherwise passing child cannot claim a pass after public preview bytes drift',async()=>{
 const root=fixture({body:"import test from'node:test';import{readFileSync,writeFileSync}from'node:fs';test('synthetic preview drift',()=>{const p='public/media/atlas/ct-preview.png',b=readFileSync(p);b[0]^=1;writeFileSync(p,b);});\n"});
 const result=await capture(root);
 assert.equal(result.receipt.child.exitCode,0);assert.equal(result.receipt.testInputDrift,false,'Text-source inventory must not pretend it covered binary media');
 assert.equal(result.receipt.publicPreviewAssetDrift,true);assert.equal(result.code,1);
 assert.equal(result.summary.publicPreviewAssetDrift,true,'The console summary must expose the independent asset-drift reason');
 assert.equal(result.receipt.passingClaim,false);assert.equal(result.receipt.unskippedPassingClaim,false);
 assert.match(result.receipt.child.postRunPublicPreviewError,/changed public preview bytes/);
});

test('a failed child remains failed even when all public preview inputs remain intact',async()=>{
 const root=fixture({body:"import test from'node:test';test('synthetic failure',()=>{throw Error('expected failure');});\n"});
 const result=await capture(root);assert.equal(result.code,1);assert.equal(result.receipt.child.exitCode,1);
 assert.equal(result.receipt.publicPreviewAssetDrift,false);assert.equal(result.receipt.passingClaim,false);
});
