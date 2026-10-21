import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {isAbsolute,join} from 'node:path';
import {plexusHash} from '../scripts/plexus-review-fingerprints.mjs';

const head='b953ff3f5f1891599cb6e91cb91311d9d6006270';
const tree='b13f812167b8cea1ea746423323fd59c5a60c662';
const fixtureBytes=readFileSync('tests/fixtures/plexus-before-head-checksum.txt');
assert.equal(plexusHash(fixtureBytes),'846970bb1ec6b27e9b3ba5eeddaf9e773915802fe1374c29c2739382455f8140');
const fixture=JSON.parse(fixtureBytes);
const historical=new Map([...fixture.topologyInputs,...fixture.presentationInputs]
 .filter(row=>row.kind==='website'&&row.path!=='package-lock.json')
 .map(row=>[row.path,row.sha256]));
const checkpoint=process.env.VM_PLEXUS_HISTORY_CHECKPOINT??'F:/VisibleMedicine/recovery/checkpoints/20261017-head-incremental-checksum-verified';
assert(isAbsolute(checkpoint),'VM_PLEXUS_HISTORY_CHECKPOINT must name an absolute restored checkpoint directory');
const checkpointManifest=join(checkpoint,'source/lib/plexus-review-manifest.json');
const checkpointSha='8b5ea2560fb44648b5ea322e315e90858c44e768ccc8e044922739ee9282d32d';
const setup='Historical plexus checkpoint unavailable or foreign: restore the exact local 20261017-head-incremental-checksum-verified recovery checkpoint; do not substitute a current manifest.';

function git(...args){return execFileSync('git',['-C',process.cwd(),...args],{env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});}
let checked=false;
function checkHead(){
 if(checked)return;
 assert.equal(git('rev-parse',`${head}^{commit}`).toString().trim(),head,'Exact historical Website commit required');
 assert.equal(git('rev-parse',`${head}^{tree}`).toString().trim(),tree,'Historical Website tree changed');
 git('merge-base','--is-ancestor',head,'HEAD');
 checked=true;
}
export function readHistoricalWebsite(relative){
 checkHead();
 assert(historical.has(relative),`Undeclared historical Website source: ${relative}`);
 const bytes=git('show',`${head}:${relative}`);
  if(relative==='app/chatgpt-auth.ts'){
    assert.equal(plexusHash(bytes),'4e88890c4371746be327cc0afbd6c2431bf14dd000fcedd2b804c30a6b879c57','Exact pinned Git LF auth source');
    const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);assert(!text.includes('\r'));
    const historicalBytes=Buffer.from(text.replaceAll('\n','\r\n'));
    assert.equal(plexusHash(historicalBytes),historical.get(relative),'Exact recorded historical CRLF auth bytes');
    return historicalBytes;
  }
 assert.equal(plexusHash(bytes),historical.get(relative),`Historical source blob mismatch: ${relative}`);
 return bytes;
}
export function readPostLockCheckpoint(){
 let bytes;
 try{
  const root=realpathSync(checkpoint),path=realpathSync(checkpointManifest);
  assert(path.startsWith(root+'/')||path.startsWith(root+'\\'),'Checkpoint path escapes its root');
  bytes=readFileSync(path);
  assert.equal(plexusHash(bytes),checkpointSha,'Historical checkpoint checksum mismatch');
 }catch(error){throw new Error(setup,{cause:error});}
 const packet=JSON.parse(bytes);
 assert.equal(packet.presentationInputs.length,16,'Historical checkpoint input count changed');
 assert.equal(packet.context.sourceCommit,'de82626457fb60c3b92b4e4d87a0016b6c3c09ce');
 return packet;
}
