import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {transformSync} from 'esbuild';
import {historicalInline45Read} from './historical-inline-45-epoch.mjs';
import {historicalInline46OrSupportRead as historicalInline46Read} from './historical-reference-read.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const fixturePath=path.join(root,'tests/fixtures/historical-head-open-44-epoch.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fixtureBytes=fs.readFileSync(fixturePath);
assert.equal(sha(fixtureBytes),'4f4a57809c4693cd3e84816d82f6c9cc861ce2bc2d5e35d039955310f8adf1eb');
const fixture=JSON.parse(fixtureBytes);
assert.equal(fixture.schema,'vm-head-open-before-startup-44-1');
assert.equal(fixture.source,'3e66d2a7cb1807f792929cbe292a4cfc81e4e79e');
assert.equal(fixture.sourceTree,'19f3e1e58a2ff8fe479352bccbad8a487bf14f8a');
assert.equal(fixture.reviewIntegration,'89959e076120f6fc8e6cb845a8178d68730808833b4d42963895eeb833f94489');
const records=new Map(fixture.records.map(row=>[row.path,row]));
assert.equal(records.size,fixture.records.length);
const frozen=new Map();
for(const row of records.values()){
 const bytes=zlib.gunzipSync(Buffer.from(row.gzipBase64,'base64'));
 assert.equal(sha(bytes),row.sha256,'Frozen epoch44 record: '+row.path);
 frozen.set(row.path,bytes);
}
const relativePath=input=>{
 const absolute=input instanceof URL?fileURLToPath(input):path.resolve(root,input);
 const relative=path.relative(root,absolute).replaceAll('\\','/');
 assert(relative&&!relative.startsWith('../')&&!path.isAbsolute(relative),'Historical read escaped source: '+absolute);
 return relative;
};
const readPath=relative=>{
 const record=records.get(relative);
 if(record)return frozen.get(relative);
 const expected=fixture.fallbackInputs[relative];
 assert(expected,'Unarchived historical read: '+relative);
 const live=['components/HeadAtlasInlineComparison.tsx','components/HeadAtlasInlineComparisonLoader.tsx','components/head-atlas.css','scripts/bind-clinical-review.mjs'].includes(relative)?historicalInline45Read(relative):fs.readFileSync(path.join(root,relative));
 const bytes=sha(live)===expected?live:historicalInline46Read(relative);
 assert.equal(sha(bytes),expected,'Historical fallback changed: '+relative);
 return bytes;
};
const historicalRead=(input,options)=>{
 const bytes=readPath(relativePath(input));
 return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;
};
const checklistUrl=pathToFileURL(path.join(root,'scripts/refresh-completion-checklist.mjs')).href;
const checklistCode=transformSync(readPath('scripts/refresh-completion-checklist.mjs').toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(checklistUrl)}}).code;
const checklistModule={exports:{}};
new Function('require','module','exports',checklistCode)(createRequire(checklistUrl),checklistModule,checklistModule.exports);
const {renderChecklist,validateChecklist}=checklistModule.exports;
const sourceUrl=pathToFileURL(path.join(root,'tests/current-atlas-delivery.mjs')).href;
const validatorCode=transformSync(readPath('tests/current-atlas-delivery.mjs').toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(sourceUrl)}}).code;
const validatorModule={exports:{}};
const validatorRequire=createRequire(sourceUrl);
new Function('require','module','exports',validatorCode)(name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./atlas-source-repo.mjs'?{checkedAtlasSourceRepo:()=>{throw Error('Historical source repository access is unavailable')}}:validatorRequire(name),validatorModule,validatorModule.exports);
export const historicalHeadOpen44ValidateCurrentAtlasDelivery=validatorModule.exports.validateCurrentAtlasDelivery;

/** Execute the complete original register44 body against its exact closed epoch. */
export function runFrozenHeadOpen44Epoch(wrapperUrl){
 const pin=JSON.parse(readPath('tests/fixtures/current-atlas-delivery.json'));
 assert.equal(pin.source,fixture.source);
 assert.equal(pin.sourceTree,fixture.sourceTree);
 assert.equal(pin.reviewIntegration,fixture.reviewIntegration);
 assert.equal(pin.reviewSourceFiles,1519);
 const docs=[...Object.keys(pin.documents),'docs/completion-checklist.json','docs/completion-checklist.md'];
 assert.deepEqual(Object.keys(fixture.documents).sort(),docs.sort());
 for(const [relative,digest] of Object.entries(fixture.documents))assert.equal(sha(readPath(relative)),digest,'Historical document changed: '+relative);
 const inputs=JSON.parse(readPath('atlas-review/integration-inputs.json'));
 assert.equal(inputs.sourceCommit,fixture.source);
 assert.equal(inputs.sha256,fixture.reviewIntegration);
 assert.equal(sha(JSON.stringify(inputs.inputs)),fixture.reviewIntegration);
 assert.equal(inputs.inputs.length,1647);
 assert.deepEqual(Object.keys(fixture.fallbackInputs).sort(),inputs.inputs.filter(row=>!records.has(row.path)).map(row=>row.path).sort());
 for(const row of inputs.inputs)assert.equal(sha(readPath(row.path)),row.sha256,'Historical Review input changed: '+row.path);
 const original=readPath('tests/head-model-entry-register.test.mjs');
 assert.equal(sha(original),fixture.originalTestSha256);
 const code=transformSync(original.toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(wrapperUrl)}}).code;
 const require=createRequire(wrapperUrl),module={exports:{}};
 const validator=(options={})=>historicalHeadOpen44ValidateCurrentAtlasDelivery({...options,pin:options.pin??pin,read:options.read??readPath});
 const load=name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./current-atlas-delivery.mjs'?{validateCurrentAtlasDelivery:validator}:name==='../scripts/refresh-completion-checklist.mjs'?{renderChecklist,validateChecklist}:require(name);
 new Function('require','module','exports',code)(load,module,module.exports);
}
