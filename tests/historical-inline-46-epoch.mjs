import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {transformSync} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fixtureBytes=fs.readFileSync(new URL('./fixtures/historical-inline-46-epoch.json',import.meta.url));
assert.equal(sha(fixtureBytes),'75281702b12599ee02c2d15c2996bea149062a4ad509040baf381eb1d190c9c3','Epoch46 fixture changed');
const fixture=JSON.parse(fixtureBytes);
assert.equal(fixture.schema,'vm-inline-recovery-46-1');
assert.equal(fixture.source,'3e66d2a7cb1807f792929cbe292a4cfc81e4e79e');
assert.equal(fixture.sourceTree,'19f3e1e58a2ff8fe479352bccbad8a487bf14f8a');
assert.equal(fixture.reviewIntegration,'90b0ca07cf68301d77ac390abbc922c8eb898d5f2f690fd71f20f8c5ee118620');
assert.equal(fixture.reviewSourceFiles,1519);
assert.equal(fixture.originalTestSha256,'12535c4d4c477fe886a0b68af89ba52234fc8420f1c6d8cc3523d0e318dff78e');
assert.equal(fixture.reviewInputCount,1648);
const records=new Map();
for(const row of fixture.records){
 assert(!records.has(row.path),'Duplicate epoch46 record: '+row.path);
 const bytes=zlib.gunzipSync(Buffer.from(row.gzipBase64,'base64'));
 assert.equal(sha(bytes),row.sha256,'Corrupt epoch46 record: '+row.path);
 records.set(row.path,bytes);
}
assert.equal(records.size,1667);
const relativePath=input=>{
 const absolute=input instanceof URL?fileURLToPath(input):path.resolve(root,input);
 const relative=path.relative(root,absolute).replaceAll('\\','/');
 assert(relative&&!relative.startsWith('../')&&!path.isAbsolute(relative),'Historical read escaped source: '+absolute);
 return relative;
};
/** All bound epoch46 inputs and support files must exist as archived bytes. */
export function historicalInline46Read(relative){
 assert.equal(relativePath(relative),relative,'Noncanonical historical path: '+relative);
 const bytes=records.get(relative);
 assert(bytes,'Missing epoch46 archive: '+relative);
 return Buffer.from(bytes);
}
const historicalRead=(input,options)=>{
 const bytes=historicalInline46Read(relativePath(input));
 return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;
};
const frozenModule=(relative,load)=>{
 const url=pathToFileURL(path.join(root,relative)).href;
 const code=transformSync(historicalInline46Read(relative).toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(url)}}).code;
 const module={exports:{}};
 new Function('require','module','exports',code)(load??createRequire(url),module,module.exports);
 return module.exports;
};
const checklistRelative='scripts/refresh-completion-checklist.mjs';
const {renderChecklist,validateChecklist}=frozenModule(checklistRelative);
const validatorRelative='tests/current-atlas-delivery.mjs';
const validatorUrl=pathToFileURL(path.join(root,validatorRelative)).href;
const validatorRequire=createRequire(validatorUrl);
const validatorModule=frozenModule(validatorRelative,name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./atlas-source-repo.mjs'?{checkedAtlasSourceRepo:()=>{throw Error('Historical source repository access is unavailable')}}:validatorRequire(name));
const frozenValidate=validatorModule.validateCurrentAtlasDelivery;

/** Register the unchanged original test against its closed source epoch. */
export async function runFrozenInline46Epoch(wrapperUrl){
 const pin=JSON.parse(historicalInline46Read('tests/fixtures/current-atlas-delivery.json'));
 assert.equal(pin.source,fixture.source);
 assert.equal(pin.sourceTree,fixture.sourceTree);
 assert.equal(pin.reviewIntegration,fixture.reviewIntegration);
 assert.equal(pin.reviewSourceFiles,fixture.reviewSourceFiles);
 assert.deepEqual(Object.keys(fixture.documents).sort(),[...Object.keys(pin.documents),'docs/completion-checklist.json','docs/completion-checklist.md'].sort());
 for(const [relative,digest] of Object.entries(fixture.documents))assert.equal(sha(historicalInline46Read(relative)),digest,'Historical document changed: '+relative);
 const checklist=JSON.parse(historicalInline46Read('docs/completion-checklist.json'));
 assert.equal(checklist.revision,46);
 assert.equal(checklist.items.length,71);
 assert.equal(checklist.items.filter(item=>item.scope==='optional').length,8);
 assert.equal(checklist.baseline.reviewIntegration,fixture.reviewIntegration);
 const inputs=JSON.parse(historicalInline46Read('atlas-review/integration-inputs.json'));
 assert.equal(inputs.sourceCommit,fixture.source);
 assert.equal(inputs.sha256,fixture.reviewIntegration);
 assert.equal(sha(JSON.stringify(inputs.inputs)),fixture.reviewIntegration);
 assert.equal(inputs.inputs.length,fixture.reviewInputCount);
 assert.equal(new Set(inputs.inputs.map(row=>row.path)).size,fixture.reviewInputCount);
 for(const row of inputs.inputs)assert.equal(sha(historicalInline46Read(row.path)),row.sha256,'Historical Review input changed: '+row.path);
 const original=historicalInline46Read('tests/inline-recovery-register.test.mjs');
 assert.equal(sha(original),fixture.originalTestSha256);
 const {historicalInline45Read}=await import('./historical-inline-45-epoch.mjs');
 const code=transformSync(original.toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(wrapperUrl)}}).code;
 const require=createRequire(wrapperUrl),module={exports:{}};
 const validateCurrentAtlasDelivery=(options={})=>frozenValidate({...options,pin:options.pin??pin,read:options.read??historicalInline46Read});
 const load=name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./historical-inline-45-epoch.mjs'?{historicalInline45Read}:name==='./current-atlas-delivery.mjs'?{validateCurrentAtlasDelivery}:name==='../scripts/refresh-completion-checklist.mjs'?{renderChecklist,validateChecklist}:require(name);
 new Function('require','module','exports',code)(load,module,module.exports);
}
