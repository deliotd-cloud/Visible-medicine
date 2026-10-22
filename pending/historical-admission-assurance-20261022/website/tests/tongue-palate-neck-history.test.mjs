import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeNeckXraySnapshot,beforeNeckXrayBody} from './tongue-palate-neck-history.mjs';
const seams=[
  [
    "import {currentAtlasDeliveryRoot, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
    "import {currentAtlasDeliveryRoot, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {beforeNeckXraySnapshot,beforeNeckXrayBody} from './tongue-palate-neck-history.mjs';"
  ],
  [
    "    const currentSnapshotBytes=git(atlas,'show',`${current}:${snapshotPath}`);",
    "    const liveSnapshotBytes=git(atlas,'show',`${current}:${snapshotPath}`);\n    const liveSnapshot=JSON.parse(liveSnapshotBytes.toString());\n    const currentSnapshotBytes=beforeNeckXraySnapshot(liveSnapshotBytes,git(atlas,'show',`6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:${snapshotPath}`));"
  ],
  [
    "    let currentBody = git(atlas, 'show', `${current}:app/body-content.ts`).toString();",
    "    let currentBody = beforeNeckXrayBody(git(atlas, 'show', `${current}:app/body-content.ts`),git(atlas,'show','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:app/body-content.ts')).toString();"
  ],
  [
    "      assert(authoredEntry && currentEntry,`${entry.identity.id}: both source placements retained`);",
    "      assert(authoredEntry && currentEntry,`${entry.identity.id}: both source placements retained`);\n      assert.deepEqual(liveSnapshot.entries.find((row:{identity:string})=>JSON.parse(row.identity).id===entry.identity.id),authoredEntry,`${entry.identity.id}: actual current complete tongue/palate row remains exact`);"
  ]
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const beforeHash='f6e9e4fb0db975efea146e31c873fd0ece922156e8ae49906833a03bbfd30b0a',afterHash='84bee4b383a741a678c66307479d33b738ce95a4f2bfbe30f728477a08e92984';
function restoreTest(text){for(const[from,to]of [...seams].reverse()){assert.equal(text.split(to).length,2);text=text.replace(to,from);}return text;}
test('every original tongue/palate assertion survives four exact historical-role seams',()=>{
 const before=readFileSync(new URL('./fixtures/tongue-palate-before-neck-history.ts.raw',import.meta.url)),after=readFileSync(new URL('./tongue-palate-delivery.test.ts',import.meta.url));
 assert.equal(sha(before),beforeHash);assert.equal(sha(after),afterHash);assert.equal(restoreTest(after.toString()),before.toString());
 assert.throws(()=>assert.equal(restoreTest(after.toString()+'\n/* extra */'),before.toString()));
});
const atlas=currentAtlasDeliveryRoot(),current=validateCurrentAtlasDelivery().source;
const git=(ref,p)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',ref+':'+p],{maxBuffer:32e6,windowsHide:true});
for(const[name,p,restore]of [['snapshot','content/regional-teaching/head-neck.json',beforeNeckXraySnapshot],['dispatcher','app/body-content.ts',beforeNeckXrayBody]]){
 test(name+' authenticates current and historical source bytes without widening the original teaching',()=>{
  const a=git(current,p),b=git('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',p);assert.deepEqual(restore(a,b),b);
  for(const[left,right]of [[Buffer.concat([a,Buffer.from(' ')]),b],[a,Buffer.concat([b,Buffer.from(' ')])],[b,a]])assert.throws(()=>restore(left,right));
 });
}
