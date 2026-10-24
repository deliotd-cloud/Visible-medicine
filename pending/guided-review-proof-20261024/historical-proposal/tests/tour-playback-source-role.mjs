import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const wireSha=value=>sha(JSON.stringify(value));
const originalHelperSha='2e0b1a061148daf71317b05c179eef9c1c4dac65cf25d79d7a5b5b3b6e8dbb8c';
const reviewedRenal='2381efe43b75f8a7fb768a069eecd7268c508dac';
const hamstringIntroduction='7978478992f54ea68e0f53c3d195c459c7b80068';
const previousSource='9eac0806a7869cfae435010b013ae611d748c0c9';
const currentSource='66ac064579ee23c5739d0907e8378e0e2d57d7bd';
const currentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';
const latestSource='5e75b9ce7e46fed291748108edd7565c97dee101';
const latestTree='005b7656f517efbd86e32a282e3d7880fc052bfe';
const historicalToursSha='446f2e8e18a60fee7a1e98281263c090a2e3f45109e94531ea055471fd28bc75';
const currentToursSha='8d838d7f227986875dfb42234d5c7001301f3016c604fb2f8af57ed171899498';
const additions=[
 {id:'right-hamstring-orientation',revision:'bilateral-hamstring-orientation-20261022-r1',steps:4,sha256:'53b1ba829da3c8634eeac766be942c72cc3ed9ecd98d824f2605c755d399e657'},
 {id:'left-hamstring-orientation',revision:'bilateral-hamstring-orientation-20261022-r1',steps:4,sha256:'e50055280a5848c20ce6eea60db7812b7f5efe6d207e20d0a1f360b9be9cefd6'},
];
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:16e6});
const revision=(root,commit)=>git(root,'rev-parse',`${commit}^{commit}`).toString().trim();
const tree=(root,commit)=>git(root,'rev-parse',`${commit}^{tree}`).toString().trim();
const blob=(root,commit,path)=>git(root,'show',`${commit}:${path}`);

function assertHistoricalRenalSource(root){
 assert.equal(revision(root,reviewedRenal),reviewedRenal);
 assert.equal(git(root,'merge-base','4f20ae0b62b9e0dab5936b430575a983dcdd934e',reviewedRenal).toString().trim(),'4f20ae0b62b9e0dab5936b430575a983dcdd934e');
 assert.equal(sha(blob(root,reviewedRenal,'lib/regional-tours.ts')),'9123a100dd7693f99a7675b3f369803e4c788de5d6ed48a850e4be9caa8534cd');
 assert.equal(sha(blob(root,'4f20ae0b62b9e0dab5936b430575a983dcdd934e','lib/regional-tours.ts')),'9123a100dd7693f99a7675b3f369803e4c788de5d6ed48a850e4be9caa8534cd');
}

// Execute the original function body byte-for-byte with a Git-only historical
// source binding. The original helper and every array assertion stay unchanged.
export function assertHistoricalRenalTourEpoch(historical,renalEra,{atlasRoot,helperSource}){
 const source=historicalRenalHelperSource(helperSource);
 assert.equal(sha(source),originalHelperSha,'Authentic complete original renal helper');
 const start='export function assertRenalTourEpoch(historical,currentTours){';
 const end='export function assertRenalPortalPrefixEpoch(';
 assert.equal(source.split(start).length,2);assert.equal(source.split(end).length,2);
 const body=source.slice(source.indexOf(start),source.indexOf(end)).replace(/^export /,'');
 const original=new Function('assert','sha','oldTourSha','newTourSha','oldRevision','newRevision','assertCurrentRenalSourceBinding',`${body}\nreturn assertRenalTourEpoch;`)(
  assert,sha,
  '57bd87627a189b7d3b50621b08b18c13b0b43e705c57dfa05c9d6f248cd34041',
  historicalToursSha,'renal-organs-arteries-orientation-v1',
  'renal-organs-arteries-orientation-20261022-source-bound-draft',
  ()=>assertHistoricalRenalSource(atlasRoot));
 original(historical,renalEra);
}

function historicalRenalHelperSource(helperSource){
 let source=readFileSync(helperSource,'utf8').replaceAll('\r\n','\n');
 if(sha(source)!==originalHelperSha){
  assert.equal(String(helperSource),String(new URL('./renal-tour-epoch-admission.mjs',import.meta.url)),
   'Only the locally composed helper may use the exact preserved historical source');
  source=readFileSync(new URL('./fixtures/renal-epoch-preimage/renal-tour-epoch-admission.mjs.raw',import.meta.url),'utf8')
   .replaceAll('\r\n','\n');
 }
 assert.equal(sha(source),originalHelperSha,'Authentic complete original renal helper');
 return source;
}

export function assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot,helperSource}){
 const source=historicalRenalHelperSource(helperSource);
 const start='export function assertRenalPortalPrefixEpoch(portal,currentTours){';
 assert.equal(source.split(start).length,2);
 const body=source.slice(source.indexOf(start)).replace(/^export /,'');
 const original=new Function('assert','sha','portalTourSha','newTourSha','oldRevision','newRevision',
  'assertCurrentRenalSourceBinding',`${body}\nreturn assertRenalPortalPrefixEpoch;`)(
  assert,sha,'2766dbafed9e364bffc3c37aa52c1f0e3b7d92e0bb46c62f250d247ae0442b3f',
  historicalToursSha,'renal-organs-arteries-orientation-v1',
  'renal-organs-arteries-orientation-20261022-source-bound-draft',
  ()=>assertHistoricalRenalSource(atlasRoot));
 original(portal,renalEra);
}

