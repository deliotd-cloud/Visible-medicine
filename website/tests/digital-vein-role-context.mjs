import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const websiteRoot=fileURLToPath(new URL('../',import.meta.url));
export const historicalRoot='F:/VisibleMedicine/staging/20261023-digital-vein-website/website';
const historicalAtlas='F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound/atlas';
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const read=(root,path)=>readFileSync(resolve(root,path));
export const json=(root,path)=>JSON.parse(read(root,path));
export const git=(root,...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const replaceOnce=(text,from,to)=>{assert.equal(text.split(from).length-1,1,'One explicit historical context seam: '+from);return text.replace(from,to);};

export function authenticateRows(root,rows){
 assert(Array.isArray(rows));assert.equal(new Set(rows.map(row=>row.path)).size,rows.length);
 for(const row of rows){assert(!row.path.includes(':')&&!row.path.includes('\\')&&!row.path.startsWith('/')&&!row.path.split('/').some(part=>!part||part==='.'||part==='..'),'Relative receipt path');
  const bytes=read(root,row.path);assert.equal(bytes.length,row.bytes,row.path);assert.equal(sha(bytes),row.sha256,row.path);}
}
export function authenticateDelivery(root,pin){
 for(const [path,digest] of Object.entries(pin.documents))assert.equal(sha(read(root,path)),digest,path);
 const review=json(root,'atlas-review/manifest.json'),inputs=json(root,'atlas-review/integration-inputs.json');
 assert.equal(review.revision,pin.source);assert.equal(inputs.sourceCommit,pin.source);
 assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);assert.equal(inputs.sha256,pin.reviewIntegration);
 assert.equal(sha(JSON.stringify(inputs.inputs)),pin.reviewIntegration);
 for(const row of review.files){const bytes=read(root,'atlas-review/'+row.path);assert.equal(sha(bytes),row.importedSha256,row.path);}
 for(const row of inputs.inputs){const bytes=read(root,row.path);assert.equal(sha(bytes),row.sha256,row.path);}
 for(const module of Object.keys(pin.runtimeSources)){
  const base='public/atlas-runtime/'+module+'/',manifest=json(root,base+'manifest.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);assert.equal(manifest.patientDataIncluded,false);
  for(const row of manifest.files)assert.equal(sha(read(root,base+row.path)),row.sha256,base+row.path);
 }
 const viewer=json(root,'public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,pin.source);assert.equal(viewer.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const row of viewer.files)assert.equal(sha(read(root,'public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
}

export async function replayHistoricalDigitalVein(){
 const receiptBytes=readFileSync('F:/VisibleMedicine/staging/20261023-digital-vein-website/SOURCE_BOUND.json');
 assert.equal(sha(receiptBytes),'9580e517bbb1637c602e7a79b8e289d55624e80c30713899e5e7c985f1303845');
 const receipt=JSON.parse(receiptBytes);assert.equal(receipt.website,historicalRoot);assert.equal(receipt.atlas,historicalAtlas);
 assert.equal(receipt.atlasHead,'ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f');
 assert.equal(receipt.atlasTree,'0305c15be5fb58ea7729a3849bbbdb6e1e40649d');
 assert.equal(receipt.sourceRows.length,6191);authenticateRows(historicalRoot,receipt.sourceRows);
 authenticateDelivery(historicalRoot,json(historicalRoot,'tests/fixtures/current-atlas-delivery.json'));
 const original=readFileSync(new URL('./fixtures/digital-vein-role-replay/original.mjs.raw',import.meta.url));
 assert.equal(sha(original),'b308e76aeafab40626557cfd08a1fa048cacf4cb643d2c7ecb5baf43d2357448');
 assert.deepEqual(original,read(historicalRoot,'tests/digital-vein-current-delivery.test.mjs'));
 let validator=read(historicalRoot,'tests/current-atlas-delivery.mjs').toString();
 assert.equal(sha(validator),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');
 let sourceLocator=read(historicalRoot,'tests/atlas-source-repo.mjs').toString();
 assert.equal(sha(sourceLocator),'45be52da6f2a93fdff2276235b357d6e491385af8a84ab8e0193905f6d49f356');
 const configuredSource="process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas'";
 assert.equal(sourceLocator.split(configuredSource).length-1,2,'Only two configured-source expressions');
 sourceLocator=sourceLocator.split(configuredSource).join(JSON.stringify(historicalAtlas));
 validator=replaceOnce(validator,"import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';",
  'import {checkedAtlasSourceRepo} from '+JSON.stringify(data(sourceLocator))+';');
 validator=replaceOnce(validator,"const websiteRoot=fileURLToPath(new URL('../',import.meta.url));",`const websiteRoot=${JSON.stringify(historicalRoot)};`);
 validator=replaceOnce(validator,"new URL('./fixtures/current-atlas-delivery.json',import.meta.url)",JSON.stringify(resolve(historicalRoot,'tests/fixtures/current-atlas-delivery.json')));
 const {transform}=createRequire(resolve(websiteRoot,'package.json'))('esbuild');
 const emitted=await transform(read(historicalRoot,'tests/atlas-emitted-teaching.ts'),{loader:'ts',format:'esm'});
 let replay=original.toString();
 replay=replaceOnce(replay,"from './current-atlas-delivery.mjs'",'from '+JSON.stringify(data(validator)));
 replay=replaceOnce(replay,"from './atlas-emitted-teaching.ts'",'from '+JSON.stringify(data(emitted.code)));
 replay=replaceOnce(replay,"const root=fileURLToPath(new URL('../',import.meta.url));",`const root=${JSON.stringify(historicalRoot)};`);
 // Only import/root seams change. All three theorem bodies, including the
 // complete 41-case inverse and every fixed hash, execute exactly as retained.
 replay=replaceOnce(replay,"import test from 'node:test';","import nodeTest from 'node:test';const test=(name,...args)=>nodeTest('historical ed3c8cc0: '+name,...args);");
 await import(data(replay));
}

export async function currentDigitalVeinApi(){
 const {build}=createRequire(resolve(websiteRoot,'package.json'))('esbuild');
 const entry=[
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {digitalVeinUltrasoundLesson} from './atlas-review/lib/digital-vein-ultrasound';",
  "export {digitalVeinUltrasoundTeaching} from './atlas-review/content/digital-vein-ultrasound';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {authorizeAtlasDelivery} from './lib/atlas-delivery-access';",
  "export {ATLAS_DELIVERY_POLICY} from './lib/atlas-delivery-policy';",
 ].join('');
 const result=await build({stdin:{contents:entry,resolveDir:websiteRoot,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import(data(result.outputFiles[0].contents));
}
