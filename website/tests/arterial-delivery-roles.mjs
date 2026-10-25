// Test-only complete historical transports and exact source-byte unwrapping.
// No application exports, imports, source files or grants are substituted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {finished} from 'node:stream/promises';
import readline from 'node:readline';
const FIXTURE_SHA256='cffc1441ba02daf23c92565a6368be51b6c2794413f8718104afb426f5cc6951';
const ORIGINAL='a6cbf916326c68b471e7cc16998e59715cb1dd4a44c32fff18fc975f096f58f3';
const EPOCH='95b6fc4f9d3f5ecef3dd1c37c876fb959c89ad83107f66f343d5c00e041587be';
const fixtureBase=new URL('./fixtures/arterial-delivery-roles/',import.meta.url);
const currentWebsite=fileURLToPath(new URL('../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const counterKeys=['tests','pass','fail','cancelled','skipped','todo'];
export function assertFiniteRow(row,bytes){
 assert(Buffer.isBuffer(bytes),'Finite input must be actual bytes');
 assert.equal(bytes.length,row.bytes,'Finite input length changed: '+row.path);
 assert.equal(hash(bytes),row.sha256,'Finite input hash changed: '+row.path);
}
function relativePath(value){
 assert(typeof value==='string'&&value.length>0&&!value.includes('\\')&&!value.includes(':')&&!value.startsWith('/'),'Explicit relative closure path');
 assert(value.split('/').every(p=>p&&p!=='.'&&p!=='..'),'No closure traversal');return value;
}
function rowSet(rows){
 assert(Array.isArray(rows)&&rows.length>0,'Finite closure cannot be empty');const seen=new Set();
 for(const row of rows){relativePath(row.path);assert(!seen.has(row.path),'Duplicate finite input');seen.add(row.path);assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0);assert.match(row.sha256,/^[a-f0-9]{64}$/)}
}
export function loadArterialFixture(){
 const bytes=fs.readFileSync(new URL('manifest.json',fixtureBase));assert.equal(hash(bytes),FIXTURE_SHA256,'Exact arterial fixture manifest');
 const f=JSON.parse(bytes);assert.equal(f.schema,'vm-arterial-delivery-roles/1');
 assert.equal(f.original6.sha256,ORIGINAL);assert.equal(f.epoch2.sha256,EPOCH);
 assert.deepEqual(f.childCases,{original6:6,epoch2:2});
 for(const [role,file]of [['original6','original-six.mjs.raw'],['epoch2','original-two.mjs.raw']]){
  const original=fs.readFileSync(new URL(file,fixtureBase));assertFiniteRow({path:file,...f[role]},original);
  assert.equal(original.includes(0),false,'Code fixture is UTF-8 text');new TextDecoder('utf8',{fatal:true}).decode(original);
 }
 assert.equal(f.identities.original6.source,'6e810b188dde401f6c19a970928f316a479696df');
 assert.equal(f.identities.current.source,'727ed5b451ae940a01e56272c8fbc703ea3b0095');
 assert.equal(f.identities.installed.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.match(f.localClosure.sha256,/^[a-f0-9]{64}$/);return f;
}
export function originalArterialCollectorPayload(bytes){
 assert(Buffer.isBuffer(bytes),'Collector source bytes required');
 const begin=Buffer.from('/* VM_ARTERIAL_ORIGINAL_SIX_BEGIN\n'),end=Buffer.from('VM_ARTERIAL_ORIGINAL_SIX_END */\n');
 const a=bytes.indexOf(begin);assert(a>=0&&bytes.indexOf(begin,a+begin.length)===-1,'One exact original-source payload start');
 const b=bytes.indexOf(end,a+begin.length);assert(b>a&&bytes.indexOf(end,b+end.length)===-1,'One exact original-source payload end');
 const original=bytes.subarray(a+begin.length,b);assert.equal(hash(original),ORIGINAL,'Embedded whole original source, not a literal assertion witness');return original;
}
export function authenticateArterialCollector(name,bytes){
 if(name!=='tests/atlas-arterial-evidence-limits.test.mjs')return bytes;
 assert(Buffer.isBuffer(bytes),'Source bytes required');
 if(hash(bytes)===ORIGINAL)return bytes; // Existing genuine reviewed input.
 const f=loadArterialFixture();
 assert.equal(hash(bytes),f.collectors.original6,'Only the exact declared arterial collector may unwrap');
 assert.equal(hash(fs.readFileSync(new URL('./arterial-history-preservation.test.mjs',import.meta.url))),f.historyOriginalSha256,'Original three-case b79 history assertions remain unchanged');
 const original=fs.readFileSync(new URL('original-six.mjs.raw',fixtureBase));
 assert.equal(hash(original),ORIGINAL,'Complete original arterial source recovered');
 const payload=originalArterialCollectorPayload(bytes);assert(payload.equals(original),'Collector carries the complete authenticated original, not substitute text');return payload;
}
export function assertArterialRoleIdentity(role,pin){
 const f=loadArterialFixture();assert(Object.hasOwn(f.identities,role),'Known exact delivery role');
 const expected=f.identities[role];
 for(const key of ['source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles'])assert.deepEqual(pin[key],expected[key],role+' delivery '+key);
}
export function assertCurrentArterialPrefix(){
 const f=loadArterialFixture(),bytes=fs.readFileSync(path.join(currentWebsite,'tests/atlas-arterial-current-delivery.test.mjs'));
 assert.equal(hash(bytes.subarray(0,f.currentPrefix.bytes)),f.currentPrefix.sha256,'All five current application case bodies and setup retain their original bytes');
}
export function assertCompleteArterialChild(result,tap,expected){
 assert.equal(result.error,undefined,'Historical child startup/transport error');
 assert.equal(result.signal,null,'Historical child was signalled');assert.equal(result.code,0,'Historical original failed; inspect local child evidence');
 const counts={};for(const key of counterKeys){const m=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(m.length,1,'One terminal '+key);counts[key]=Number(m[0][1]);}
 assert.deepEqual(counts,{tests:expected,pass:expected,fail:0,cancelled:0,skipped:0,todo:0},'Complete unchanged original root, no skips or missing cases');
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)],points=[...tap.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)];
 assert(!/^not ok \d+/m.test(tap),'No failed original top-level point');
 assert(!/^(?:not )?ok \d+.*#\s*(?:skip|todo)\b/im.test(tap),'No skipped or todo original top-level point');
 assert.equal(plans.length,1,'One final native TAP plan');assert.equal(Number(plans[0][1]),expected,'Complete original top-level plan');
 assert.deepEqual(points.map(m=>Number(m[1])),Array.from({length:expected},(_,i)=>i+1),'Every original top-level case accounted');
 assert(plans[0].index>points.at(-1).index,'Terminal plan follows original cases');assert(!/^Bail out!/im.test(tap),'No TAP bailout');
 for(const key of counterKeys)assert(tap.lastIndexOf('# '+key+' ')>plans[0].index,'Terminal counts follow plan');
 return counts;
}
export function arterialChildEnvironment(environment,atlas){
 const clean={};for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','TEMP','TMP','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])if(environment[key]!==undefined)clean[key]=environment[key];
 Object.assign(clean,{VM_ATLAS_SOURCE_REPO:atlas,ATLAS_SOURCE_REPO:atlas,GIT_NO_REPLACE_OBJECTS:'1',NODE_OPTIONS:'--max-old-space-size=768',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',WRANGLER_SEND_METRICS:'false'});
 // No NODE_TEST_CONTEXT, credentials, arbitrary Node imports or name filters.
 return clean;
}
function explicitRoot(name){const value=process.env[name];assert(typeof value==='string'&&value.length>0,name+' must name the genuine historical root');return fs.realpathSync(value);}
function roots(role){
 const map={historicalWebsite:explicitRoot('VM_ARTERIAL_HISTORICAL_WEBSITE')};
 assert.notEqual(map.historicalWebsite,fs.realpathSync(currentWebsite),'Historical/current Website separation');
 if(role==='original6')map.historicalAtlas=explicitRoot('VM_ARTERIAL_HISTORICAL_ATLAS');
 else {
  map.installedWebsite=fs.realpathSync('F:/VisibleMedicine/website');map.installedAtlas=fs.realpathSync('F:/VisibleMedicine/atlas');
  assert.notEqual(map.historicalWebsite,map.installedWebsite,'6e/mixed-epoch Website separation');
 }
 return map;
}
function verifyNative(root,identity){
 const env={...arterialChildEnvironment(process.env,root),GIT_OPTIONAL_LOCKS:'0'};
 const git=(...args)=>execFileSync('git',['-C',root,...args],{windowsHide:true,encoding:'utf8',env,maxBuffer:16*1024*1024}).trim();
 assert.equal(fs.realpathSync(git('rev-parse','--show-toplevel')),root,'Native repository root');
 assert.equal(git('rev-parse','HEAD'),identity.source,'Native HEAD identity');assert.equal(git('rev-parse','HEAD^{tree}'),identity.sourceTree,'Native tree identity');
 assert(git('status','--porcelain')==='','Native source changed');
}
function closure(f){
 const file=process.env.VM_ARTERIAL_LOCAL_CLOSURE;assert(typeof file==='string'&&path.isAbsolute(file),'VM_ARTERIAL_LOCAL_CLOSURE must name local-only finite evidence');
 const bytes=fs.readFileSync(file);assert.equal(hash(bytes),f.localClosure.sha256,'Exact finite read inventory');
 const c=JSON.parse(bytes);assert.equal(c.schema,'vm-arterial-finite-closure/1');assert.deepEqual(Object.keys(c.roles).sort(),['epoch2','original6']);return c;
}
function verify(role,f,c,r){
 assert(Object.hasOwn(c.roles,role),'Exact historical role');
 const expectedScopes=role==='original6'?['historicalAtlas','historicalWebsite']:['historicalWebsite','installedWebsite'];
 assert.deepEqual(Object.keys(c.roles[role]).sort(),expectedScopes.sort(),'No closure scope substitution');
 for(const [scope,rows]of Object.entries(c.roles[role])){
  rowSet(rows);assert.equal(rows.length,f.localClosure.counts[role][scope],'Exact finite input count');
  for(const row of rows){const file=path.join(r[scope],relativePath(row.path));const stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular finite input');if(!row.path.startsWith('node_modules/'))assert(fs.realpathSync(file).startsWith(r[scope]+path.sep),'Finite source path cannot redirect outside its role');assertFiniteRow(row,fs.readFileSync(file));}
 }
 if(role==='original6'){
  assertArterialRoleIdentity('original6',readJson(path.join(r.historicalWebsite,'tests/fixtures/current-atlas-delivery.json')));
  verifyNative(r.historicalAtlas,f.identities.original6);
 }else{
  assertArterialRoleIdentity('installed',readJson(path.join(r.installedWebsite,'tests/fixtures/current-atlas-delivery.json')));
  verifyNative(r.installedAtlas,f.identities.installed);
 }
}
export async function runOriginalArterialRole(role){
 assert(['original6','epoch2'].includes(role),'One complete declared historical root');
 const f=loadArterialFixture(),c=closure(f),r=roots(role);verify(role,f,c,r);
 const entry=role==='original6'?'tests/atlas-arterial-evidence-limits.test.mjs':'tests/arterial-epoch-preservation.test.mjs';
 const original=fs.readFileSync(new URL(role==='original6'?'original-six.mjs.raw':'original-two.mjs.raw',fixtureBase));
 assert(fs.readFileSync(path.join(r.historicalWebsite,entry)).equals(original),'Execute the complete original module, not an adapter');
 const collector=role==='original6'?'atlas-arterial-evidence-limits.test.mjs':'arterial-epoch-preservation.test.mjs';
 const collectorBytes=fs.readFileSync(path.join(currentWebsite,'tests',collector));
 assert.equal(hash(collectorBytes),f.collectors[role],'Exact active collector');
 if(role==='original6')assert(originalArterialCollectorPayload(collectorBytes).equals(original),'Original child executes the exact carried source');
 const dir=path.join(currentWebsite,'.local','arterial-role-runs',new Date().toISOString().replace(/[:.]/g,'-')+'-'+role+'-'+randomUUID());fs.mkdirSync(dir,{recursive:true});
 const stdout=fs.createWriteStream(path.join(dir,'child.tap'),{flags:'wx'}),stderr=fs.createWriteStream(path.join(dir,'child.stderr.log'),{flags:'wx'});
 const args=['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',entry];
 const child=spawn(process.execPath,args,{cwd:r.historicalWebsite,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:arterialChildEnvironment(process.env,role==='original6'?r.historicalAtlas:r.installedAtlas)});
 child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 const save=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 save('started.json',{role,pid:child.pid,parentPid:process.pid,args,cwd:r.historicalWebsite,expectedCases:f.childCases[role],nativeSource:role==='original6'?f.identities.original6.source:f.identities.installed.source,localClosureSha256:f.localClosure.sha256});
 const result=await new Promise(resolve=>{let error;child.once('error',e=>{error=String(e)});child.once('close',(code,signal)=>resolve({code,signal,...(error?{error}:{})}))});
 await Promise.all([finished(stdout),finished(stderr)]);
 // Finite before/after verification precedes any success classification.
 let inputError;try{const afterFixture=loadArterialFixture();verify(role,afterFixture,closure(afterFixture),r);assert.equal(hash(fs.readFileSync(path.join(currentWebsite,'tests',collector))),afterFixture.collectors[role],'Collector changed during original execution')}catch(error){inputError=String(error)}
 let tap='';const lines=readline.createInterface({input:fs.createReadStream(path.join(dir,'child.tap')),crlfDelay:Infinity});
 // Only terminal transport metadata is retained in memory; raw output stays local.
 for await(const line of lines)if(/^(?:TAP version|(?:not )?ok \d+|1\.\.|# (?:tests|pass|fail|cancelled|skipped|todo) |Bail out!)/.test(line))tap+=line+'\n';
 let counts,transportError;try{counts=assertCompleteArterialChild(result,tap,f.childCases[role])}catch(error){transportError=String(error)}
 save('terminal.json',{role,...result,expectedCases:f.childCases[role],counts:counts??null,sourceInputsStable:!inputError,inputError:inputError??null,transportError:transportError??null,passing:!inputError&&!transportError,clinicalApproval:false,releaseApproval:false});
 assert(!inputError,'Historical finite inputs changed; local evidence: '+dir);assert(!transportError,'Historical root did not pass completely; local evidence: '+dir);
 return {role,counts,evidence:dir};
}
