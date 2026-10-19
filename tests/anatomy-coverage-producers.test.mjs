import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,unlinkSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {parseProducerArgs,createCoverageSource,writeCoverageOutput,hash,withCoverageWorkingDirectory} from '../scripts/anatomy-coverage/source-context.mjs';
import {parseCoverageGenerationArgs} from '../scripts/generate-anatomy-coverage.mjs';
const stage=existsSync('F:/VisibleMedicine/staging')?'F:/VisibleMedicine/staging':tmpdir(),fixture=mkdtempSync(resolve(stage,'coverage-producer-test-')),root=resolve(fixture,'source');mkdirSync(root);
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,encoding:'utf8',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
git('init','--quiet');git('config','user.name','Synthetic coverage test');git('config','user.email','coverage@invalid.test');
for(const[p,v]of Object.entries({'package.json':'{"type":"module"}\n','values.json':'{"value":42}\n','helper.ts':"import data from './values.json' with {type:'json'};export const value=data.value;\n",'entry.ts':"export {value} from './helper';\n"}))writeFileSync(resolve(root,p),v);
git('add','.');git('commit','--quiet','-m','Synthetic coverage source');const revision=git('rev-parse','HEAD'),args={sourceRoot:root,revision,output:resolve(fixture,'candidate.json')};
const contextUrl=new URL('../scripts/anatomy-coverage/source-context.mjs',import.meta.url).href;
test('producer and generation CLIs require distinct complete absolute options',()=>{
 assert.deepEqual(parseProducerArgs(['--source-root',root,'--revision',revision,'--output',args.output]),args);
 assert.deepEqual(parseCoverageGenerationArgs(['--source-root',root,'--revision',revision,'--output-root',fixture]),{sourceRoot:root,revision,outputRoot:fixture});
});
for(const bad of [[],['--revision','HEAD'],['--source-root',root,'--revision',revision,'--output',args.output,'--output',args.output],['--source-root','relative','--revision',revision,'--output',args.output],['--source-root',root,'--revision',revision,'--output',args.output,'--force']])test('producer CLI refuses '+JSON.stringify(bad),()=>assert.throws(()=>parseProducerArgs(bad)));
test('generation CLI refuses incomplete, duplicate and unknown options',()=>{
 for(const bad of [[],['--source-root',root,'--revision',revision,'--output-root',fixture,'--write'],['--source-root',root,'--revision','HEAD','--output-root',fixture],['--source-root',root,'--revision',revision,'--output-root',fixture,'--revision',revision]])assert.throws(()=>parseCoverageGenerationArgs(bad));
});
test('source context verifies exact committed and working metadata including ESM package mode',()=>{
 const c=createCoverageSource(args);assert.equal(c.json('values.json').value,42);assert.deepEqual(c.verify(),{'package.json':hash(readFileSync(resolve(root,'package.json'))),'values.json':hash(readFileSync(resolve(root,'values.json')))});c.close();assert.throws(()=>c.read('values.json'),/closed/);
});
test('source context refuses scans/models, private or escaping paths before reading',()=>{
 const c=createCoverageSource(args);for(const p of ['../outside.json','/outside.json','.env.local','.local/data.json','private/data.json','scans/data.json','node_modules/x.json','model.glb','original.obj','scan.nii.gz','source\\values.json'])assert.throws(()=>c.read(p));c.close();
});
test('source context refuses a wrong HEAD and repository subdirectory',()=>{
 assert.throws(()=>createCoverageSource({...args,revision:'0'.repeat(40)}),/HEAD changed/);const child=resolve(root,'child');mkdirSync(child);assert.throws(()=>createCoverageSource({...args,sourceRoot:child}),/repository root/);
});
test('untracked source edits refuse generation before imports',()=>{
 const path=resolve(root,'untracked.json');writeFileSync(path,'{}');try{assert.throws(()=>createCoverageSource(args),/must be clean/);}finally{unlinkSync(path);}
});
test('changed loaded source cannot verify or be silently refreshed',()=>{
 const c=createCoverageSource(args),path=resolve(root,'values.json'),before=readFileSync(path);c.read('values.json');writeFileSync(path,'{"value":43}\n');try{assert.throws(()=>c.verify(),/clean|changed/);assert.throws(()=>c.read('values.json'),/changed during load/);}finally{writeFileSync(path,before);c.close();}
});
test('fresh output is immutable and cannot overwrite source or canonical website snapshots',()=>{
 const c=createCoverageSource(args);c.read('values.json');const result={sourceRevision:revision,evidence:{sourceInputs:c.verify()},clinicalApproval:false};writeCoverageOutput(args,result);const bytes=readFileSync(args.output);assert.throws(()=>writeCoverageOutput(args,result),/already exists/);assert.deepEqual(readFileSync(args.output),bytes);
 assert.throws(()=>writeCoverageOutput({...args,output:resolve(root,'should-not-exist.json')},result),/outside source and website/);
 assert.throws(()=>writeCoverageOutput({...args,output:resolve('docs/anatomy-coverage/should-not-exist.json')},result),/outside source and website/);c.close();
});
test('output refuses clinical/completeness/registration claims and wrong source identity',()=>{
 const c=createCoverageSource(args),evidence={sourceInputs:c.verify()};for(const key of ['clinicalApproval','clinicalApprovalAsserted','anatomicalCompletenessProven','patientRegistrationAsserted'])assert.throws(()=>writeCoverageOutput({...args,output:resolve(fixture,key+'.json')},{sourceRevision:revision,evidence,[key]:true}),/cannot confer/);assert.throws(()=>writeCoverageOutput({...args,output:resolve(fixture,'wrong.json')},{sourceRevision:'0'.repeat(40),evidence}));c.close();
});
test('native source graph records extensionless imports and forbids cached producer reuse',()=>{
 const code=`import assert from 'node:assert/strict';import {createCoverageSource} from ${JSON.stringify(contextUrl)};const args=${JSON.stringify(args)};const s=createCoverageSource(args);s.hook();try{const m=await import(s.rootUrl+'entry.ts');assert.equal(m.value,42);assert.deepEqual(Object.keys(s.verify()).sort(),['entry.ts','helper.ts','package.json','values.json']);}finally{s.close();}const other=createCoverageSource(args);assert.throws(()=>other.hook(),/fresh coverage producer/);other.close();`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',windowsHide:true,cwd:process.cwd()});assert.equal(r.status,0,(r.stdout||'')+(r.stderr||''));
});
test('existing installed coverage remains a coherent older snapshot until coordinated import',()=>{
 const index=JSON.parse(readFileSync('docs/anatomy-coverage/index.json'));for(const scope of ['root','nested','independent','reference'])assert.equal(JSON.parse(readFileSync('docs/anatomy-coverage/'+scope+'.json')).sourceRevision,index.sourceRevision);assert.equal(index.assessment.clinicalApprovalAsserted,false);assert.equal(index.assessment.anatomicalCompletenessProven,false);
});
test('legacy source-relative reads use the isolated source directory and restore cwd on success or failure',async()=>{
 const previous=process.cwd();await withCoverageWorkingDirectory(root,async()=>{assert.equal(process.cwd(),root);assert.equal(JSON.parse(readFileSync('values.json')).value,42);});assert.equal(process.cwd(),previous);
 await assert.rejects(withCoverageWorkingDirectory(root,async()=>{throw Error('Synthetic legacy read failure');}),/Synthetic legacy/);assert.equal(process.cwd(),previous);
});
test('Git replacement objects cannot substitute the committed metadata proof',()=>{
 const options={cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
 const foreign=execFileSync('git',['hash-object','-w','--stdin'],{...options,input:'{"value":999}\n'}).trim();
 const treeText=git('ls-tree',revision).split('\n').map(line=>line.endsWith('\tvalues.json')?line.replace(/blob [a-f0-9]{40}\t/,'blob '+foreign+'\t'):line).join('\n')+'\n';
 const tree=execFileSync('git',['mktree'],{...options,input:treeText}).trim(),replacement=git('commit-tree',tree,'-p',revision,'-m','Synthetic replacement object');git('replace',revision,replacement);
 try{const env={...process.env};delete env.GIT_NO_REPLACE_OBJECTS;assert.equal(JSON.parse(execFileSync('git',['show',revision+':values.json'],{...options,env})).value,999);const c=createCoverageSource(args);assert.equal(c.json('values.json').value,42);assert(c.verify()['values.json']);c.close();}finally{git('replace','-d',revision);}
});
test('native module resolution refuses application imports outside the source root',()=>{
 const other=resolve(fixture,'escaped-source');mkdirSync(other);writeFileSync(resolve(other,'package.json'),'{"type":"module"}\n');writeFileSync(resolve(other,'entry.ts'),"export {value} from '../outside.mjs';\n");writeFileSync(resolve(fixture,'outside.mjs'),"throw Error('OUTSIDE_EXECUTED');\n");
 const otherGit=(...a)=>execFileSync('git',a,{cwd:other,windowsHide:true,encoding:'utf8',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();otherGit('init','--quiet');otherGit('config','user.name','Synthetic escape fixture');otherGit('config','user.email','escape@invalid.test');otherGit('add','.');otherGit('commit','--quiet','-m','Synthetic confined source');
 const foreignArgs={sourceRoot:other,revision:otherGit('rev-parse','HEAD'),output:resolve(fixture,'escape.json')};
 const code=`import assert from 'node:assert/strict';import {createCoverageSource} from ${JSON.stringify(contextUrl)};const s=createCoverageSource(${JSON.stringify(foreignArgs)});s.hook();try{await assert.rejects(import(s.rootUrl+'entry.ts'),/Coverage import escaped source/);assert.deepEqual(Object.keys(s.verify()).sort(),['entry.ts','package.json']);}finally{s.close();}`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',windowsHide:true,cwd:process.cwd()});assert.equal(r.status,0,(r.stdout||'')+(r.stderr||''));
});
