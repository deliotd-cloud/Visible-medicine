// Compose genuine source-bound module results; never re-label a failed run green.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {summarizeTapPrefix} from './native-tap-prefix-summary.mjs';
const batch='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v11',prep=json(batch+'/PREPARATION.json');
const ts=createRequire(prep.site+'/package.json')('typescript');
const frozen=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
assert.equal(frozen.length,5107);const final=new Map(frozen.map(row=>[row.path,row.sha256]));
for(const row of frozen)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
for(const row of prep.changes){assert.equal(sha(read(row.from)),row.sha256);final.set(row.path,row.sha256);}
assert.equal(final.size,5154);
const binding=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,prep.review);assert.equal(binding.inputs.length,1710);
for(const row of binding.inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const stages={};
for(const name of ['current-source-matrix','current-source-matrix-followup','current-source-matrix-followup-v2','current-source-matrix-followup-v3','head-specimen-actual-native']){
 const root='F:/VisibleMedicine/staging/20261021-'+name,p=json(root+'/PREPARATION.json'),r=json(root+'/MATRIX_RESULT.json');
 assert.equal(r.signal,null);assert(r.sourceInputsUnchanged);assert.equal(r.source,prep.source);assert.equal(r.review,prep.review);
 assert.equal(sha(read(r.log)),r.logSha256);assert.equal(sha(read(r.tap)),r.tapSha256);
 const summary=summarizeTapPrefix(read(r.tap).toString());assert.equal(summary.incompleteRootDiagnostics,0);
 assert.equal(summary.rootResultMarkers,r.counts.tests);assert.equal(r.counts.cancelled,0);assert.equal(r.counts.skipped,0);
 const results=[];let entry;
 for(const line of read(r.tap).toString().split(/\r?\n/)){
  const m=/^(ok|not ok) (\d+) - (.*)$/.exec(line);
  if(m){entry={pass:m[1]==='ok',number:Number(m[2]),title:m[3],complete:false};results.push(entry);}
  else if(line==='  ...'&&entry){entry.complete=true;entry=null;}
 }
 assert.equal(results.filter(x=>x.pass).length,r.counts.pass);assert.equal(results.filter(x=>!x.pass).length,r.counts.fail);
 const inputs=new Map(json(p.effectiveSnapshot).map(row=>[row.path,row.sha256]));
 for(const [file,hash]of inputs)assert.equal(sha(read(p.site+'/'+file)),hash,file);
 assert.equal(fs.realpathSync(p.site+'/node_modules'),fs.realpathSync(prep.site+'/node_modules'));
 stages[name]={root,p,r,inputs,results};
}
function sourceFile(module){return prep.changes.find(row=>row.path===module)?.from??prep.site+'/'+module;}
function titles(file){
 const ast=ts.createSourceFile(file,read(file).toString(),ts.ScriptTarget.Latest,true);
 return ast.statements.flatMap(node=>{
  const call=ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)?node.expression:null;
  return call&&call.expression.getText(ast)==='test'&&ts.isStringLiteral(call.arguments[0])?[call.arguments[0].text]:[];
 });
}
function dependencyText(site,module,seen=new Set()){
 if(seen.has(module))return '';seen.add(module);
 const code=read(site+'/'+module).toString(),ast=ts.createSourceFile(module,code,ts.ScriptTarget.Latest,true);
 let all=code;
 for(const node of ast.statements){
  if(!ts.isImportDeclaration(node)||!ts.isStringLiteral(node.moduleSpecifier)||!node.moduleSpecifier.text.startsWith('.'))continue;
  const stem=path.posix.normalize(path.posix.join(path.posix.dirname(module),node.moduleSpecifier.text));
  assert(!stem.startsWith('../'));
  const found=['','.ts','.tsx','.mjs','.js','.json'].map(s=>stem+s).find(p=>fs.existsSync(site+'/'+p)&&fs.statSync(site+'/'+p).isFile());
  assert(found,'Unavailable test dependency: '+stem);
  all+='\n'+dependencyText(site,found,seen);
 }
 return all;
}
const records=[];
for(const module of prep.actualCurrentModules){
 let name='current-source-matrix';
 if(/(?:limb-nerve-quiz|lower-venous-tour-v2|orbital-apex-ct)\.test\.ts$/.test(module))name='current-source-matrix-followup-v2';
 if(module.endsWith('neonatal-cranial-us.test.ts'))name='current-source-matrix-followup-v3';
 if(module.endsWith('orbital-ring-ct.test.ts'))name='current-source-matrix-followup';
 if(module.endsWith('specimen-continuous-playback.test.ts')||module==='tests/head-neck-pilot.test.ts')name='head-specimen-actual-native';
 const stage=stages[name],hash=sha(read(sourceFile(module)));
 assert.equal(hash,final.get(module));assert.equal(stage.inputs.get(module),hash,module+': executed exact final source');
 const closure=new Set(),text=dependencyText(stage.p.site,module,closure);
 const unrelatedDifferences=[];
 for(const [file,expected]of final){
  if(stage.inputs.get(file)===expected)continue;
  assert(file.startsWith('tests/'),'Producer input changed: '+file);
  assert(!closure.has(file),'Changed test dependency: '+file);
  assert(!text.includes(path.posix.basename(file)),'Changed referenced fixture/test: '+file);
  unrelatedDifferences.push(file);
 }
 const declarations=titles(sourceFile(module));assert(declarations.length>0,module);
 let selected;
 if(module==='tests/head-neck-pilot.test.ts'){
  const file=stage.root+'/HEAD_PILOT_ACTUAL.json',r=json(file);assert.equal(r.code,0);assert.equal(sha(read(r.log)),r.logSha256);
  assert.deepEqual(r.args,['--test','--experimental-strip-types','--test-concurrency=1',module]);
  for(const line of ['tests 4','pass 4','fail 0','cancelled 0','skipped 0','todo 0'])assert(r.footer.includes('ℹ '+line));
  assert.equal(declarations.length,4);selected=declarations.map(title=>({title,pass:true,complete:true,receipt:file}));
 }else selected=declarations.map(title=>{
  const matches=stage.results.filter(row=>row.title===title);assert.equal(matches.length,1,module+': unique actual case');
  assert(matches[0].pass&&matches[0].complete,module+': actual case did not pass');return matches[0];
 });
 records.push({module,sha256:hash,proof:stage.root+'/MATRIX_RESULT.json',proofSha256:sha(read(stage.root+'/MATRIX_RESULT.json')),
  selectedCases:selected,unrelatedTestOnlyInputDifferences:unrelatedDifferences,
  reuseBoundary:'All frozen producer/Review/package inputs identical. Executed test source exact. Direct/transitive local import closure and referenced changed fixture names checked; remaining differences are other test-only source/archive/guard overlays, not producer or dependencies.'});
}
assert.equal(records.length,22);assert.equal(records.reduce((n,row)=>n+row.selectedCases.length,0),39);
const triagePath='F:/VisibleMedicine/staging/20261021-source190-complete-suite/TERMINAL_FAILURE_CLASSIFICATION.json',triage=json(triagePath);
assert.equal(triage.classificationComplete,true);assert.equal(triage.counts.fail,136);assert.equal(triage.status,'classified-not-resolved');
const proof={schema:'vm-source-bound-current-module-composition/1',at:new Date().toISOString(),verdict:'passed',source:prep.source,review:prep.review,
 sourceCandidateInputs:5107,projectedInputs:5154,reviewBindings:1710,modules:22,selectedActualCases:39,records,
 originalFailuresRetained:true,fullSuitePassingClaim:false,clinicalApproval:false,spatialRegistration:false,canonicalInstalled:false,
 fullNativeTriage:{receipt:triagePath,sha256:sha(read(triagePath)),classificationOnly:true},
 scope:'39 byte-bound successful actual cases across separately recorded runs, not one green native run or the complete Website suite. Original failed runs remain. Candidate test admission only; fresh UI types/build/browser and recoverable owner cutover still required.'};
const file=batch+'/CURRENT_MODULES_ADMISSION.json';assert(!fs.existsSync(file));fs.writeFileSync(file,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
const next={...prep,admissionReady:true,requiredVerification:prep.requiredVerification.map(gate=>({...gate,status:'passed',receipt:gate.label==='COMPLETE_NATIVE_FAILURE_TRIAGE'?triagePath:file,
 sha256:sha(read(gate.label==='COMPLETE_NATIVE_FAILURE_TRIAGE'?triagePath:file)),reason:gate.label==='COMPLETE_NATIVE_FAILURE_TRIAGE'?'Genuine full terminal136failures fully classified, not resolved.':'Exact current module source, producer/Review bindings and selected actual native cases verified; see composed scope and original receipts.'}))};
const lines=['*** Begin Patch','*** Update File: '+batch+'/PREPARATION.json','@@',...read(batch+'/PREPARATION.json').toString().trimEnd().split('\n').map(l=>'-'+l),...JSON.stringify(next,null,2).split('\n').map(l=>'+'+l),'*** End Patch'];
console.log(lines.join('\n'));
