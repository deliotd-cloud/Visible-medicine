// Test-only immutable forearm import epoch. Never falls back to current source.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative,dirname,isAbsolute,extname} from 'node:path';
import {build} from 'esbuild';
const root='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const FOREARM_IMPORTED_SOURCE='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const bytes=readFileSync(root+'/atlas-review/manifest.json');
assert.equal(sha(bytes),'8647dbb18e0f5b9f568ce0d630ea66c5761f7de052cec1883e8c46b756050603');
const manifest=JSON.parse(bytes);
assert.equal(manifest.revision,FOREARM_IMPORTED_SOURCE);assert.equal(manifest.files.length,1495);
const files=new Map(manifest.files.map(row=>['atlas-review/'+row.path,row]));
assert.equal(files.size,1495);
export function readForearmAdmissionImport(file){
 assert(typeof file==='string'&&file.startsWith('atlas-review/')&&!file.split('/').some(part=>!part||part==='.'||part==='..'));
 const row=files.get(file);assert(row,'Unrecorded historical imported dependency: '+file);
 const target=resolve(root,file),resolved=realpathSync(target);
 assert(resolved.startsWith(realpathSync(root)+'/')||resolved.startsWith(realpathSync(root)+'\\'),'Historical file outside snapshot');
 const bytes=readFileSync(target);assert.equal(sha(bytes),row.importedSha256,'Historical imported bytes changed: '+file);return bytes;
}
export async function loadForearmAdmissionImport(){
 // Verify the complete original import, not just the entry's text.
 for(const file of files.keys())readForearmAdmissionImport(file);
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {forearmVascularXrayLesson} from './atlas-review/lib/forearm-vascular-xray';",
  "export {forearmVascularXrayReferences,forearmVascularXrayTeaching,forearmVascularXrayNote} from './atlas-review/content/forearm-vascular-xray';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
 ].join('\n'),resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-forearm-imported-epoch',setup(api){
  api.onResolve({filter:/.*/},args=>{
   let target;
   if(args.path.startsWith('@/atlas-review/'))target=resolve(root,args.path.slice(2));
   else{assert(args.path.startsWith('.')&&!isAbsolute(args.path),'No current or external application imports');target=resolve(args.resolveDir||root,args.path);}
   const file=relative(root,target).replaceAll('\\','/');assert(file.startsWith('atlas-review/'));
   for(const suffix of ['','.ts','.tsx','.json','.js','/index.ts'])if(files.has(file+suffix))return{path:resolve(root,file+suffix),namespace:'forearm-import-history'};
   throw Error('Missing historical imported module: '+file);
  });
  api.onLoad({filter:/.*/,namespace:'forearm-import-history'},args=>{
   const file=relative(root,args.path).replaceAll('\\','/');return{contents:readForearmAdmissionImport(file).toString(),resolveDir:dirname(args.path),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(file)]||'js'};
  });
 }}]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
