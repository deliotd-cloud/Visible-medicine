import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {verifyAbdominalFoldTitleTransition} from './abdominal-fold-title-transition.mjs';

const atlas='F:/VisibleMedicine/atlas';
const stage='G:/VisibleMedicine-temp/staging/20261031-release-partition13-repairs/website';
const show=(revision)=>execFileSync('git',['show',`${revision}:content/abdominal-fold-ultrasound.ts`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const old=show('9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
const titleCommit=show('a01ea4a00740dee0905204a33893761b8ae1ff1e');
const current=show('c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');

test('exact 9f to a01 two-title transition is the current imported source',()=>{
 assert.deepEqual(current,titleCommit);
 assert.deepEqual(current,readFileSync(`${atlas}/content/abdominal-fold-ultrasound.ts`));
 assert.deepEqual(current,readFileSync(`${stage}/atlas-review/content/abdominal-fold-ultrasound.ts`));
 verifyAbdominalFoldTitleTransition(old,current);
});

test('historical, foreign and altered current bytes cannot pass the transition',()=>{
 assert.throws(()=>verifyAbdominalFoldTitleTransition(current,current));
 assert.throws(()=>verifyAbdominalFoldTitleTransition(old,old));
 assert.throws(()=>verifyAbdominalFoldTitleTransition(Buffer.concat([old,Buffer.from('// foreign')]),current));
 assert.throws(()=>verifyAbdominalFoldTitleTransition(old,Buffer.concat([current,Buffer.from('// foreign')])));
 const altered=Buffer.from(current.toString().replace("title: 'Ultrasound and EUS'","title: 'Unreviewed EUS'"));
 assert.throws(()=>verifyAbdominalFoldTitleTransition(old,altered));
});
