// Offline scope adapter for the original pulmonary-venous milestone checks.
// Today's renal X-ray/Review behavior is checked independently by renal-xray:test.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build as originalBuild} from './workspace-test-build.mjs';
import {contentContext as originalContext} from './content-contract-tools.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const parent='ce9dcce39fb088975bee2ec890730d1ee153d70f';
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,windowsHide:true,maxBuffer:16e6});
const sources=new Map(['content/abdominal-organ-imaging.ts','content/body-review-display-pins.json'].map(path=>{
 const source=git('show',parent+':'+path),oid=git('rev-parse',parent+':'+path).toString().trim();
 assert.equal(createHash('sha1').update(`blob ${source.length}\0`).update(source).digest('hex'),oid);
 return [root.replaceAll('\\','/')+path,{source,loader:path.endsWith('.json')?'json':'ts'}];
}));
const plugin={name:'exact-before-renal-xray-editorial-map-and-display-pins',setup(api){
 api.onLoad({filter:/[\\/]content[\\/](?:abdominal-organ-imaging\.ts|body-review-display-pins\.json)$/},args=>{
  const entry=sources.get(args.path.replaceAll('\\','/'));assert(entry,'Exact predecessor source path required');
  return {contents:entry.source.toString('utf8'),loader:entry.loader};
 });
}};
export const contentContext=()=>originalContext({plugins:[plugin]});
export const build=options=>originalBuild({...options,plugins:[plugin,...(options.plugins||[])]});
