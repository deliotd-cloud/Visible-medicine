// Whole original roots execute in authenticated, detached Website worktrees.
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {finished} from 'node:stream/promises';
import readline from 'node:readline';
import {assertCompleteOriginal} from './deepbrain-foot-roles.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const preparationSha256='33b8998c38e1e8192b261a9a8fde77f7e461e7e764a43ff22ab6bbe952ebdb54';
const roles={
 'nested-focus':{commit:'2c927b7cc47bf1573067765331cef9be8bc28964',tree:'6dcd1dce879ee39bd0f2fa6ce3f859af470e5349',blob:'0f0f1a9d0fbb15da4ef2d2ff570029096bf9b58c',root:'tests/atlas-nested-answer-focus.test.ts',hash:'69d83e5588363efdf1a44cd29fe0ab394764bcacdec6a2d011a98b0efe914489',cases:1},
 'queue-initial':{commit:'792810f5bcf8808f57d2f55e12cca217ed4d262d',tree:'921ac8a7a47f237cea1a195e7c3fa2027507a1f7',blob:'12faaf61b056d1100f23cbf65bde4fedd6c1770f',root:'tests/atlas-nested-review-queue.test.ts',hash:'01c2963a6474c99671549f8bfaecb38fd2d26fbb3a262edff95b83587175d266',cases:2},
 'queue-feature':{commit:'4aa346e7923e3b303ad869d71e0ea36044d61aa6',tree:'9fa17c09032a409e4375f7df1ba837e2a818069a',blob:'70663dca5bc19e4b452c7d987e05eef604e7827a',root:'tests/atlas-nested-review-queue.test.ts',hash:'00d87837e3556391630e634d66e523196810cf7a529ecd17c4eb40ea5a75dfcb',cases:2},
 'respiratory-original':{commit:'ec85edb86bb34c92c66e2f310da09904f27ea7c4',tree:'9bc4e6ffb21e3d187fb7041aae80c57d5ec149cf',blob:'878773017a1ae024572bd60657edb52a1bcba93b',root:'tests/atlas-respiratory-core-depth-checks.mjs',hash:'6b16a2ea0cf8ac9f382aac9ab0720e9eab1edd9344dc5b7c555069898026426d',cases:1},
};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function requiredPreparation(){
 const name='VM_TEACHING_ORIGINAL_PREPARATION',value=process.env[name];
 assert(value&&path.isAbsolute(value),`Absolute ${name} required`);
 const file=fs.realpathSync(value),bytes=fs.readFileSync(file);
 assert.equal(sha(bytes),preparationSha256,'Exact preparation evidence');
 return JSON.parse(bytes);
}
function childEnv(native){
 const env={},allowed=new Set(['path','systemroot','windir','comspec','pathext','temp','tmp','os','processor_architecture','number_of_processors']);
 for(const [key,value] of Object.entries(process.env))if(allowed.has(key.toLowerCase())&&value!==undefined)env[key]=value;
 Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=256',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',VM_ATLAS_SOURCE_REPO:native,ATLAS_SOURCE_REPO:native});
 return env;
}
function git(root,native,...args){return execFileSync('git',['--no-replace-objects','-C',root,...args],{windowsHide:true,maxBuffer:32e6,encoding:'utf8',env:childEnv(native)}).trim();}
export function authenticatedTeachingNativeRoot(value=process.env.VM_TEACHING_ORIGINAL_ATLAS){
 assert(typeof value==='string'&&path.isAbsolute(value),'Absolute VM_TEACHING_ORIGINAL_ATLAS required');
 const native=fs.realpathSync(value);
 assert.equal(fs.realpathSync(git(native,native,'rev-parse','--show-toplevel')),native,'Exact original native Git root');
 assert.equal(git(native,native,'rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(git(native,native,'rev-parse','HEAD^{tree}'),'e9165d7122361f809a267af1414b337b69097fe2');
 assert.equal(git(native,native,'status','--porcelain'),'','Original native source clean');
 return native;
}
export function authenticatedRespiratoryAliasRead(original,native){
 assert.equal(sha(original),roles['respiratory-original'].hash,'Complete original respiratory source');
 const text=original.toString('utf8');
 const legacy='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
 assert(text.includes(`const atlasSource = '${legacy}';`));
 assert.equal([...text.matchAll(/\batlasSource\b/g)].length,2,'Alias occurs only in its declaration and sourceAt git-show read');
 assert(text.includes("const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});"));
 const revision='12570b5245dc6a253cbdd73ec4e044c58b81a927',tree='a5ec4435cf81a68ecbebdefce11ac60a220b068d';
 assert(text.includes(`const sourceRevision = '${revision}';`));
 // The unmodified proof reads this fixed Git object, never the alias's current HEAD or working tree.
 for(const repo of [native,fs.realpathSync(legacy)]){
  assert.equal(git(repo,native,'rev-parse',revision+'^{commit}'),revision);
  assert.equal(git(repo,native,'rev-parse',revision+'^{tree}'),tree);
 }
 return {revision,tree};
}
function check(role){
 const expected=roles[role];assert(expected,'Known original role');
 const prep=requiredPreparation();
 assert.equal(prep.targets.length,4,'All original roles prepared');
 const row=prep.targets.find(item=>item.role===role);assert(row);
 assert.equal(row.revision,expected.commit);assert.equal(row.tree,expected.tree);assert.equal(row.rootBlob,expected.blob);
 assert.equal(row.root,expected.root);assert.equal(row.rootSha256,expected.hash);assert.equal(row.cases,expected.cases);
 assert.equal(row.compilerFrameworkLockIdentityMatchesCurrentPhysicalDependencies,true);
 const website=fs.realpathSync(row.site),native=authenticatedTeachingNativeRoot();
 assert.notEqual(website,fs.realpathSync(site),'Separate original Website');
 assert.equal(fs.realpathSync(git(website,native,'rev-parse','--show-toplevel')),website,'Real worktree');
 assert.equal(git(website,native,'rev-parse','HEAD'),expected.commit);
 assert.equal(git(website,native,'rev-parse','HEAD^{tree}'),expected.tree);
 assert.equal(git(website,native,'rev-parse',`HEAD:${expected.root}`),expected.blob);
 assert.equal(git(website,native,'status','--porcelain'),'','Original Website clean');
 const original=fs.readFileSync(path.join(website,expected.root));assert.equal(original.length,row.originalRootBytes);
 assert.equal(sha(original),expected.hash,'Complete original bytes');
 assert.equal(sha(execFileSync('git',['--no-replace-objects','-C',website,'show',`HEAD:${expected.root}`],{maxBuffer:32e6,env:childEnv(native)})),expected.hash,'Git blob bytes');
 const dependencies=fs.realpathSync(prep.dependencies);
 assert.equal(fs.realpathSync(path.join(website,'node_modules')),dependencies,'Prepared physical dependencies');
 assert.equal(prep.dependencyRows.length,25);
 for(const item of prep.dependencyRows){
  assert(/^[A-Za-z0-9@._/-]+$/.test(item.path)&&!item.path.split('/').includes('..'));
  assert.equal(sha(fs.readFileSync(path.join(dependencies,item.path))),item.sha256,`Dependency ${item.path}`);
 }
 const lock=fs.readFileSync(path.join(website,'package-lock.json'));
 assert.equal(sha(lock),sha(execFileSync('git',['--no-replace-objects','-C',website,'show','HEAD:package-lock.json'],{maxBuffer:32e6,env:childEnv(native)})),'Committed dependency lock');
 const locked=JSON.parse(lock);
 for(const name of ['esbuild','@esbuild/win32-x64','react','react-dom','next']){
  const installed=JSON.parse(fs.readFileSync(path.join(dependencies,name,'package.json')));
  assert.equal(installed.version,locked.packages[`node_modules/${name}`]?.version,`Locked ${name} identity`);
 }
 assert.equal(git(native,native,'rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(git(native,native,'rev-parse','HEAD^{tree}'),'e9165d7122361f809a267af1414b337b69097fe2');
 assert.equal(git(native,native,'status','--porcelain'),'','Original native source clean');
 if(role==='respiratory-original')authenticatedRespiratoryAliasRead(original,native);
 return {website,native,expected};
}
export function authenticatedTeachingOriginalRoot(role){return check(role).website;}
export async function runTeachingOriginalRole(role){
 const {website,native,expected}=check(role);
 const dir=path.join(site,'.local','teaching-originals',new Date().toISOString().replace(/[:.]/g,'-')+'-'+role+'-'+randomUUID());
 fs.mkdirSync(dir,{recursive:true});
 const output=fs.createWriteStream(path.join(dir,'child.tap'),{flags:'wx'}),errors=fs.createWriteStream(path.join(dir,'child.stderr.log'),{flags:'wx'});
 const ioEvents=[];for(const stream of [output,errors])stream.on('error',e=>ioEvents.push(String(e)));
 const args=['--max-old-space-size=256','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',expected.root];
 const child=spawn(process.execPath,args,{cwd:website,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:childEnv(native)});
 child.stdout.pipe(output);child.stderr.pipe(errors);
 for(const stream of [child.stdout,child.stderr])stream.on('error',e=>ioEvents.push(String(e)));
 fs.writeFileSync(path.join(dir,'started.json'),JSON.stringify({role,pid:child.pid,args,cwd:website,rootSha256:expected.hash,cases:expected.cases},null,2)+'\n',{flag:'wx'});
 const result=await new Promise(resolve=>{let error;child.once('error',e=>{error=String(e)});child.once('close',(code,signal)=>resolve({code,signal,...(error?{error}:{})}))});
 let ioError;try{await Promise.all([finished(output),finished(errors)])}catch(e){ioError=String(e)}if(ioEvents.length)ioError=[ioError,...ioEvents].filter(Boolean).join('; ');
 let stabilityError;try{check(role)}catch(e){stabilityError=String(e)}
 let tap='';if(!ioError){const lines=readline.createInterface({input:fs.createReadStream(path.join(dir,'child.tap')),crlfDelay:Infinity});for await(const line of lines)if(/^(?:TAP version|\s*(?:not )?ok\b|1\.\.|# (?:tests|pass|fail|cancelled|skipped|todo) |\s*Bail out!)/i.test(line))tap+=line+'\n';}
 let totals,transportError;try{totals=assertCompleteOriginal(result,tap,expected.cases)}catch(e){transportError=String(e)}
 fs.writeFileSync(path.join(dir,'terminal.json'),JSON.stringify({role,...result,counts:totals??null,ioError:ioError??null,stabilityError:stabilityError??null,transportError:transportError??null,passing:!ioError&&!stabilityError&&!transportError},null,2)+'\n',{flag:'wx'});
 assert(!ioError&&!stabilityError&&!transportError,'Whole original child incomplete; local evidence: '+dir);
 return {role,counts:totals,evidence:dir};
}
