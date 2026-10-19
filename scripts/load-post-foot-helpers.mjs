// Test-only helper bundle for exact historical contracts.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(root+'/content/post-foot-author-history/helper-manifest.json'));
assert.equal(createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),'31a349e787357d1f090db16f39d24902b5ca2862bf1fb568d15fccdb8d0b8098','Historical helper manifest changed');
export async function loadPostFootHelpers(){
 const code=Object.entries(manifest).map(([helper,file])=>{
  assert(/^lib\/[a-z0-9-]+\.ts$/.test(file),'Historical helper path changed');
  const body=readFileSync(root+'/'+file,'utf8');
  assert(new RegExp('export\\s+(?:function|const)\\s+'+helper+'\\b').test(body),'Historical helper declaration changed');
  return `export {${helper}} from './${file}';`;
 }).join('\n');
 const compiled=await build({stdin:{contents:code,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api).sort(),Object.keys(manifest).sort());
 return api;
}
