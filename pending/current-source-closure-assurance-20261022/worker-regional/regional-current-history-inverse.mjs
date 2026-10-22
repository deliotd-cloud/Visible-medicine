// Pure source-only witness. Run from this stage; imports no website/test code.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {beforeNeckXrayBody,beforeNeckXraySnapshot} from '../20261022-historical-admission-assurance/website/tests/tongue-palate-neck-history.mjs';

const root=new URL('./',import.meta.url);
const website=new URL('../20261022-historical-admission-assurance/website/tests/',root);
const names=[
 'inferior-thyroid-mra-current-delivery.test.mjs',
 'closed56-femoral-epoch.test.mjs',
 'radial-eus-current-transition.test.mjs',
 'shoulder-us-renderer-migration.test.mjs',
];
const expected={
 'inferior-thyroid-mra-current-delivery.test.mjs':['0ff16b6d81a20d018a78eb49b416e431ef70dcfcbcd950e8e79dfdfa7de1b44d','6f4daeee4d857b7cf0bf25c93d31c5a021590af29dd8f05d5d8e9c57af654a11'],
 'closed56-femoral-epoch.test.mjs':['9b666215eb5f12c2ab7564cf6ffe6e560682efb46d033a4bd13d88ecaf389f4e','d15ee270c69672f141592ab25b9ce48e1cd4fa969b31177e3d8c047a2ced92f7'],
 'radial-eus-current-transition.test.mjs':['5a1f625dd7539e66c502b7cff0d6e237c63b9d1e793f49a5e3af5c0ac3231cbe','3f48e87d9cff237970ae8f29660106ee1b43cdcea1c7483055947718a9c470a4'],
 'shoulder-us-renderer-migration.test.mjs':['ab3dd097913f298b924db07a512c1aca6f2626e6bae426732dcc9c4c510bf8d2','b78586de80aebffc3e95c2592fc4870c2f62c48e5f807b1db03ab228ddc5a257'],
};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function once(source,after,before){
 assert.equal(source.split(after).length,2,`Unique inverse seam: ${after.slice(0,80)}`);
 return source.replace(after,before);
}
const current='2381efe43b75f8a7fb768a069eecd7268c508dac';
const former='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const currentTree='db21ed3dee259c390878450b3495468996a3af85';
const formerTree='e9165d7122361f809a267af1414b337b69097fe2';
function inverse(name,source){
 const r=(a,b)=>{source=once(source,a,b)};
 if(name===names[0]){
  r("import {beforeNeckXrayBody,beforeNeckXraySnapshot} from './tongue-palate-neck-history.mjs';\n",'');
  r(`const currentSource='${current}';`, `const currentSource='${former}';`);
  r(`const preNeck='${former}';\n`,'');
  r(`assert.equal(pin.sourceTree,'${currentTree}');`,`assert.equal(pin.sourceTree,'${formerTree}');`);
  r('exact historical87 MRA source reaches current2381 Review','exact historical87 MRA source reaches current6d7 Review');
  r(" const neckBody=git(atlas,'show',`${currentSource}:app/body-content.ts`);\n const preNeckBody=git(atlas,'show',`${preNeck}:app/body-content.ts`);\n beforeNeckXrayBody(neckBody,preNeckBody);\n let currentBody=preNeckBody.toString();",
    " let currentBody=git(atlas,'show',`${currentSource}:app/body-content.ts`).toString();");
  r('Entire current body lesson dispatcher reverses through neck, dental and colic epochs to historical87','Entire current body lesson dispatcher reverses to historical87 outside dental and colic additions');
  r(" const currentNeck=git(atlas,'show',`${currentSource}:content/regional-teaching/head-neck.json`);\n const preNeckSnapshot=git(atlas,'show',`${preNeck}:content/regional-teaching/head-neck.json`);\n beforeNeckXraySnapshot(currentNeck,preNeckSnapshot);\n",'');
  r("if(key!=='regionalTours')equal(currentGit[key],now[key],`Current ${key} unchanged since historical MRA introduction`);",
    'equal(currentGit[key],now[key],`Current ${key} unchanged since historical MRA introduction`);');
 }else if(name===names[1]){
  r(`assert.equal(pin.source,'${current}');`,`assert.equal(pin.source,'${former}');`);
  r(`assert.equal(pin.sourceTree,'${currentTree}');`,`assert.equal(pin.sourceTree,'${formerTree}');`);
  r('assert.equal(review.files.length,1562);','assert.equal(review.files.length,1558);');
  r('assert.equal(inputs.inputs.length,1729);','assert.equal(inputs.inputs.length,1724);');
 }else if(name===names[2]){
  r(`assert.equal(live.source,'${current}');assert.equal(live.sourceTree,'${currentTree}');`,
    `assert.equal(live.source,'${former}');`);
  r('current 2381 source retains radial teaching','current 6d7 source retains radial teaching');
  r(`assert.equal(pin.source,'${current}');`,`assert.equal(pin.source,'${former}');`);
  r(`assert.equal(pin.sourceTree,'${currentTree}');`,`assert.equal(pin.sourceTree,'${formerTree}');`);
 }else if(name===names[3]){
  r('independently pinned 2381 delivery','independently pinned 6d7 delivery');
  r(`assert.equal(delivery.CURRENT_ATLAS_REVISION,'${current}');`,
    `assert.equal(delivery.CURRENT_ATLAS_REVISION,'${former}');`);
  r(`assert.equal(pin.sourceTree,'${currentTree}');`,`assert.equal(pin.sourceTree,'${formerTree}');`);
  r('assert.equal(pin.reviewSourceFiles,1562);','assert.equal(pin.reviewSourceFiles,1558);');
 }
 return Buffer.from(source);
}
for(const name of names){
 const pre=readFileSync(new URL(`preimages/${name}.raw`,root));
 const live=readFileSync(new URL(name,website));
 const proposal=readFileSync(new URL(`tests/${name}`,root));
 assert.equal(sha(pre),expected[name][0],`${name}: exact preimage`);
 assert.deepEqual(live,pre,`${name}: source candidate has not drifted`);
 assert.equal(sha(proposal),expected[name][1],`${name}: exact proposal`);
 assert.deepEqual(inverse(name,proposal.toString()),pre,`${name}: complete original source restored`);
 console.log(`${name}: whole-source inverse and preimage verified`);
}
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('rev-parse','HEAD').toString().trim(),current);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),currentTree);
assert.equal(git('status','--porcelain').toString(),'');
const at=(revision,path)=>git('show',`${revision}:${path}`);
const mra='content/arterial-evidence-limits.ts';
assert.equal(sha(at(current,mra)),'b746ada70e8f96906cb30289cd2649530f380f942f69b34fbf5e370282c21c24');
assert.deepEqual(at(current,mra),at('87ed7e343260c7df48a40d53503f25bbfd34cfa5',mra));
beforeNeckXrayBody(at(current,'app/body-content.ts'),at(former,'app/body-content.ts'));
beforeNeckXraySnapshot(at(current,'content/regional-teaching/head-neck.json'),at(former,'content/regional-teaching/head-neck.json'));
console.log('Current Atlas Git roles and complete neck-to-pre-neck source inverses verified');
