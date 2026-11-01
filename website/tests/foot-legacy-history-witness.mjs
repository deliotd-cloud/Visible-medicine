// Local transport evidence only: does not replace any original child assertion.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

export const LEGACY_PATH='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
export const CORPUS=Object.freeze({head:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree:'e9165d7122361f809a267af1414b337b69097fe2'});
export const PINNED_ROWS=Object.freeze([
 ['cdc6ad23ad5c3c13a2f6588019a057d0a063818f','54a91d9b050cc0baf1ae597cc16c5894b45430bdb670db78fc83a3ad194530e1',247643],
 ['bbe33ea6ffff3503ae9cdabc0dd41350cece28cd','a59a08db24f13fa3d6ed03a7040afd468de66ef06d96873a58a4647256cc84f2',251213],
 ['ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb','e15799c43231e25ffe7f75768fc7f8020b564623c053fb8d126eac6533e93240',250135],
 ['a1cb14f05b3070b8553e85e3596f634b2bf36a5d','103ffe3a6c0b72007ea1a4dc67d8854422402bda73068e1cced12601c994ca8d',248949],
 ['c5c99ba11e6533d306587e71f5fc2854d882fbd6','ac0fc5d03a43c27d8505834eea0db6c5c8f1e40502c5bad79bed1acfc9264f8a',252155]
].map(([revision,sha256,bytes])=>Object.freeze({revision,path:'LICENSES/THIRD_PARTY_NOTICES.md',sha256,bytes})));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function keys(value,expected){assert(value&&typeof value==='object'&&!Array.isArray(value));assert.deepEqual(Object.keys(value).sort(),[...expected].sort(),'Exact witness fields');}

// Pure seams are deliberately separate from the real filesystem/Git acceptance.
export function validateWitnessBytes(bytes,pin){assert.match(pin??'',/^[a-f0-9]{64}$/,'Explicit witness SHA256 required');assert.equal(sha(bytes),pin,'Sealed witness bytes');return JSON.parse(bytes.toString('utf8'));}
export function validateWitness(w,actualRoot){
 keys(w,['schema','legacy','corpus','rows']);assert.equal(w.schema,'vm-foot-legacy-history-witness/1');
 keys(w.legacy,['root','head','tree']);assert.equal(w.legacy.root,actualRoot,'Witness binds actual legacy root');assert(path.isAbsolute(w.legacy.root));
 for(const key of ['head','tree'])assert.match(w.legacy[key]??'',/^[a-f0-9]{40}$/);
 keys(w.corpus,['head','tree']);assert.deepEqual(w.corpus,CORPUS,'Pinned detached corpus');
 assert.deepEqual(w.rows,PINNED_ROWS,'Exactly five original revision/path/hash/byte rows');return w;
}
export function validateLegacyState(w,state){assert.deepEqual(state,w.legacy,'Legacy root/HEAD/tree stable');}
export function validateBlob(row,legacyBytes,nativeBytes){assert.equal(legacyBytes.length,row.bytes,'Legacy blob bytes');assert.equal(sha(legacyBytes),row.sha256,'Pinned legacy blob hash');assert.equal(nativeBytes.length,row.bytes,'Corpus blob bytes');assert.equal(sha(nativeBytes),row.sha256,'Pinned corpus blob hash');assert(legacyBytes.equals(nativeBytes),'Exact original blob bytes');}

export function checkFootLegacyHistory(native,git,childEnv){
 const legacy=fs.realpathSync(LEGACY_PATH);
 // Preserve historical same-root strict mode without introducing new inputs.
 if(legacy===native)return;
 const witnessPath=process.env.VM_DBFOOT_LEGACY_WITNESS;
 assert(typeof witnessPath==='string'&&path.isAbsolute(witnessPath),'VM_DBFOOT_LEGACY_WITNESS absolute local file required');
 assert(!witnessPath.startsWith('\\\\')&&!witnessPath.startsWith('//'),'Local witness required');
 const witnessReal=fs.realpathSync(witnessPath);
 assert(!witnessReal.startsWith('\\\\')&&!witnessReal.startsWith('//'),'Local resolved witness required');
 const stat=fs.lstatSync(witnessPath);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular local witness file required');
 const w=validateWitness(validateWitnessBytes(fs.readFileSync(witnessPath),process.env.VM_DBFOOT_LEGACY_WITNESS_SHA256),legacy);
 assert.equal(fs.realpathSync(git(native,'rev-parse','--show-toplevel')),native);
 assert.equal(git(native,'rev-parse','HEAD'),CORPUS.head);assert.equal(git(native,'rev-parse','HEAD^{tree}'),CORPUS.tree);
 const state=()=>({root:fs.realpathSync(git(legacy,'rev-parse','--show-toplevel')),head:git(legacy,'rev-parse','HEAD'),tree:git(legacy,'rev-parse','HEAD^{tree}')});
 validateLegacyState(w,state());
 for(const row of PINNED_ROWS){
  assert.equal(git(legacy,'rev-parse',row.revision+'^{commit}'),row.revision);
  const read=root=>execFileSync('git',['--no-replace-objects','-C',root,'show',row.revision+':'+row.path],{windowsHide:true,env:childEnv(root),maxBuffer:32e6});
  validateBlob(row,read(legacy),read(native));
 }
 validateLegacyState(w,state());
 // Re-read after Git IO too; runOriginalRole invokes this whole guard before/after child.
 validateWitnessBytes(fs.readFileSync(witnessPath),process.env.VM_DBFOOT_LEGACY_WITNESS_SHA256);
 const finalStat=fs.lstatSync(witnessPath);assert(finalStat.isFile()&&!finalStat.isSymbolicLink(),'Witness remains regular');
 assert.equal(fs.realpathSync(witnessPath),witnessReal,'Witness location stable');
 assert.equal(finalStat.dev,stat.dev);assert.equal(finalStat.ino,stat.ino);assert.equal(finalStat.size,stat.size);assert.equal(finalStat.mtimeMs,stat.mtimeMs);assert.equal(finalStat.ctimeMs,stat.ctimeMs);
 assert.equal(fs.realpathSync(LEGACY_PATH),legacy,'Legacy junction stable');
}
