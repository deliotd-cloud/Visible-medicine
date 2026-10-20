// Pure staged-file/source-byte proof. Does not import or run Website tests.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {runInNewContext} from 'node:vm';

const here=dirname(fileURLToPath(import.meta.url));
const site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact={
 'anatomy-coverage-revision-admission.test.mjs':{
  original:'3611dc20929cac9bb27c5ac4aac85c27498d4862b2feb5a5a716f3ed4f2b95a0',
  proposal:'8ee56ade2e3b70c5e5b50ee6a629d411635da3c5ff5b89a5670181a47b80edb1'},
 'atlas-arterial-evidence-limits.test.mjs':{
  original:'7b105f5146aab1653aedca9a7150a73733575f87e7e848063cb07e8faea9b843',
  proposal:'840d4ecb8bef4c4bf725f1cecd39fa6e53dfa9a7c4d2922a750851509806451a'},
};
const sourceHashes={
 'docs/anatomy-coverage/index.json':'9020eac8ed2fee77ef04b63357eabd23471f99e3e966d5b2c427010ee3478579',
 'scripts/check-anatomy-coverage.mjs':'7111c89c35ea528818092e6118433c050f679f986910d4d9a6fe61f314c1bc8b',
 'lib/anatomy-coverage-view.ts':'700e5b8ebd6f7aeafd98e858879da10d35b94aab977c564f80616d4c585e01e5',
 'tests/clinical-review-desktop-layout.test.mjs':'4d1ba4639ad5f71378a1ae84fec3d1224c86ff90cacf4b767212386390bf15bf',
 'tests/fixtures/current-delivery-before-inbox485/clinical-review-desktop-layout.test.mjs.raw':'400c50faf155feb09658c081f6db9ef35c598e7b83872f6d1e85f5847913891a',
 'tests/fixtures/current-atlas-delivery.json':'7f08673542eedf10d211b4668aad93efc65ab7854d6141ec409512edd3785eba',
};
for(const [path,want] of Object.entries(sourceHashes))assert.equal(sha(readFileSync(join(site,path))),want,path);

