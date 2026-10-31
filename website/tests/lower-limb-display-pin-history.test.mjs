import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import {exactDisplayPinHistory,displayPinEpochs} from './lower-limb-display-pin-history.mjs';
import {restoreLowerLimbCurrentRole} from './lower-limb-current-role-inverse.mjs';
const root=currentAtlasDeliveryRoot(),sha=b=>createHash('sha256').update(b).digest('hex');
const git=(commit,p)=>execFileSync('git',['show',commit+':'+p],{cwd:root,windowsHide:true,maxBuffer:4*1024*1024});
const bytes=readFileSync(new URL('../atlas-review/content/body-review-display-pins.json',import.meta.url));
const input={readGit:git,revision:CURRENT_ATLAS_REVISION,currentBytes:bytes};
const succession=JSON.parse(readFileSync(new URL('./fixtures/release18-lower/display-pin-c32-succession.json',import.meta.url)));

test('complete original connective proof and old two-colic theorem survive the exact source-role inverse',()=>{
 let source=restoreLowerLimbCurrentRole(readFileSync(new URL('./clinical-review-lower-limb-connective-xray.test.ts',import.meta.url))).toString('utf8');
 const once=(from,to)=>{assert.equal(source.split(from).length,2);source=source.replace(from,to);};
 once("import {exactDisplayPinHistory} from './lower-limb-display-pin-history.mjs';\n",'');
 once(" const displayHistory=exactDisplayPinHistory({readGit:git,revision,currentBytes:readFileSync('atlas-review/'+displayPins)});\n assert.deepEqual(displayHistory.currentById,newById,'Current imported display pins retain their complete exact source history');\n",'');
 once('const sincePrior=[...displayHistory.colicById]','const sincePrior=[...newById]');
 assert.equal(sha(source),'7aa5be85013096667406747701dc40b50bec69e22a676f2163b4680a773904d3');
});

test('all1104 exact pins retain the original fourteen transitions and every source revision through c32',()=>{
 const result=exactDisplayPinHistory(input);assert.equal(result.currentById.size,1104);
 assert.deepEqual(result.transitions.slice(0,14).map(r=>r.ids.length),[2,3,5,22,6,3,8,6,8,12,12,12,20,8],
  'All original historical pin transitions remain exact');
 assert.deepEqual(result.transitions.slice(14).map(r=>r.ids.length),succession.rows.map(r=>r.changedCount));
 assert.deepEqual(result.transitions.slice(14).map(r=>r.source),succession.rows.map(r=>r.commit));
 const commits=execFileSync('git',['log','--reverse','--format=%H',succession.from+'..'+CURRENT_ATLAS_REVISION,
  '--','content/body-review-display-pins.json'],{cwd:root,encoding:'utf8',windowsHide:true,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim().split('\n');
 assert.deepEqual(commits,succession.rows.map(r=>r.commit),'Every actual subsequent pin-changing commit admitted');
 assert.equal(sha(bytes),succession.toSha256,'Current imported full document');
 const prior=new Map(JSON.parse(git(displayPinEpochs[0][0],'content/body-review-display-pins.json')).pins.map(r=>[r.structureId,r.sha256]));
 const colic=[...result.colicById].filter(([id,hash])=>hash!==prior.get(id)).map(([id])=>id).sort();
 assert.equal(sha(JSON.stringify(colic)),'67764eea6c280f5875a97203563de86019840415d92a80dc1ce97d8bb0486ff9');
});

test('missing, foreign, malformed, duplicate or unrecognized pin changes fail closed',()=>{
 for(const change of [v=>v.pins.pop(),v=>v.pins[0].sha256='0'.repeat(64),v=>v.pins[0].structureId='foreign',v=>v.pins[0].sha256='approved',v=>v.pins[0]=v.pins[1],v=>v.pins.reverse(),v=>v.scope='approved']){
  const value=JSON.parse(bytes);change(value);const currentBytes=Buffer.from(JSON.stringify(value));
  // Even a matching current Git callback cannot admit an unknown difference.
  const forged={...input,currentBytes,readGit:(commit,p)=>commit===CURRENT_ATLAS_REVISION?currentBytes:git(commit,p)};
  assert.throws(()=>exactDisplayPinHistory(forged),{name:'AssertionError'});
 }
 assert.throws(()=>exactDisplayPinHistory({...input,readGit:()=>{throw Error('missing immutable source');}}),/missing immutable source/);
 assert.throws(()=>exactDisplayPinHistory({...input,readGit:()=>bytes}),/Exact historical display-pin bytes/);
 const firstLater=succession.rows[0].commit;
 assert.throws(()=>exactDisplayPinHistory({...input,
  readGit:(commit,p)=>commit===firstLater?git(succession.from,p):git(commit,p)}),
  /Exact subsequent display-pin bytes/);
 const original=JSON.parse(bytes);original.pins.reverse();const reordered=Buffer.from(JSON.stringify(original));
 assert.throws(()=>exactDisplayPinHistory({...input,currentBytes:reordered}),/Current imported pins/);
});
