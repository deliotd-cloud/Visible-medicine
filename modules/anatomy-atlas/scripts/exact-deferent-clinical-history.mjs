// Offline reconstruction of the immutable deferent clinical source trees.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,extname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
import {contentRoot} from './content-contract-tools.mjs';

const root=fileURLToPath(contentRoot);
export const deferentBaselineCommit='62f15bb1c1e20b0cb0bfad1e8484893f577240cb';
export const deferentTransitionCommit='3584fc178a408b42caf430b9084e55198a0d18c6';

export function deferentWholeBodySnapshot(api,catalog){
  const display=api.bodyDisplayCatalog(catalog);
  return {body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};
}

async function historicalApi(commit){
  const compiled=await build({
    stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:root,loader:'ts'},
    bundle:true,write:false,format:'esm',platform:'node',
    plugins:[{name:'exact-deferent-clinical-history',setup(builder){
      builder.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
        const path=relative(root,args.path).replaceAll('\\','/');
        assert(!path.startsWith('../'));
        if(path.startsWith('node_modules/'))return;
        return {contents:execFileSync('git',['show',commit+':'+path],{cwd:root,encoding:'utf8',maxBuffer:16e6}),loader:{'.ts':'ts','.tsx':'tsx','.json':'json'}[extname(path)]||'js',resolveDir:dirname(args.path)};
      });
    }}],
  });
  return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

export async function exactDeferentClinicalHistory(catalog){
  const [before,after]=await Promise.all([historicalApi(deferentBaselineCommit),historicalApi(deferentTransitionCommit)]);
  assert.deepEqual(after.bodyDisplayCatalog(catalog),before.bodyDisplayCatalog(catalog),'Historical deferent source catalog changed during transition');
  return {before,after};
}
