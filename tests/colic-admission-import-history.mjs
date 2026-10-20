// Test-only immutable imported epoch. Never falls back to current source.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative,dirname,isAbsolute,extname} from 'node:path';
import {build} from 'esbuild';
const root='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const COLIC_IMPORTED_SOURCE='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const bytes=readFileSync(root+'/atlas-review/manifest.json');
assert.equal(sha(bytes),'8647dbb18e0f5b9f568ce0d630ea66c5761f7de052cec1883e8c46b756050603');
const manifest=JSON.parse(bytes);
assert.equal(manifest.revision,COLIC_IMPORTED_SOURCE);assert.equal(manifest.files.length,1495);
const files=new Map(manifest.files.map(row=>['atlas-review/'+row.path,row]));
assert.equal(files.size,1495);
export function readColicAdmissionImport(file){
 assert(typeof file==='string'&&file.startsWith('atlas-review/')&&!file.split('/').some(part=>!part||part==='.'||part==='..'));
 const row=files.get(file);assert(row,'Unrecorded historical imported dependency: '+file);
 const target=resolve(root,file),resolved=realpathSync(target);
 assert(resolved.startsWith(realpathSync(root)+'/')||resolved.startsWith(realpathSync(root)+'\\'),'Historical file outside snapshot');
 const bytes=readFileSync(target);assert.equal(sha(bytes),row.importedSha256,'Historical imported bytes changed: '+file);return bytes;
}
export async function loadColicAdmissionImport(){
 // Verify the complete original import, not just the entry's text.
 for(const file of files.keys())readColicAdmissionImport(file);
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-colic-imported-epoch',setup(api){
  api.onResolve({filter:/.*/},args=>{
   let target;
   if(args.path.startsWith('@/atlas-review/'))target=resolve(root,args.path.slice(2));
   else{assert(args.path.startsWith('.')&&!isAbsolute(args.path),'No current or external application imports');target=resolve(args.resolveDir||root,args.path);}
   const file=relative(root,target).replaceAll('\\','/');assert(file.startsWith('atlas-review/'));
   for(const suffix of ['','.ts','.tsx','.json','.js','/index.ts'])if(files.has(file+suffix))return{path:resolve(root,file+suffix),namespace:'colic-import-history'};
   throw Error('Missing historical imported module: '+file);
  });
  api.onLoad({filter:/.*/,namespace:'colic-import-history'},args=>{
   const file=relative(root,args.path).replaceAll('\\','/');return{contents:readColicAdmissionImport(file).toString(),resolveDir:dirname(args.path),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(file)]||'js'};
  });
 }}]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
