import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,extname,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {preShortCiliaryAuthoring} from './short-ciliary-history.mjs';
import {authoringBeforeCostalCartilageImaging} from './costal-cartilage-imaging-history.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {beforeLaminaPathology} from './lamina-pathology-history.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const root=resolve(import.meta.dirname,'..'),commit='e7e6b197e0cd25c1a9160b69f93fbe673192c755';
const compiled=await build({stdin:{contents:"export {bodyLesson,bodyContent} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'immutable-parent',setup(builder){builder.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;assert(!path.startsWith('../'));
  return {contents:execFileSync('git',['show',commit+':'+path],{cwd:root,encoding:'utf8',maxBuffer:16e6}),loader:{'.ts':'ts','.tsx':'tsx','.json':'json'}[extname(path)]||'js',resolveDir:dirname(args.path)};
});}}]});
const parent=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=JSON.parse(await readFile(resolve(root,'public/models/bodyparts3d/full-body/catalog.json')));
const {api}=await contentContext(),restored=beforeLaminaPathology(api);
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(hash(wholeBodyTeachingSnapshot(parent,catalog)),hash(wholeBodyTeachingSnapshot(restored,catalog)));
function check(api){try{authoringBeforeCostalCartilageImaging({api:preShortCiliaryAuthoring(api,catalog),catalog});return {passed:true};}catch(error){assert.equal(error.code,'ERR_ASSERTION');return {passed:false,message:error.message.split('\n')[0],actual:error.actual,expected:error.expected};}}
const original=check(parent),current=check(restored);assert.deepEqual(current,original);assert.equal(original.passed,false);
const report={parentCommit:commit,immutableParentCompiled:true,allParentTeachingAndRecipesMatch:true,parentFailure:original,currentAfterExactReplay:current,newRevisionCausedFailure:false};
await writeFile(resolve(root,'docs/lamina-parent-history-diagnostic.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
