// Test-only actual recipe extraction and complete original-context transports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {finished} from 'node:stream/promises';
import readline from 'node:readline';
const FIXTURE_SHA256='e454df9d261970ad6e82f503cced5abfd244fde5e60446aca9f137bc8477478a';
const fixtureBase=new URL('./fixtures/viewer-notice-roles/',import.meta.url);
const site=fileURLToPath(new URL('../',import.meta.url));
const roles=['wave4','admission','guard'];
const entries={wave4:'tests/atlas-current-history-wave4-contract.test.mjs',admission:'tests/notice-history-preservation.test.mjs',guard:'tests/wave4-notice-digest-guard.test.mjs'};
const rawNames={wave4:'original-wave4.mjs.raw',admission:'original-admission.mjs.raw',guard:'original-guard3.mjs.raw'};
const caseCounts={wave4:4,admission:1,guard:3};
const originalHashes={wave4:'67d44d60387a833b16726fdb090d9f28e8231af3f557b90c0a70d496f14eea05',admission:'73bf416154b1f5ecb3d94e551d900582149aa102f25c1509d048ad5be2c47dff',guard:'cf8505c4815bda3498c6bb8fd981a900026b8066be395851ea1ccaa4478edce4'};
const countKeys=['tests','pass','fail','cancelled','skipped','todo'];
export const noticeSha=bytes=>createHash('sha256').update(bytes).digest('hex');
function relative(value){assert(typeof value==='string'&&value&&!path.isAbsolute(value)&&!value.includes('\\')&&!value.includes(':')&&!value.includes('\0'),'Explicit relative input');assert(value.split('/').every(p=>p&&p!=='.'&&p!=='..'),'No input traversal');return value;}
export function assertNoticeRow(row,bytes){assert(Buffer.isBuffer(bytes));assert.equal(bytes.length,row.bytes,'Input length changed: '+row.path);assert.equal(noticeSha(bytes),row.sha256,'Input hash changed: '+row.path);}
export function loadNoticeFixture(){
 const bytes=fs.readFileSync(new URL('manifest.json',fixtureBase));assert.equal(noticeSha(bytes),FIXTURE_SHA256,'Exact notice fixture');const f=JSON.parse(bytes);
 assert.equal(f.schema,'vm-viewer-notice-roles/1');assert.deepEqual(f.caseCounts,caseCounts);
 for(const role of roles){assert.equal(f.originals[role].sha256,originalHashes[role]);assertNoticeRow({path:rawNames[role],...f.originals[role]},fs.readFileSync(new URL(rawNames[role],fixtureBase)));}
 assert.equal(f.recipe.builderSha256,'ff794e14a3c95e0404f114d364db370a9ef6059cf0dc90c34f004bf9d856cfc4');
 assert.equal(f.current.source,'727ed5b451ae940a01e56272c8fbc703ea3b0095');return f;
}
function evidence(f){const file=process.env.VM_NOTICE_LOCAL_EVIDENCE;assert(typeof file==='string'&&path.isAbsolute(file),'Explicit VM_NOTICE_LOCAL_EVIDENCE required; no current fallback');const bytes=fs.readFileSync(file);assert.equal(noticeSha(bytes),f.localEvidence.sha256,'Local-only read inventory changed');const e=JSON.parse(bytes);assert.equal(e.schema,'vm-viewer-notice-local-inputs/1');assert.deepEqual(Object.keys(e.roles).sort(),[...roles].sort());return e;}
function checkedRows(root,rows,expected){
 assert(Array.isArray(rows)&&rows.length===expected,'Exact finite input count');const names=new Set(),bytes=new Map();
 for(const row of rows){relative(row.path);assert(!names.has(row.path),'Duplicate finite input');names.add(row.path);assert.match(row.sha256,/^[a-f0-9]{64}$/);assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0);const file=path.join(root,row.path),stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular input required');const b=fs.readFileSync(file);assertNoticeRow(row,b);bytes.set(row.path,b);}
 return bytes;
}
export function assertNoticeIdentity(pin,viewer){
 const f=loadNoticeFixture();for(const key of ['source','sourceTree','reviewIntegration','runtimeSources','viewerFiles','viewerPackages'])assert.deepEqual(pin[key],f.current[key],'Exact current notice identity: '+key);
 assert.equal(viewer.sourceCommit,f.current.source);assert.equal(viewer.websiteIntegrationSha256,f.current.reviewIntegration);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.packages.length,24);assert.equal(viewer.files.length,f.current.viewerFiles);
 assertPackageIdentities(f.packages,viewer.packages);
}
export function assertPackageIdentities(expected,actual){
 assert(Array.isArray(actual)&&actual.length===expected.length,'Complete package identity set');const map=new Map();
 for(const row of actual){assert(!map.has(row.name),'Duplicate/ambiguous package identity');map.set(row.name,row);}
 for(const row of expected){const value=map.get(row.name);assert(value,'Missing required package: '+row.name);for(const key of ['name','version','license'])assert.equal(value[key],row[key],'Wrong package '+key+': '+row.name);}
}
export function compareNoticeBytes(actual,expected,digest=noticeSha){
 assert.equal(digest(actual),digest(expected),'Notice bytes differ; inspect local source bindings without a large Buffer diff');
 assert.deepEqual(actual,expected,'Exact notice bytes after digest guard');
}
export function noticeSections(bytes){
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes),matches=[...text.matchAll(/^## ([^\r\n ]+) ([^\r\n ]+) \(([^\r\n]+)\)\r?$/gm)],seen=new Set();
 return matches.map((m,i)=>{assert(!seen.has(m[1]),'Duplicate notice section');seen.add(m[1]);return {name:m[1],version:m[2],license:m[3],bytes:Buffer.from(text.slice(m.index,matches[i+1]?.index??text.length))};});
}
export function assertHistoricalNoticeRetention(oldTail,currentTail){
 const f=loadNoticeFixture();assert.equal(oldTail.length,f.oldTail.bytes);assert.equal(noticeSha(oldTail),f.oldTail.sha256,'Genuine historical22 tail');
 const old=noticeSections(oldTail),now=noticeSections(currentTail);assert.equal(old.length,22);assert.equal(now.length,24);const byName=new Map(now.map((p,i)=>[p.name,{...p,index:i}]));let previous=-1;
 for(const row of old){const current=byName.get(row.name);assert(current,'Historical notice missing: '+row.name);assert(current.index>previous,'Historical notice order changed');assert(current.bytes.equals(row.bytes),'Historical notice bytes changed: '+row.name);previous=current.index;}
 assertPackageIdentities(f.packages,now);const oldNames=new Set(old.map(r=>r.name));assert.deepEqual(now.filter(r=>!oldNames.has(r.name)).map(r=>r.name),['its-fine','react-use-measure'],'Exactly the two admitted added notices');
 return {oldPackages:old.length,currentPackages:now.length};
}
export function extractNoticeRecipe(builder){
 const f=loadNoticeFixture();assert.equal(noticeSha(builder),f.recipe.builderSha256,'Actual builder source changed');const text=new TextDecoder('utf-8',{fatal:true}).decode(builder),a=text.indexOf(f.recipe.start),b=text.indexOf(f.recipe.end);
 assert(a>=0&&b>a&&text.indexOf(f.recipe.start,a+f.recipe.start.length)===-1&&text.indexOf(f.recipe.end,b+f.recipe.end.length)===-1,'Exact read-only recipe boundaries');
 const fragment=text.slice(a,b);assert.equal(noticeSha(Buffer.from(fragment)),f.recipe.fragmentSha256,'Exact original recipe fragment');
 assert(!fragment.includes('writeFileSync')&&!fragment.includes('await build'),'No CLI generation side effects in recipe');
 const output=/^writeFileSync\('public\/atlas-review-viewer\/THIRD_PARTY_NOTICES\.txt', ([^\r\n]+)\);/m.exec(text);assert(output,'Actual output expression');assert.equal(output[1],f.recipe.outputExpression,'Exact builder output expression');return fragment;
}
export function readCurrentNoticeInputs(){const f=loadNoticeFixture(),e=evidence(f);return {f,e,bytes:checkedRows(site,e.current.rows,f.localEvidence.currentRows)};}
export function assertNoticeCurrentPrefix(){const f=loadNoticeFixture(),bytes=fs.readFileSync(path.join(site,'tests/viewer-notice-current.test.mjs'));assert.equal(noticeSha(bytes.subarray(0,f.prefix.bytes)),f.prefix.sha256,'All original first-three current case bodies/setup are byte-exact');}
export function assertNoticePackageSource(binding,pkg,lock){
 relative(binding.packageJson);assert(binding.packageJson.endsWith('/package.json'),'Explicit package metadata file');assertPackageIdentities([binding],[pkg]);const packageDir=binding.packageJson.slice(0,-'/package.json'.length);assert(lock.packages&&Object.hasOwn(lock.packages,packageDir),'Recorded package location absent from lock');assert.equal(lock.packages[packageDir].version,binding.version,'Locked version/source mismatch');return packageDir;
}
export function readHistoricalNoticeTail(){
 const f=loadNoticeFixture();evidence(f);const file=path.join(path.dirname(process.env.VM_NOTICE_LOCAL_EVIDENCE),'historical-tail.txt'),bytes=fs.readFileSync(file);assert.equal(bytes.length,f.oldTail.bytes);assert.equal(noticeSha(bytes),f.oldTail.sha256,'Supporting historical tail bytes');return bytes;
}
function currentRecipe(f,e,bytes){
 assert(Array.isArray(e.current.packages)&&e.current.packages.length===24);assertPackageIdentities(f.packages,e.current.packages);
 const lock=JSON.parse(bytes.get('package-lock.json')),packages=new Map(),dirs=new Map();
 for(const binding of e.current.packages){
  relative(binding.packageJson);const pkgBytes=bytes.get(binding.packageJson);assert(pkgBytes,'Package source outside exact input set');assert.equal(noticeSha(pkgBytes),binding.packageJsonSha256);const pkg=JSON.parse(pkgBytes);
  const packageDir=assertNoticePackageSource(binding,pkg,lock);
  const directory=path.join(site,packageDir);assert(!dirs.has(directory),'Ambiguous package directory');
  const licenseNames=[];for(const source of binding.noticeSources){assert(bytes.has(source.path),'Notice source outside exact input set');assertNoticeRow(source,bytes.get(source.path));if(path.posix.dirname(source.path)===packageDir)licenseNames.push(path.posix.basename(source.path));else assert.equal(source.path,'LICENSES/clinical-review/react-three-fiber-LICENSE.txt','Only declared Fiber fallback may be outside package root');}
  assert(licenseNames.length>0||(binding.name==='@react-three/fiber'&&binding.version==='9.7.0'),'Missing selected notice source');
  dirs.set(directory,licenseNames.sort());packages.set(binding.name,{...pkg,directory});
 }
 const readFileSync=(file,encoding)=>{assert.equal(encoding,'utf8');const abs=path.resolve(site,file),rel=path.relative(site,abs).replaceAll('\\','/');relative(rel);assert(bytes.has(rel),'Recipe attempted undeclared read');return bytes.get(rel).toString('utf8');};
 const readdirSync=directory=>{const abs=path.resolve(directory);assert(dirs.has(abs),'Recipe attempted undeclared directory');const names=fs.readdirSync(abs),selected=names.filter(n=>/^(license|licence|notice|copying|ofl)(\.|$)/i.test(n)).sort();assert.deepEqual(selected,dirs.get(abs),'Package notice selection changed');return names;};
 const fragment=extractNoticeRecipe(bytes.get('scripts/build-clinical-review-viewer.mjs'));
 // Execute only the authenticated pure notices/loop span from the real builder.
 // No builder module import, Vite invocation, artifact write or fake export.
 const recipe=new Function('manifest','packages','readFileSync','readdirSync','resolve','Buffer',fragment+'\nreturn Buffer.from('+f.recipe.outputExpression+');');
 return recipe(JSON.parse(bytes.get('atlas-review/manifest.json')),packages,readFileSync,readdirSync,path.resolve,Buffer);
}
export function verifyCurrentNotice({pin,viewerManifest,source,viewer,oldTail}){
 const {f,e,bytes}=readCurrentNoticeInputs();assertNoticeCurrentPrefix();assertNoticeIdentity(pin,viewerManifest);assert.equal(fs.realpathSync(process.cwd()),fs.realpathSync(site),'Actual current recipe cwd');
 const canonical=value=>noticeSha(Buffer.from(JSON.stringify(value)));
 assert.equal(canonical(pin),canonical(JSON.parse(bytes.get('tests/fixtures/current-atlas-delivery.json'))),'Actual current delivery pin argument');
 assert.equal(canonical(viewerManifest),canonical(JSON.parse(bytes.get('public/atlas-review-viewer/manifest.json'))),'Actual Viewer manifest argument');
 assert(bytes.get('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').equals(source),'Actual imported/source-bound notice differs');assert(bytes.get('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt').equals(viewer),'Actual Viewer input differs');
 const expected=currentRecipe(f,e,bytes);compareNoticeBytes(viewer,expected);assert.equal(noticeSha(viewer),f.currentNoticeSha256,'Exact admitted current24 output');const entry=viewerManifest.files.find(r=>r.path==='THIRD_PARTY_NOTICES.txt');assert(entry);assert.equal(entry.sha256,noticeSha(viewer));
 const prefix=Buffer.from('# Clinical Review third-party notices\n\nAtlas source: '+pin.source+'\n\n');assert(viewer.subarray(0,prefix.length).equals(prefix),'Current source framing');
 assert(viewer.subarray(prefix.length,prefix.length+source.length).equals(source),'Complete current source notice');const result=assertHistoricalNoticeRetention(oldTail,viewer.subarray(prefix.length+source.length));
 const after=readCurrentNoticeInputs();assert.equal(after.f.localEvidence.sha256,f.localEvidence.sha256);assertNoticeCurrentPrefix();return {...result,sha256:noticeSha(viewer)};
}

export function assertCompleteNoticeChild(result,tap,expected){
 assert.equal(result.error,undefined,'Original child transport/start failure');assert.equal(result.signal,null,'Original child signalled');assert.equal(result.code,0,'Original child failed; inspect local evidence');
 assert.equal([...tap.matchAll(/^TAP version 13\r?$/gm)].length,1,'One real standalone TAP stream');
 assert(!/^\s*not ok\b/im.test(tap),'Failed point contradicts success');assert(!/^\s*(?:not )?ok\b[^\r\n]*#\s*(?:skip|todo)\b/im.test(tap),'Skipped/TODO point contradicts success');assert(!/^\s*Bail out!/im.test(tap),'No bailout');
 const counts={};for(const key of countKeys){const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,'One terminal '+key);counts[key]=Number(matches[0][1]);}
 assert.deepEqual(counts,{tests:expected,pass:expected,fail:0,cancelled:0,skipped:0,todo:0},'Every original case must pass');
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)],points=[...tap.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)];assert.equal(plans.length,1,'One final plan');assert.equal(Number(plans[0][1]),expected,'Exact whole original root');assert.deepEqual(points.map(m=>Number(m[1])),Array.from({length:expected},(_,i)=>i+1),'All original points, no duplicates/missing roots');assert(plans[0].index>points.at(-1).index,'Plan follows points');for(const key of countKeys)assert(tap.lastIndexOf('# '+key+' ')>plans[0].index,'Counts follow plan');return counts;
}
export function noticeChildEnvironment(environment,native){
 const env={};for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','TEMP','TMP','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])if(environment[key]!==undefined)env[key]=environment[key];
 Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=768',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',WRANGLER_SEND_METRICS:'false'});
 if(native)Object.assign(env,{VM_ATLAS_SOURCE_REPO:native,ATLAS_SOURCE_REPO:native});return env;
}
function explicitRoot(name){const root=process.env[name];assert(typeof root==='string'&&root,name+' is required; no current fallback');return fs.realpathSync(root);}
function roleRoots(role){
 const key={wave4:'VM_NOTICE_WAVE4_WEBSITE',admission:'VM_NOTICE_ADMISSION_WEBSITE',guard:'VM_NOTICE_GUARD_WEBSITE'}[role];const root=explicitRoot(key);assert.notEqual(root,fs.realpathSync(site),'Historical/current Website separation');
 return {website:root,...(role==='wave4'?{native:explicitRoot('VM_NOTICE_WAVE4_ATLAS')}:{})};
}
function git(root,args,bytes=false){return execFileSync('git',['--no-replace-objects','-C',root,...args],{windowsHide:true,encoding:bytes?undefined:'utf8',env:noticeChildEnvironment(process.env),maxBuffer:8*1024*1024});}
function verifyHistorical(role,f,e,r){
 const input=e.roles[role];assert.equal(input.entry,entries[role]);assert.equal(input.cases,caseCounts[role]);checkedRows(r.website,input.rows,f.localEvidence.roleRows[role]);
 const receipt={wave4:'../TEST_READY_SOURCE.json',admission:'../PREPARATION.json',guard:'../SOURCE_CANDIDATE.json'}[role];assert.equal(input.receipt.relative,receipt);assert.equal(noticeSha(fs.readFileSync(path.resolve(r.website,receipt))),f.receipts[role],'Original context receipt');assert.equal(input.receipt.sha256,f.receipts[role]);
 const original=fs.readFileSync(new URL(rawNames[role],fixtureBase));assert(original.equals(fs.readFileSync(path.join(r.website,entries[role]))),'Actual whole original module URI must contain exact fixture bytes');
 assert.equal(noticeSha(fs.readFileSync(path.join(site,entries[role]))),f.collectors[role],'Exact current collector');
 if(role==='wave4'){
  assert.equal(input.source,f.historicalNative.source);assert.equal(input.tree,f.historicalNative.tree);assert.equal(input.pinSha256,f.historicalNative.pinSha256);
  assert.equal(fs.realpathSync(git(r.native,['rev-parse','--show-toplevel']).trim()),r.native,'Native repository root');assert.equal(git(r.native,['rev-parse','HEAD']).trim(),input.source,'Native6d7 HEAD');assert.equal(git(r.native,['rev-parse','HEAD^{tree}']).trim(),input.tree,'Native6d7 tree');assert(git(r.native,['status','--porcelain']).trim()==='','Native worktree must be clean');
  assert.equal(noticeSha(fs.readFileSync(path.join(r.website,'tests/fixtures/current-atlas-delivery.json'))),input.pinSha256,'Exact historical46file/22package pin');
  for(const [scope,rows]of [['native',input.nativeCommits],['website',input.websiteCommits]])for(const row of rows){assert.equal(git(r[scope],['rev-parse',row.revision+'^{commit}']).trim(),row.revision,'Exact required historical commit');}
  assert.equal(input.gitObjects.length,f.localEvidence.gitObjects,'Exact immutable blob read set');const seen=new Set();for(const row of input.gitObjects){assert(['native','website'].includes(row.scope));assert.match(row.revision,/^[a-f0-9]{40}$/);relative(row.path);const key=row.scope+':'+row.revision+':'+row.path;assert(!seen.has(key),'Unique historical blob');seen.add(key);assert.equal(noticeSha(git(r[row.scope],['show',row.revision+':'+row.path],true)),row.sha256,'Immutable historical blob bytes changed: '+row.path);}
 }
}
export async function runOriginalNoticeRole(role){
 assert(roles.includes(role),'Exact declared notice role');const f=loadNoticeFixture(),e=evidence(f),r=roleRoots(role);verifyHistorical(role,f,e,r);
 const dir=path.join(site,'.local','viewer-notice-role-runs',new Date().toISOString().replace(/[:.]/g,'-')+'-'+role+'-'+randomUUID());fs.mkdirSync(dir,{recursive:true});
 const out=fs.createWriteStream(path.join(dir,'child.tap'),{flags:'wx'}),err=fs.createWriteStream(path.join(dir,'child.stderr.log'),{flags:'wx'});
 const args=['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',entries[role]];
 const child=spawn(process.execPath,args,{cwd:r.website,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:noticeChildEnvironment(process.env,r.native)});child.stdout.pipe(out);child.stderr.pipe(err);
 const save=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});save('started.json',{role,pid:child.pid,parentPid:process.pid,args,cwd:r.website,entry:entries[role],cases:caseCounts[role],localEvidenceSha256:f.localEvidence.sha256});
 const result=await new Promise(resolve=>{let error;child.once('error',e=>{error=String(e)});child.once('close',(code,signal)=>resolve({code,signal,...(error?{error}:{})}))});await Promise.all([finished(out),finished(err)]);
 let inputError;try{const after=loadNoticeFixture();verifyHistorical(role,after,evidence(after),r)}catch(error){inputError=String(error)}
 let tap='';const lines=readline.createInterface({input:fs.createReadStream(path.join(dir,'child.tap')),crlfDelay:Infinity});for await(const line of lines)if(/^(?:TAP version|\s*(?:not )?ok\b|1\.\.|# (?:tests|pass|fail|cancelled|skipped|todo) |\s*Bail out!)/i.test(line))tap+=line+'\n';
 let counts,transportError;try{counts=assertCompleteNoticeChild(result,tap,caseCounts[role])}catch(error){transportError=String(error)}save('terminal.json',{role,...result,counts:counts??null,expectedCases:caseCounts[role],inputsStable:!inputError,inputError:inputError??null,transportError:transportError??null,passing:!inputError&&!transportError,clinicalApproval:false,licensingClearance:false});
 assert(!inputError,'Original notice inputs changed; local evidence: '+dir);assert(!transportError,'Original notice role did not complete unchanged; local evidence: '+dir);return {role,counts,evidence:dir};
}
