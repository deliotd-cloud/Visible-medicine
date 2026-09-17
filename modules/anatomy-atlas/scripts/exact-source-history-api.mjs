// Test-only Git replay. Every application import comes from the named commit.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {relative,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function exactSourceHistoryApi(commit){
 assert(/^[a-f0-9]{40}$/.test(commit));
 assert.equal(execFileSync('git',['rev-parse',commit+'^{commit}'],{cwd:root,encoding:'utf8'}).trim(),commit);
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-application-git-replay',setup(b){b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;
  assert(!path.startsWith('../'));return {contents:execFileSync('git',['show',commit+':'+path],{cwd:root,encoding:'utf8',maxBuffer:16e6}),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
 });}}]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
