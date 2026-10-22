// Pure source reconstruction only; deliberately does not import the test root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-complete-body-wrapper-followup',site='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/website',receipt=site+'/../SOURCE_V2.json';
assert.equal(sha(read(receipt)),'92403824dc9ebcce2f8efe6bb02ed10db642ab646fbdc9cff983d48cfe9a0a07');const source=json(receipt);
assert.equal(sha(read(root+'/RESULT.json')),'1b93cdac758ee053ef71d9520784b208c9a5c7a5f67f52355fd1387bd8d6fa2b');
const before=read(site+'/tests/atlas-body-learning-component.test.mjs'),proposed=read(root+'/website/tests/atlas-body-learning-component.test.mjs'),helper=root+'/website/tests/head-access-wrapper-inverse.mjs';
assert.equal(sha(before),'fdb9016dee124c1a68278b281ec39a67fe6b27dc30b37161b434932823584c2d');assert.equal(sha(proposed),'3fcba11946ef40aeb8ad754962a9383851f61fc9950369a6f5c0f65920f159b6');assert.equal(sha(read(helper)),'791a0329dd4589749b72f087d042b314d2d314b41edc72fbb05879e860226fb1');
const added="import {restorePreHeadAccessWrapper} from './head-access-wrapper-inverse.mjs';\n",oldCall="const beforeLearning=name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate;",newCall="const beforeLearning=restorePreHeadAccessWrapper(name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate,name);";
let inverse=proposed.toString();for(const [from,to]of [[added,''],[newCall,oldCall]]){assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);}assert.equal(inverse,before.toString());
const {restorePreHeadAccessWrapper}=await import(pathToFileURL(helper)),{restorePreExpansionFrame}=await import(pathToFileURL(site+'/tests/expansion-frame-adoption-inverse.mjs'));
const hashes={AtlasRuntimeFrame:'673f6b25ab720fc250b7d55b04fd8571e5b2bc077a5bc1f69e984aabb624b234',HeadAtlasLinkedModel:'c90fd4b9a51a4fa67ef390fb6b79515825fd662160f83cabd127b7283b8d2fab',HeadAtlasGuidedModel:'cfaf695e1e6bd418fe6f2a1416cc18094aab7d7509ecc61396d4f55a37d37499'};
let mutations=0;const wrappers=[];
for(const[name,hash]of Object.entries(hashes)){
 const relative='components/'+name+'.tsx',current=read(site+'/'+relative),original=read(site+'/tests/fixtures/live-learning-original-'+name+'.tsx.raw');assert.equal(sha(current),source.sourceRows.find(row=>row.path===relative).sha256);assert.equal(sha(original),hash);
 const restore=text=>restorePreHeadAccessWrapper(name==='AtlasRuntimeFrame'?restorePreExpansionFrame(text):text,name)
  .replace("import {AtlasBodyLearning} from './AtlasBodyLearning';\n",'')
  .replace(/^[ \t]*<AtlasBodyLearning(?: key=\{frameAttempt\})? frame=\{frame\} src=\{src\}(?: dock="flow")?\/>\n/m,'');
 const normalized=current.toString().replaceAll('\r\n','\n'),expected=original.toString().replaceAll('\r\n','\n');assert.equal(restore(normalized),expected,name+' complete original wrapper');
 assert.throws(()=>assert.equal(restore(normalized+'\n/* foreign */'),expected));mutations++;
 if(name==='HeadAtlasLinkedModel'){
  const seam="    if(next.status==='blocked'&&(next.reason==='sign-in'||next.reason==='access-denied'))session.current='';\n";assert.equal(normalized.split(seam).length,2);
  for(const value of [normalized.replace(seam,''),normalized.replace(seam,seam+seam),normalized.replace(seam,seam.replace("'sign-in'","'foreign'"))]){assert.throws(()=>assert.equal(restore(value),expected));mutations++;}
 }
 if(name==='HeadAtlasGuidedModel')for(const[from,to]of [["        confirmedSource.current=null;\n",''],["'unavailable'|'sign-in'|'access-denied'","'unavailable'|'sign-in'|'foreign'"],["next.reason==='sign-in'","next.reason==='foreign'"],["status==='sign-in'?'Sign in","status==='foreign'?'Sign in"],["'different','sign-in','access-denied'","'different','sign-in','foreign'"]]){
  assert.equal(normalized.split(from).length,2);assert.throws(()=>assert.equal(restore(normalized.replace(from,to)),expected));mutations++;
 }
 wrappers.push({name,currentSha256:sha(current),originalSha256:hash,completeInversePassed:true});
}
assert.throws(()=>restorePreHeadAccessWrapper('unrelated','unknown-wrapper'));mutations++;
const result={at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),proposal:root+'/RESULT.json',proposalSha256:sha(read(root+'/RESULT.json')),wholeTestSourceInversePassed:true,wrappers,mutationsRejected:mutations,pureOnly:true,nativeTestRun:false,productChanged:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false};
fs.writeFileSync(root+'/MAIN_SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/MAIN_SOURCE_PROOF.json',sha256:sha(read(root+'/MAIN_SOURCE_PROOF.json')),wrappers:wrappers.length,mutationsRejected:mutations,pureOnly:true}));
