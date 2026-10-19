import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {checkedAtlasSourceRepo,checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
const fixtures=resolve('.local/test-fixtures');mkdirSync(fixtures,{recursive:true});
const root=mkdtempSync(resolve(fixtures,'atlas-source-repo-'));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
git('init','--quiet');git('config','user.name','Synthetic source test');git('config','user.email','fixture@invalid.test');
writeFileSync(resolve(root,'lesson.txt'),'Synthetic historical fixture\n');git('add','lesson.txt');git('commit','--quiet','-m','Synthetic earlier source');const earlier=git('rev-parse','HEAD');
writeFileSync(resolve(root,'lesson.txt'),'Synthetic current fixture\n');git('commit','--quiet','-am','Synthetic current source');const current=git('rev-parse','HEAD');
const configured=(path,action)=>{const old=process.env.VM_ATLAS_SOURCE_REPO;process.env.VM_ATLAS_SOURCE_REPO=path;try{return action();}finally{if(old===undefined)delete process.env.VM_ATLAS_SOURCE_REPO;else process.env.VM_ATLAS_SOURCE_REPO=old;}};
test('current source gate still requires the exact current HEAD',()=>configured(root,()=>{
 assert.equal(realpathSync(checkedAtlasSourceRepo(current)),realpathSync(root));assert.throws(()=>checkedAtlasSourceRepo(earlier),/Atlas source revision changed/);
}));
test('historical replay locates the exact earlier commit without pretending it is current',()=>configured(root,()=>{
 assert.equal(realpathSync(checkedAtlasHistoryRepo(earlier)),realpathSync(root));assert.equal(git('show',earlier+':lesson.txt'),'Synthetic historical fixture');assert.equal(readFileSync(resolve(root,'lesson.txt'),'utf8'),'Synthetic current fixture\n');assert.equal(git('rev-parse','HEAD'),current);
}));
test('historical locator rejects abbreviated, symbolic and malformed revisions',()=>configured(root,()=>{
 for(const revision of [earlier.slice(0,12),'HEAD','main','0'.repeat(39),'0'.repeat(41),'A'.repeat(40),'--all'])assert.throws(()=>checkedAtlasHistoryRepo(revision),/full commit SHA/);
}));
test('historical locator rejects a tree object and a missing commit',()=>configured(root,()=>{
 assert.throws(()=>checkedAtlasHistoryRepo(git('rev-parse','HEAD^{tree}')));assert.throws(()=>checkedAtlasHistoryRepo('0'.repeat(40)));
}));
test('both helpers reject a repository subdirectory',()=>{
 const child=resolve(root,'child');mkdirSync(child);configured(child,()=>{assert.throws(()=>checkedAtlasSourceRepo(current),/repository root/);assert.throws(()=>checkedAtlasHistoryRepo(earlier),/repository root/);});
});
test('only the three immutable Git replay callers migrate to historical semantics',()=>{
 for(const path of ['atlas-foot-ultrasound-followup-checks.mjs','atlas-hand-bone-ultrasound-checks.mjs','regional-reference-review-index.test.ts']){const source=readFileSync(new URL(path,import.meta.url),'utf8');assert(source.includes('checkedAtlasHistoryRepo('));assert(!source.includes('checkedAtlasSourceRepo('));}
 const currentSource=readFileSync(new URL('atlas-current-source-notes.test.mjs',import.meta.url),'utf8');assert(currentSource.includes('const atlasSourceRepo=currentAtlasDeliveryRoot();'));assert(!currentSource.includes('checkedAtlasHistoryRepo('));assert(currentSource.includes("readFileSync(atlasSourceRepo+'/'+path)"));
});
