import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {transformSync} from 'esbuild';
import {historicalInline46OrSupportRead as historicalInline46Read} from './historical-reference-read.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const fixturePath=path.join(root,'tests/fixtures/historical-inline-45-epoch.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fixtureBytes=fs.readFileSync(fixturePath);
assert.equal(sha(fixtureBytes),'6f64fd26f4608c813aeb9c08bb98e3c3293f593fd2675b4c27f39350c2f3ba8e');
const fixture=JSON.parse(fixtureBytes);
assert.equal(fixture.schema,'vm-inline-before-handshake-45-1');
assert.equal(fixture.source,'3e66d2a7cb1807f792929cbe292a4cfc81e4e79e');
assert.equal(fixture.sourceTree,'19f3e1e58a2ff8fe479352bccbad8a487bf14f8a');
assert.equal(fixture.reviewIntegration,'70422b6e71f95da050a42db33b8473e4b78cb25d0329c631c825ae95c68b796d');
assert.equal(fixture.reviewSourceFiles,1519);
const records=new Map(fixture.records.map(row=>[row.path,row]));
assert.equal(records.size,fixture.records.length);
const frozen=new Map();
for(const row of records.values()){
 const bytes=zlib.gunzipSync(Buffer.from(row.gzipBase64,'base64'));
 assert.equal(sha(bytes),row.sha256,'Frozen epoch45 record: '+row.path);
 frozen.set(row.path,bytes);
}
const relativePath=input=>{
 const absolute=input instanceof URL?fileURLToPath(input):path.resolve(root,input);
 const relative=path.relative(root,absolute).replaceAll('\\','/');
 assert(relative&&!relative.startsWith('../')&&!path.isAbsolute(relative),'Historical read escaped source: '+absolute);
 return relative;
};
/** Only archived bytes or live files with an exact original45 hash are admitted. */
export function historicalInline45Read(relative){
 assert.equal(relativePath(relative),relative,'Noncanonical historical path: '+relative);
 const record=records.get(relative);
 if(record)return Buffer.from(frozen.get(relative));
 const expected=fixture.fallbackInputs[relative]??fixture.extraFallback[relative];
 assert(expected,'Unarchived historical read: '+relative);
 const live=fs.readFileSync(path.join(root,relative));
 const bytes=sha(live)===expected?live:historicalInline46Read(relative);
 assert.equal(sha(bytes),expected,'Historical fallback changed: '+relative);
 return bytes;
}
const historicalRead=(input,options)=>{
 const bytes=historicalInline45Read(relativePath(input));
 return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;
};
const checklistUrl=pathToFileURL(path.join(root,'scripts/refresh-completion-checklist.mjs')).href;
const checklistCode=transformSync(historicalInline45Read('scripts/refresh-completion-checklist.mjs').toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(checklistUrl)}}).code;
const checklistModule={exports:{}};
new Function('require','module','exports',checklistCode)(createRequire(checklistUrl),checklistModule,checklistModule.exports);
const {renderChecklist,validateChecklist}=checklistModule.exports;
const sourceUrl=pathToFileURL(path.join(root,'tests/current-atlas-delivery.mjs')).href;
const validatorCode=transformSync(historicalInline45Read('tests/current-atlas-delivery.mjs').toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(sourceUrl)}}).code;
const validatorModule={exports:{}};
const validatorRequire=createRequire(sourceUrl);
new Function('require','module','exports',validatorCode)(name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./atlas-source-repo.mjs'?{checkedAtlasSourceRepo:()=>{throw Error('Historical source repository access is unavailable')}}:validatorRequire(name),validatorModule,validatorModule.exports);
export const historicalInline45ValidateCurrentAtlasDelivery=validatorModule.exports.validateCurrentAtlasDelivery;

/** Register all original45 assertions against the exact closed source epoch. */
export function runFrozenInline45Epoch(wrapperUrl){
 const pin=JSON.parse(historicalInline45Read('tests/fixtures/current-atlas-delivery.json'));
 assert.equal(pin.source,fixture.source);
 assert.equal(pin.sourceTree,fixture.sourceTree);
 assert.equal(pin.reviewIntegration,fixture.reviewIntegration);
 assert.equal(pin.reviewSourceFiles,fixture.reviewSourceFiles);
 const docs=[...Object.keys(pin.documents),'docs/completion-checklist.json','docs/completion-checklist.md'];
 assert.deepEqual(Object.keys(fixture.documents).sort(),docs.sort());
 for(const [relative,digest] of Object.entries(fixture.documents))assert.equal(sha(historicalInline45Read(relative)),digest,'Historical document changed: '+relative);
 const inputs=JSON.parse(historicalInline45Read('atlas-review/integration-inputs.json'));
 assert.equal(inputs.sourceCommit,fixture.source);
 assert.equal(inputs.sha256,fixture.reviewIntegration);
 assert.equal(sha(JSON.stringify(inputs.inputs)),fixture.reviewIntegration);
 assert.equal(inputs.inputs.length,1647);
 assert.deepEqual(Object.keys(fixture.fallbackInputs).sort(),inputs.inputs.filter(row=>!records.has(row.path)).map(row=>row.path).sort());
 for(const row of inputs.inputs)assert.equal(sha(historicalInline45Read(row.path)),row.sha256,'Historical Review input changed: '+row.path);
 const original=historicalInline45Read('tests/head-opening-register.test.mjs');
 assert.equal(sha(original),fixture.originalTestSha256);
 const code=transformSync(original.toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(wrapperUrl)}}).code;
 const require=createRequire(wrapperUrl),module={exports:{}};
 const validator=(options={})=>historicalInline45ValidateCurrentAtlasDelivery({...options,pin:options.pin??pin,read:options.read??historicalInline45Read});
 const load=name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./current-atlas-delivery.mjs'?{validateCurrentAtlasDelivery:validator}:name==='../scripts/refresh-completion-checklist.mjs'?{renderChecklist,validateChecklist}:require(name);
 new Function('require','module','exports',code)(load,module,module.exports);
}