export function assertCurrentTourAdditions(renalEra,current,{atlasRoot,sourceCommit}){
 assert.equal(sourceCommit,currentSource,'Only reviewed current delivery is admitted');
 assert.equal(revision(atlasRoot,currentSource),currentSource);
 assert.equal(tree(atlasRoot,currentSource),currentTree);
 assert.equal(git(atlasRoot,'rev-parse',`${currentSource}^`).toString().trim(),previousSource,'Exact source parent');
 assert.deepEqual(git(atlasRoot,'diff','--name-only',previousSource,currentSource,'--','lib','content','app').toString().trim().split(/\r?\n/),
  ['lib/body-review-response.ts'],'Only the reviewed parser changed in feature, tour and teaching sources');
 for(const path of ['lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts','lib/posterior-calf-tour.ts',
  'lib/shoulder-tours.ts','lib/body-review-material.ts','lib/body-review-context.ts','app/body-content.ts',
  'app/regional-guided-learning.tsx','app/review/body/review-dashboard.tsx'])
  assert.deepEqual(blob(atlasRoot,currentSource,path),blob(atlasRoot,previousSource,path),path+': exact prior feature source');
 assert.equal(git(atlasRoot,'merge-base',hamstringIntroduction,currentSource).toString().trim(),hamstringIntroduction);
 for(const path of ['lib/regional-tours.ts','lib/hamstring-tours.ts'])
  assert.deepEqual(blob(atlasRoot,currentSource,path),blob(atlasRoot,hamstringIntroduction,path),path+': exact introduction source');
 assert.equal(sha(blob(atlasRoot,currentSource,'lib/regional-tours.ts')),'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d');
 assert.equal(sha(blob(atlasRoot,currentSource,'lib/hamstring-tours.ts')),'14f56f53002c574fd2eb8a6a88f23f4e8fad9476495ad227434384ef59d51737');
 assert.equal(renalEra.length,51);assert.equal(renalEra.reduce((n,t)=>n+t.steps.length,0),309);
 assert.equal(wireSha(renalEra),historicalToursSha);
 assert.equal(current.length,53);assert.equal(current.reduce((n,t)=>n+t.steps.length,0),317);
 assert.equal(wireSha(current),currentToursSha);
 assert.deepEqual(current.slice(0,51),renalEra,'Every original tour and step exact, in order');
 const added=current.slice(51).map(t=>({id:t.id,revision:t.revision,steps:t.steps.length,sha256:wireSha(t)}));
 assert.deepEqual(added,additions,'Only both reviewed hamstring tours append');
 return {historical:51,current:53,added:additions.map(t=>t.id)};
}

export function assertLatestTourDelivery(renalEra,current,{atlasRoot,sourceCommit}){
 assert.equal(sourceCommit,latestSource,'Only the bound current Website source is admitted');
 assert.equal(revision(atlasRoot,latestSource),latestSource);
 assert.equal(tree(atlasRoot,latestSource),latestTree);
 assert.equal(git(atlasRoot,'merge-base',currentSource,latestSource).toString().trim(),currentSource,
  'Reviewed parser epoch is an ancestor of current delivery');
 for(const path of ['lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts',
  'lib/posterior-calf-tour.ts','lib/shoulder-tours.ts','lib/body-review-material.ts',
  'lib/body-review-context.ts','app/body-content.ts'])
  assert.deepEqual(blob(atlasRoot,latestSource,path),blob(atlasRoot,currentSource,path),
   path+': complete reviewed tour and Review source retained');
 return assertCurrentTourAdditions(renalEra,current,{atlasRoot,sourceCommit:currentSource});
}

export function assertCurrentGuidedReviewAdditions(renalGuides,currentGuides,currentTours){
 assert(Array.isArray(renalGuides)&&Array.isArray(currentGuides)&&Array.isArray(currentTours));
 assert.deepEqual(currentGuides.slice(0,renalGuides.length),renalGuides,'Every earlier guide packet exact and ordered');
 const appended=currentGuides.slice(renalGuides.length);
 const expectedTours=new Map(currentTours.slice(51).map(t=>[t.id,t]));
 const guideHashes=new Map([
  ['right-hamstring-orientation','23a3e9fcda3e4cfba62d69a18f99da2cf03a1d4274a9b700356ac8a3ae58dc00'],
  ['left-hamstring-orientation','9a2610b56f4396e835ca37f3f5b12867cfc046f7a568db7bf55a589eb2f3bd4f'],
 ]);
 assert.deepEqual([...expectedTours.keys()],additions.map(t=>t.id));
 assert.equal(new Set(appended.map(g=>g.tour.id)).size,appended.length,'No duplicated new guide');
 for(const guide of appended){
  const tour=expectedTours.get(guide.tour.id);
  assert(tour,'Only the two authenticated hamstring tours may add Review evidence');
  assert.deepEqual(guide.tour,tour,'Complete new guide tour equals the bound current source');
  assert.equal(wireSha(guide),guideHashes.get(guide.tour.id),'Exact added Review guide packet');
 }
 return appended.map(g=>g.tour.id);
}
