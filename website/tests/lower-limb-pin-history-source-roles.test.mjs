import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import {exactDisplayPinHistory,displayPinEpochs} from './lower-limb-display-pin-history.mjs';
import {restoreRelease18LowerHistory} from './release18-lower-history-inverse.mjs';

const here=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const sha=source=>createHash('sha256').update(source).digest('hex');
const currentHelperSha='948ca66d04c9a4c5b5ab6a82d1f2ed488d82f0b6ba00320dce70807d57734fa7';
const currentTestSha='e8581483d1f6823e30bc4517ff067dbc7da50d94d849d9ac3d3e26edd8fcf5a9';
const once=(source,from,to)=>{
 assert.equal(source.split(from).length,2,'Exactly one source-role seam: '+from.slice(0,70));
 return source.replace(from,to);
};

function restoreHelper(source){
 source=restoreRelease18LowerHistory('lower-limb-display-pin-history.mjs',Buffer.from(source)).toString('utf8');
 assert.equal(sha(source),currentHelperSha,'Exact complete current helper before source-role inverse');
 source=once(source,
  source.slice(source.indexOf('// Every later pin-changing source commit'),source.indexOf('const colic=[')), '');
 source=once(source,
  " assert.equal(sha(readGit(displayPinEpochs[3][0],file)),displayPinEpochs[3][1],'Current pin document must be the complete declared renal source epoch; unknown fields, ordering or revisions are not admitted');",
  " assert.equal(sha(currentBytes),displayPinEpochs[3][1],'Current pin document must be the complete declared renal source epoch; unknown fields, ordering or revisions are not admitted');");
 const start=source.indexOf(' const transitions=[{source:displayPinEpochs[1][0]');
 assert(start>0,'Later transition seam exists');
 const end=source.indexOf('\n}',start);
 assert(end>start,'Later transition seam closes');
 source=once(source,source.slice(start,end),
  " assert.deepEqual(current,renalById,'Unrecognized later display-pin changes require a new explicit source-bound history, not a widened allowance');\n"+
  " assert.deepEqual(changed(prior,current),[...colic,...neck,...renal].sort());\n"+
  " return{colicById,currentById:current,transitions:[{source:displayPinEpochs[1][0],ids:[...colic]},{source:displayPinEpochs[2][0],ids:[...neck]},{source:displayPinEpochs[3][0],ids:[...renal]}]};");
 return source;
}

function restoreTest(source){
 source=restoreRelease18LowerHistory('lower-limb-display-pin-history.test.mjs',Buffer.from(source)).toString('utf8');
 assert.equal(sha(source),currentTestSha,'Exact complete current consumer test before source-role inverse');
 source=once(source,"import {restoreLowerLimbCurrentRole} from './lower-limb-current-role-inverse.mjs';\n",'');
 source=once(source,
  " let source=restoreLowerLimbCurrentRole(readFileSync(new URL('./clinical-review-lower-limb-connective-xray.test.ts',import.meta.url))).toString('utf8');",
  " let source=readFileSync(new URL('./clinical-review-lower-limb-connective-xray.test.ts',import.meta.url),'utf8');");
 source=once(source,
  "test('all1104 exact pins retain two colic, three neck, five renal and eleven later source revisions',()=>{",
  "test('all1104 exact pins decompose into two colic, three neck and five renal revisions',()=>{");
 source=once(source,
  ' assert.deepEqual(result.transitions.map(r=>r.ids.length),[2,3,5,22,6,3,8,6,8,12,12,12,20,8]);',
  ' assert.deepEqual(result.transitions.map(r=>r.ids.length),[2,3,5]);');
 return source;
}

test('helper and consumer test preserve complete original source through exact role inverses',()=>{
 assert.equal(restoreHelper(here('./lower-limb-display-pin-history.mjs')),
  here('./fixtures/lower-limb-b79-preimage/lower-limb-display-pin-history.mjs.raw'));
 assert.equal(restoreTest(here('./lower-limb-display-pin-history.test.mjs')),
  here('./fixtures/lower-limb-b79-preimage/lower-limb-display-pin-history.test.mjs.raw'));
});

test('source inverses refuse removed assertions, altered history and foreign helper edits',()=>{
 const helper=here('./lower-limb-display-pin-history.mjs');
 const consumer=here('./lower-limb-display-pin-history.test.mjs');
 for(const changed of [
  helper.replace('assert.deepEqual(changed(prior,colicById),colic);',''),
  helper.replace('assert.equal(ids.length,count,','assert(ids.length>=count,'),
  helper.replace('const map=bytes=>','const foreign=()=>true;\nconst map=bytes=>'),
  helper.replace('b79e110d2d28f18993263926ba35aa7a3f478b20','a79e110d2d28f18993263926ba35aa7a3f478b20')
 ])assert.throws(()=>restoreHelper(changed),/Exact complete current helper/);
 for(const changed of [
  consumer.replace("assert.equal(sha(source),'7aa5be85013096667406747701dc40b50bec69e22a676f2163b4680a773904d3');",''),
  consumer.replace(' const prior=new Map(', ' const foreign=true;\n const prior=new Map('),
  consumer.replace('assert.throws(()=>exactDisplayPinHistory(forged)', 'assert.doesNotThrow(()=>exactDisplayPinHistory(forged)')
 ])assert.throws(()=>restoreTest(changed),/Exact complete current consumer test/);
});

test('changed current and historical source callbacks cannot authenticate later bytes',()=>{
 const root=currentAtlasDeliveryRoot();
 const file='content/body-review-display-pins.json';
 const git=(commit,path)=>execFileSync('git',['show',commit+':'+path],{cwd:root,windowsHide:true,maxBuffer:4*1024*1024});
 const currentBytes=readFileSync(new URL('../atlas-review/content/body-review-display-pins.json',import.meta.url));
 const input={readGit:git,revision:CURRENT_ATLAS_REVISION,currentBytes};
 const value=JSON.parse(currentBytes);value.pins[0].sha256='0'.repeat(64);
 const forged=Buffer.from(JSON.stringify(value));
 assert.throws(()=>exactDisplayPinHistory({...input,currentBytes:forged,
  readGit:(commit,path)=>commit===CURRENT_ATLAS_REVISION?forged:git(commit,path)}),{name:'AssertionError'});
 const previous=git(displayPinEpochs[3][0],file);
 assert.throws(()=>exactDisplayPinHistory({...input,
  readGit:(commit,path)=>commit==='7978478992f54ea68e0f53c3d195c459c7b80068'?previous:git(commit,path)}),
  /Exact later display-pin bytes/);
});
