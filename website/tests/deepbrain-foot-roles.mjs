// Complete original child roots execute only in their real detached Website worktrees.
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {finished} from 'node:stream/promises';
import readline from 'node:readline';
import {checkFootLegacyHistory} from './foot-legacy-history-witness.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const fixture=new URL('./fixtures/deepbrain-foot-roles/',import.meta.url);
const fixtureSha256='ad8b4130208c9d6d7da3daff3c5c44733f31f46dd4175049898d535548721eb1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const counts=['tests','pass','fail','cancelled','skipped','todo'];
function rel(value){assert(typeof value==='string'&&value&&!path.isAbsolute(value)&&!value.includes('\\')&&!value.includes(':')&&!value.includes('\0'));assert(value.split('/').every(x=>x&&x!=='.'&&x!=='..'));return value;}
function requiredEnv(name){const value=process.env[name];assert(typeof value==='string'&&path.isAbsolute(value),name+' absolute path required');return fs.realpathSync(value);}
function childEnv(native){const env={};for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','TEMP','TMP','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])if(process.env[key]!==undefined)env[key]=process.env[key];Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=256',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',VM_ATLAS_SOURCE_REPO:native,ATLAS_SOURCE_REPO:native});return env;}
function git(root,...args){return execFileSync('git',['--no-replace-objects','-C',root,...args],{windowsHide:true,maxBuffer:32e6,env:childEnv(root),encoding:'utf8'}).trim();}
function config(role){const bytes=fs.readFileSync(new URL('manifest.json',fixture));assert.equal(sha(bytes),fixtureSha256,'Exact historical fixture');const f=JSON.parse(bytes);assert.equal(f.schema,'vm-deepbrain-foot-original-roles/1');assert.equal(sha(fs.readFileSync(requiredEnv('VM_DBFOOT_BASELINE')+'/PREPARATION.json')),f.preparationSha256);assert.equal(sha(fs.readFileSync(requiredEnv('VM_DBFOOT_BASELINE')+'/checks/attempt-1/RESULT.json')),f.baselineResultSha256);assert(Object.hasOwn(f.roles,role));return {f,c:f.roles[role]};}
function check(role,f,c,website,native){
 assert.notEqual(website,fs.realpathSync(site),'Separate original Website');
 assert.equal(fs.realpathSync(git(website,'rev-parse','--show-toplevel')),website,'Real Git worktree root');
 assert.equal(git(website,'rev-parse','HEAD'),c.commit);assert.equal(git(website,'rev-parse','HEAD^{tree}'),c.tree);assert.equal(git(website,'status','--porcelain'),'','Original Website clean');
 assert.equal(fs.realpathSync(git(native,'rev-parse','--show-toplevel')),native,'Native root');
 assert.equal(git(native,'rev-parse','HEAD'),f.native.head);assert.equal(git(native,'rev-parse','HEAD^{tree}'),f.native.tree);assert.equal(git(native,'status','--porcelain'),'','Native clean');
 assert.equal(git(website,'rev-parse',c.commit+'^{commit}'),c.commit);
 assert.equal(git(native,'rev-parse',f.native.head+'^{commit}'),f.native.head);
 if(role==='deep-brain')assert.equal(git(website,'rev-parse','83fa723ec2babaecdd71ecc4919928f94d03081a^{commit}'),'83fa723ec2babaecdd71ecc4919928f94d03081a');
 assert.equal(sha(fs.readFileSync(new URL(c.raw,fixture))),c.rootSha256,'Immutable raw whole root');
 assert.equal(c.rows[0].path,c.entry);assert.equal(c.rows[0].sha256,c.rootSha256);
 for(const row of c.rows){rel(row.path);const file=path.join(website,row.path),stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink());const bytes=fs.readFileSync(file);assert.equal(bytes.length,row.bytes,row.path);assert.equal(sha(bytes),row.sha256,row.path);}
 assert(fs.readFileSync(path.join(website,c.entry)).equals(fs.readFileSync(new URL(c.raw,fixture))),'Actual original module byte-exact');
 for(const row of c.gitObjects){assert(['native','website'].includes(row.scope));rel(row.path);assert.match(row.revision,/^[a-f0-9]{40}$/);const repo=row.scope==='native'?native:website;assert.equal(sha(execFileSync('git',['--no-replace-objects','-C',repo,'show',row.revision+':'+row.path],{env:childEnv(native),maxBuffer:32e6})),row.sha256);}
 if(role==='foot-notices'){
  checkFootLegacyHistory(native,git,childEnv);
  for(const revision of ['cdc6ad23ad5c3c13a2f6588019a057d0a063818f','bbe33ea6ffff3503ae9cdabc0dd41350cece28cd','ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb','a1cb14f05b3070b8553e85e3596f634b2bf36a5d','c5c99ba11e6533d306587e71f5fc2854d882fbd6'])assert.equal(git(native,'rev-parse',revision+'^{commit}'),revision);
 }
}
export function assertCompleteOriginal(result,tap,expected){
 assert.equal(result.error,undefined,'Child start/IO failure');assert.equal(result.signal,null);assert.equal(result.code,0);
 assert.equal([...tap.matchAll(/^TAP version 13\r?$/gm)].length,1,'One standalone TAP');
 assert(!/^\s*not ok\b/im.test(tap),'No failed nested or root point');assert(!/^\s*(?:not )?ok\b[^\r\n]*#\s*(?:skip|todo)\b/im.test(tap),'No skipped/TODO point');assert(!/^\s*Bail out!/im.test(tap));
 const actual={};for(const key of counts){const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,'One '+key+' footer');actual[key]=Number(matches[0][1]);}
 assert.deepEqual(actual,{tests:expected,pass:expected,fail:0,cancelled:0,skipped:0,todo:0});
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)],points=[...tap.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)];assert.equal(plans.length,1);assert.equal(Number(plans[0][1]),expected);assert.deepEqual(points.map(m=>Number(m[1])),Array.from({length:expected},(_,i)=>i+1));assert(plans[0].index>points.at(-1).index);for(const key of counts)assert(tap.lastIndexOf('# '+key+' ')>plans[0].index);return actual;
}
export async function runOriginalRole(role){
 const {f,c}=config(role),website=requiredEnv(role==='deep-brain'?'VM_DBFOOT_DEEP_WEBSITE':'VM_DBFOOT_FOOT_WEBSITE'),native=requiredEnv('VM_DBFOOT_NATIVE');
 check(role,f,c,website,native);
 const dir=path.join(site,'.local','deepbrain-foot-originals',new Date().toISOString().replace(/[:.]/g,'-')+'-'+role+'-'+randomUUID());fs.mkdirSync(dir,{recursive:true});
 const output=fs.createWriteStream(path.join(dir,'child.tap'),{flags:'wx'}),errors=fs.createWriteStream(path.join(dir,'child.stderr.log'),{flags:'wx'});
 const ioEvents=[];for(const stream of [output,errors])stream.on('error',e=>ioEvents.push(String(e)));
 const args=['--max-old-space-size=256','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',c.entry];
 const child=spawn(process.execPath,args,{cwd:website,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:childEnv(native)});child.stdout.pipe(output);child.stderr.pipe(errors);
 for(const stream of [child.stdout,child.stderr])stream.on('error',e=>ioEvents.push(String(e)));
 fs.writeFileSync(path.join(dir,'started.json'),JSON.stringify({role,pid:child.pid,args,cwd:website,rootSha256:c.rootSha256,cases:c.cases},null,2)+'\n',{flag:'wx'});
 const result=await new Promise(resolve=>{let error;child.once('error',e=>{error=String(e)});child.once('close',(code,signal)=>resolve({code,signal,...(error?{error}:{})}))});
 let ioError;try{await Promise.all([finished(output),finished(errors)])}catch(e){ioError=String(e)}if(ioEvents.length)ioError=[ioError,...ioEvents].filter(Boolean).join('; ');
 let stabilityError;try{check(role,f,c,website,native)}catch(e){stabilityError=String(e)}
 let tap='';if(!ioError){const lines=readline.createInterface({input:fs.createReadStream(path.join(dir,'child.tap')),crlfDelay:Infinity});for await(const line of lines)if(/^(?:TAP version|\s*(?:not )?ok\b|1\.\.|# (?:tests|pass|fail|cancelled|skipped|todo) |\s*Bail out!)/i.test(line))tap+=line+'\n';}
 let totals,transportError;try{totals=assertCompleteOriginal(result,tap,c.cases)}catch(e){transportError=String(e)}
 fs.writeFileSync(path.join(dir,'terminal.json'),JSON.stringify({role,...result,counts:totals??null,ioError:ioError??null,stabilityError:stabilityError??null,transportError:transportError??null,passing:!ioError&&!stabilityError&&!transportError},null,2)+'\n',{flag:'wx'});
 assert(!ioError&&!stabilityError&&!transportError,'Whole original child incomplete; local evidence: '+dir);
 return {role,counts:totals,evidence:dir};
}
