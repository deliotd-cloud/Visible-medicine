// Test-only exact imported 9f epoch. Never resolves a missing module from current Website/Atlas.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative,dirname,isAbsolute,extname} from 'node:path';
import {build} from 'esbuild';

export const historicalGirdleRoot='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=readFileSync(historicalGirdleRoot+'/atlas-review/manifest.json');
assert.equal(sha(manifestBytes),'8647dbb18e0f5b9f568ce0d630ea66c5761f7de052cec1883e8c46b756050603');
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.revision,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
assert.equal(manifest.files.length,1495);
const files=new Map(manifest.files.map(row=>['atlas-review/'+row.path,row]));
assert.equal(files.size,1495);
const realRoot=realpathSync(historicalGirdleRoot);
export function readGirdleAdmissionImport(file){
 assert(typeof file==='string'&&file.startsWith('atlas-review/')&&!file.split('/').some(part=>!part||part==='.'||part==='..'));
 const row=files.get(file);assert(row,'Unrecorded historical imported dependency: '+file);
 const target=resolve(historicalGirdleRoot,file),resolved=realpathSync(target);
 assert(resolved.startsWith(realRoot+'/')||resolved.startsWith(realRoot+'\\'),'Historical file outside snapshot');
 const bytes=readFileSync(target);assert.equal(sha(bytes),row.importedSha256,'Historical imported bytes changed: '+file);return bytes;
}
export async function loadGirdleAdmissionImport(){
 for(const file of files.keys())readGirdleAdmissionImport(file);
 const compiled=await build({stdin:{contents:[
  "export {bodyReviewMaterial,bodyReviewSnapshot} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {girdleBoneUltrasoundLesson} from './atlas-review/lib/girdle-bone-ultrasound';",
 ].join('\n'),resolveDir:historicalGirdleRoot,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-girdle-imported-epoch',setup(api){
  api.onResolve({filter:/.*/},args=>{
   let target;
   if(args.path.startsWith('@/atlas-review/'))target=resolve(historicalGirdleRoot,args.path.slice(2));
   else{assert(args.path.startsWith('.')&&!isAbsolute(args.path),'No current or external application imports');target=resolve(args.resolveDir||historicalGirdleRoot,args.path);}
   const file=relative(historicalGirdleRoot,target).replaceAll('\\','/');assert(file.startsWith('atlas-review/'));
   for(const suffix of ['','.ts','.tsx','.json','.js','/index.ts'])if(files.has(file+suffix))return{path:resolve(historicalGirdleRoot,file+suffix),namespace:'girdle-import-history'};
   throw Error('Missing historical imported module: '+file);
  });
  api.onLoad({filter:/.*/,namespace:'girdle-import-history'},args=>{
   const file=relative(historicalGirdleRoot,args.path).replaceAll('\\','/');return{contents:readGirdleAdmissionImport(file).toString(),resolveDir:dirname(args.path),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(file)]||'js'};
  });
 }}]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