// The LCS edit ledger reverses every changed line and hashes the exact original
// whole file. Assertion/test lines outside those edit hunks remain byte exact.
function inverse(original,proposal){
 const old=original.split('\n'),now=proposal.split('\n');
 const dp=Array.from({length:old.length+1},()=>new Uint16Array(now.length+1));
 for(let i=old.length-1;i>=0;i--)for(let j=now.length-1;j>=0;j--)
  dp[i][j]=old[i]===now[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const edits=[];let i=0,j=0,retained=0;
 while(i<old.length||j<now.length){
  if(i<old.length&&j<now.length&&old[i]===now[j]){i++;j++;retained++;continue;}
  const start=j,removed=[],added=[];
  while(i<old.length||j<now.length){
   if(i<old.length&&j<now.length&&old[i]===now[j])break;
   if(i<old.length&&(j===now.length||dp[i+1][j]>=dp[i][j+1]))removed.push(old[i++]);
   else added.push(now[j++]);
  }
  edits.push({start,removed,added});
 }
 const restored=[...now];
 for(const {start,removed,added} of edits.reverse()){
  assert.deepEqual(restored.slice(start,start+added.length),added);
  restored.splice(start,added.length,...removed);
 }
 assert.equal(restored.join('\n'),original,'whole original bytes reconstruct');
 assert.deepEqual(old.filter(x=>x.includes("test('")),now.filter(x=>x.includes("test('")),'test declarations retained');
 const protectedLines=old.filter(x=>/assert\.throws|assert\.rejects|storageCalls|clinicalApprovalAsserted|patientRegistrationAsserted/.test(x));
 for(const line of protectedLines)assert(now.includes(line),'protected assertion retained: '+line);
 return {retainedLines:retained,editHunks:edits.length,originalLines:old.length,proposalLines:now.length};
}
const inverseProof={};
for(const [name,hashes] of Object.entries(exact)){
 const original=readFileSync(join(here,'originals/tests',name));
 const proposal=readFileSync(join(here,'tests',name));
 assert.equal(sha(original),hashes.original,name+' original');
 assert.equal(sha(proposal),hashes.proposal,name+' proposal');
 inverseProof[name]=inverse(original.toString(),proposal.toString());
}

const index=JSON.parse(readFileSync(join(site,'docs/anatomy-coverage/index.json')));
const oldIndex=JSON.parse(readFileSync(join(site,'tests/fixtures/coverage-before-6036/index.json.raw')));
const pin=JSON.parse(readFileSync(join(site,'tests/fixtures/current-atlas-delivery.json')));
assert.equal(index.sourceRevision,pin.source);
assert.equal(pin.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');
assert.equal(pin.reviewSourceFiles,1550);
assert.equal(JSON.parse(readFileSync(join(site,'atlas-review/integration-inputs.json'))).inputs.length,1707);
assert.equal(Object.keys(index.evidence.sourceInputs).length,168);
assert.deepEqual(Object.keys(index.evidence.sourceInputs).filter(path=>index.evidence.sourceInputs[path]!==oldIndex.evidence.sourceInputs[path]),['package.json']);
assert.equal(sha(JSON.stringify(index)),'443eeaa198c30e88d73aa6d89f37376715ccd23bb6c27c5c904a075c39cbe31c');
const historical=structuredClone(index);
historical.sourceRevision='87ed7e343260c7df48a40d53503f25bbfd34cfa5';
historical.evidence.sourceInputs['package.json']='92354287efdd18168d92cef9157503a73dde54aafe63bd9fbcc49555b0be3f23';
for(const [i,value] of [
 'd64eb4aea86cc086180e3412bacd9b874cc2c894e4bc5b99c089b8ad8221098d',
 '08d9848e8e40364c11825ef643fb7598ab107481df83f7103715d6dd0f15f7b0',
 'e83d5d34b5c76d3f149a02c96c9abd51f83a90dcccf7edc28baac95177f063f8',
 '3a9ffe23e34e845b2708e44d1c8ecd140939996ab0ecf360683cc614addf7fab',
].entries())historical.sourceArtifacts[i].sha256=value;
assert.equal(sha(JSON.stringify(historical)),'f21e422407b8ca000441c2d924b54fa2fccfef03f409cb20579e451412473201');

// Evaluate only the pure, self-contained historical inverse/metadata callback
// bodies from the proposed file. No test module is imported or scheduled.
function restoreDeclarations(source,replacements){
 let result=source;
 for(const [from,to] of replacements){
  assert.equal(result.split(from).length,2,'Exact declared binding must occur once');
  result=result.replace(from,to);
 }
 return result;
}
const proposed=readFileSync(join(here,'tests/anatomy-coverage-revision-admission.test.mjs'),'utf8');
const realmAssert=new Proxy(assert,{get(target,key){
 if(key==='deepEqual')return (actual,expected,message)=>assert.deepEqual(structuredClone(actual),structuredClone(expected),message);
 return Reflect.get(target,key);
}});
const context={
 assert:realmAssert,sha,restoreDeclarations,structuredClone,
 readFileSync:(path,encoding)=>readFileSync(join(site,path),encoding),
 fixture:'tests/fixtures/coverage-before-6036/',
 json:path=>JSON.parse(readFileSync(join(site,path),'utf8')),
 text:path=>readFileSync(join(site,path),'utf8').replaceAll('\r\n','\n'),
 coverageArtifacts:index.sourceArtifacts,
 previousCurrent:'6036a7a59dcc1fd75eee4a23af34ca2a568d86b6',
};
const pureNames=[
 'desktop source restores its exact pre-repair body, then its raw original through the two coverage declarations',
 'regeneration changes evidence identity without changing factual inventory or relaxing holds',
 'checker and view retain their entire prior bodies with only declared pins changed',
];
for(const name of pureNames){
 const marker=`test('${name}',()=>{`;
 const start=proposed.indexOf(marker);
 assert(start>=0,name);
 const bodyStart=start+marker.length,bodyEnd=proposed.indexOf('\n});',bodyStart);
 assert(bodyEnd>bodyStart,name+' closes');
 runInNewContext(`(()=>{${proposed.slice(bodyStart,bodyEnd)}\n})()`,context,{timeout:3000});
}
console.log(JSON.stringify({status:'pass',scope:'staged inverse, pure historical callbacks and metadata only',inverseProof,pureCallbacks:3,currentCoverageSha256:sha(JSON.stringify(index)),historicalCoverageSha256:sha(JSON.stringify(historical))}));
