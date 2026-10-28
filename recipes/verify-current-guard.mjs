// Main invokes under the existing memory supervisor. This driver never launches historical replay.
// Usage: node --max-old-space-size=128 verify-current-guard.mjs <successorWebsite> <receipt> <fixedExpectedSHA256>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const [websiteArg,receiptArg,trustedSHA,...extra]=process.argv.slice(2);
assert.equal(extra.length,0,'Exactly Website, receipt and externally fixed SHA arguments');
assert(path.isAbsolute(websiteArg??''),'Absolute successor Website required');
assert(path.isAbsolute(receiptArg??''),'Absolute successor receipt required');
assert.match(trustedSHA??'',/^[a-f0-9]{64}$/,'Externally fixed original receipt SHA-256');
const website=fs.realpathSync(websiteArg),receiptPath=fs.realpathSync(receiptArg);
const originalBytes=fs.readFileSync(receiptPath);
assert.equal(sha(originalBytes),trustedSHA,'Pin original receipt before any synthetic mutation');
const original=JSON.parse(originalBytes);
assert.equal(fs.realpathSync(original.website),website,'Trusted receipt belongs to supplied successor');
const ownDir=path.dirname(fileURLToPath(import.meta.url));
assert(/^F:\\/i.test(ownDir),'Verifier and all generated files must stay on F');
assert(/^F:\\/i.test(website)&&/^F:\\/i.test(receiptPath),'Inputs must be on F');
const evidence=path.join(ownDir,'guard-verification-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID());
fs.mkdirSync(evidence,{recursive:false});
const protectedPaths=[
 'tests/fixtures/current-atlas-delivery.json','atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','public/atlas-runtime/head-neck/manifest.json',
 'public/atlas-runtime/head-neck/source-inputs.json','lib/atlas-model-inventory.json',
 'atlas-review/public/models/bodyparts3d/full-body/catalog.json',
 ...['app/body-content.ts','lib/neck-landmark-xray.ts','content/neck-landmark-xray.ts',
 'content/regional-teaching/head-neck.json','content/body-review-display-pins.json',
 'content/body-renderer-revision.json','content/review-revisions.json','lib/renal-tour.ts',
 'lib/regional-tours.ts','content/renal-tour-pins.json'].map(p=>'atlas-review/'+p),
 'tests/neck-renal-original-context.mjs','tests/neck-renal-current-role.test.mjs',
 'tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs',
];
async function fileSHA(file){const h=createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
async function sources(){
 const rows=[];
 for(const relative of protectedPaths){const file=path.join(website,relative);rows.push({path:relative,bytes:fs.statSync(file).size,sha256:await fileSHA(file)});}
 rows.push({path:receiptPath,bytes:fs.statSync(receiptPath).size,sha256:await fileSHA(receiptPath)});
 return rows;
}
const configPath=process.env.VM_NECK_RENAL_CONTEXT_CONFIG;
assert(path.isAbsolute(configPath??''),'Historical context config needed solely to monitor terminal directory');
assert.equal(await fileSHA(configPath),'2943f9125f675bcb62980ae5fcfa40358e95adc6ee23aac3d17d2bef4b2ae579','Original historical config unchanged');
const terminalRoot=JSON.parse(fs.readFileSync(configPath)).terminalRoot;
assert(path.isAbsolute(terminalRoot),'Historical terminal root absolute');
function terminalEntries(){
 const result=[];
 function visit(root){if(!fs.existsSync(root))return;for(const entry of fs.readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  const full=path.join(root,entry.name);assert(!entry.isSymbolicLink(),'No terminal-directory symlink traversal');
  result.push(path.relative(terminalRoot,full)+(entry.isDirectory()?'/':''));if(entry.isDirectory())visit(full);
 }}visit(terminalRoot);return result;
}
const before=await sources(),terminalsBefore=terminalEntries();
fs.writeFileSync(path.join(evidence,'BEFORE.json'),JSON.stringify({sources:before,terminalRoot,entries:terminalsBefore},null,2)+'\n',{flag:'wx'});
const helperURL=pathToFileURL(path.join(website,'tests/neck-renal-original-context.mjs')).href;
const childCode=`try { const {guardCurrentDelivery}=await import(${JSON.stringify(helperURL)}); const pin=guardCurrentDelivery(); console.log(JSON.stringify({kind:'success',source:pin.source})); } catch(error) { console.log(JSON.stringify({kind:'failure',name:error.name,code:error.code??null,message:error.message})); process.exitCode=19; }`;
const fixture='tests/fixtures/current-atlas-delivery.json';
const mutateRow=(r,key,value)=>{const row=r.sourceRows.find(x=>x.path===fixture);assert(row,'Protected fixture row exists');row[key]=value;};
const cases=[
 {id:'valid-original',positive:true},
 {id:'absent-receipt',absent:true,error:/VM_CURRENT_SOURCE_RECEIPT must be absolute/},
 {id:'malformed-external-sha',signature:'not-a-sha',error:/Exact external current Website receipt SHA-256 required/},
 {id:'wrong-external-sha',signature:trustedSHA==='0'.repeat(64)?'1'.repeat(64):'0'.repeat(64),error:/Authenticated current Website receipt/},
 {id:'receipt-wrong-website',mutate:r=>{r.website=evidence;},error:/Receipt belongs to this Website/},
 {id:'duplicate-source-row',mutate:r=>{r.sourceRows.push(structuredClone(r.sourceRows[0]));},error:/Unique receipt source path/},
 {id:'missing-protected-row',mutate:r=>{r.sourceRows=r.sourceRows.filter(x=>x.path!==fixture);},error:/Current-role source sealed by receipt: tests\/fixtures\/current-atlas-delivery.json/},
 {id:'wrong-row-size',mutate:r=>{const row=r.sourceRows.find(x=>x.path===fixture);mutateRow(r,'bytes',row.bytes+1);},error:/tests\/fixtures\/current-atlas-delivery.json receipt bytes/},
 {id:'wrong-row-hash',mutate:r=>mutateRow(r,'sha256','0'.repeat(64)),error:/tests\/fixtures\/current-atlas-delivery.json receipt hash/},
 {id:'wrong-atlas-head',mutate:r=>{r.atlasHead='0'.repeat(40);},error:/Current module matches independent receipt/},
 {id:'wrong-atlas-tree',mutate:r=>{r.atlasTree='0'.repeat(40);},error:/Current fixture matches receipt Atlas tree/},
];
async function child(env){
 return await new Promise((resolve,reject)=>{
  const processChild=spawn(process.execPath,['--max-old-space-size=128','--input-type=module','--eval',childCode],{
   cwd:website,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env});
  let stdout='',stderr='',overflow=false,timedOut=false;
  const limit=16384;
  function collect(which,chunk){const text=chunk.toString();if(which==='stdout')stdout+=text;else stderr+=text;
   if(Buffer.byteLength(stdout)>limit||Buffer.byteLength(stderr)>limit){overflow=true;stdout=stdout.slice(0,limit);stderr=stderr.slice(0,limit);processChild.kill();}}
  processChild.stdout.on('data',chunk=>collect('stdout',chunk));processChild.stderr.on('data',chunk=>collect('stderr',chunk));
  const timer=setTimeout(()=>{timedOut=true;processChild.kill();},60000);
  processChild.once('error',error=>{clearTimeout(timer);reject(error);});
  processChild.once('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal,stdout,stderr,overflow,timedOut});});
 });
}
const results=[];let failure;
try{
 for(const spec of cases){
  const env={...process.env,NODE_OPTIONS:'--max-old-space-size=128',GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',
   VM_CURRENT_SOURCE_RECEIPT:receiptPath,VM_CURRENT_SOURCE_SHA256:trustedSHA};
  let signaturePurpose='trusted original expected SHA; never derived by driver';
  if(spec.absent)delete env.VM_CURRENT_SOURCE_RECEIPT;
  if(spec.signature)env.VM_CURRENT_SOURCE_SHA256=spec.signature;
  if(spec.mutate){
   const synthetic=structuredClone(original);spec.mutate(synthetic);
   const bytes=Buffer.from(JSON.stringify(synthetic,null,2)+'\n');
   const syntheticPath=path.join(evidence,spec.id+'.synthetic-receipt.json');fs.writeFileSync(syntheticPath,bytes,{flag:'wx'});
   env.VM_CURRENT_SOURCE_RECEIPT=syntheticPath;env.VM_CURRENT_SOURCE_SHA256=sha(bytes);
   signaturePurpose='SYNTHETIC per-mutated-receipt SHA solely to reach field guard; not source authentication evidence';
  }
  const actual=await child(env);let parsed;
  try{parsed=JSON.parse(actual.stdout.trim());}catch{}
  const result={id:spec.id,signaturePurpose,...actual,parsed:parsed??null};results.push(result);
  fs.writeFileSync(path.join(evidence,spec.id+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  assert(!actual.overflow&&!actual.timedOut,'Bounded child completed: '+spec.id);assert.equal(actual.signal,null,spec.id+' no signal');
  if(spec.positive){assert.equal(actual.code,0,spec.id);assert.equal(parsed?.kind,'success');assert.equal(parsed.source,original.atlasHead);}
  else{assert.equal(actual.code,19,spec.id+' caught guard rejection');assert.equal(parsed?.kind,'failure');assert.equal(parsed.name,'AssertionError',spec.id+' meaningful assertion class');assert.equal(parsed.code,'ERR_ASSERTION');assert.match(parsed.message,spec.error,spec.id+' exact guard boundary');}
  assert.deepEqual(terminalEntries(),terminalsBefore,'No new historical terminal entries after '+spec.id);
 }
}catch(error){failure=error;}
finally{
 const after=await sources(),terminalsAfter=terminalEntries();
 const sourcesUnchanged=JSON.stringify(after)===JSON.stringify(before);
 const historicalTerminalsUnchanged=JSON.stringify(terminalsAfter)===JSON.stringify(terminalsBefore);
 const summary={trustedReceipt:receiptPath,trustedSHA,website,evidence,cases:results.length,expectedCases:cases.length,
  sourcesUnchanged,historicalTerminalsUnchanged,testsHistoricalReplayLaunched:false,
  passing:!failure&&results.length===cases.length&&sourcesUnchanged&&historicalTerminalsUnchanged,
  error:failure?String(failure):null,after};
 fs.writeFileSync(path.join(evidence,'RESULT.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({evidence,passing:summary.passing,cases:results.length}));
 if(!summary.passing)process.exitCode=1;
}
