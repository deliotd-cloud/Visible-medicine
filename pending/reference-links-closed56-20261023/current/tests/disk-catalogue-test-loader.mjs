// Same esbuild source contract as the catalogue root, without retaining a
// bundled output string AND a large base64 data-URL module in the Node heap.
// Generated evidence stays in a fresh ignored F-drive fixture; never publish it.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,mkdtemp,lstat,realpath,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function loadCatalogueTestBundle(contents,root=process.cwd()){
 assert.equal(typeof contents,'string');assert(path.isAbsolute(root));
 root=await realpath(root);assert((await lstat(root)).isDirectory());
 const local=path.join(root,'.local'),parent=path.join(local,'catalogue-source-bundles');
 for(const dir of [local,parent]){await mkdir(dir,{recursive:true});const info=await lstat(dir);assert(info.isDirectory()&&!info.isSymbolicLink(),'Regular fixture parent only');assert.equal((await realpath(dir)).toLowerCase(),path.resolve(dir).toLowerCase(),'No redirected fixture parent');}
 const dir=await mkdtemp(path.join(parent,'attempt-'));
 assert.equal(path.dirname(await realpath(dir)).toLowerCase(),parent.toLowerCase());
 const outfile=path.join(dir,'bundle.mjs');
 await build({stdin:{contents,resolveDir:root,loader:'ts'},bundle:true,write:true,
  outfile,platform:'node',format:'esm',sourcemap:false});
 const output=await lstat(outfile);assert(output.isFile()&&!output.isSymbolicLink());
 await writeFile(path.join(dir,'INPUT.json'),JSON.stringify({schema:'vm.catalogue-disk-test-bundle/1',sourceBytes:Buffer.byteLength(contents),outputBytes:(await stat(outfile)).size,write:true,platform:'node',format:'esm',sourceInputsOmitted:false,generatedEvidenceOnly:true},null,2)+'\n',{flag:'wx'});
 return import(pathToFileURL(outfile).href);
}
