import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {copyFileSync,mkdirSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root=dirname(fileURLToPath(import.meta.url));
const original=join(root,'thoracic-teaching-role-preservation.test.mjs.preimage');
const candidate=join(root,'thoracic-teaching-role-preservation.test.mjs');
const patch=join(root,'FORWARD.patch');
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const preimageSha='f039d55de30426540fae3c2f8aecaab1cdc9b5ad7e6004e8639a3336f8c14855';
const candidateSha='968abf8fc90cf382d9e67e45011f62c7db6a1b26d3c6dcecebaf9b977765c967';

test('entire role-root patch applies and reverses exactly',()=>{
 assert.equal(sha(original),preimageSha);
 assert.equal(sha(candidate),candidateSha);
 const scratch=mkdtempSync(join(root,'.patchcheck-'));
 assert(resolve(scratch).startsWith(resolve(root)+sep));
 try{
  const target=join(scratch,'tests','thoracic-teaching-role-preservation.test.mjs');
  mkdirSync(dirname(target),{recursive:true});copyFileSync(original,target);
  const git=(...args)=>execFileSync('git',['-c','core.autocrlf=false','apply',...args,patch],{cwd:scratch,windowsHide:true});
  git('--check');git();assert.equal(sha(target),candidateSha);
  git('--reverse','--check');git('--reverse');assert.equal(sha(target),preimageSha);
 }finally{rmSync(scratch,{recursive:true,force:true});}
});
