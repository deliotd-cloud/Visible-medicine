import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {transformSync} from 'esbuild';
import {renderChecklist,validateChecklist} from '../scripts/refresh-completion-checklist.mjs';
import {historicalInline45Read} from './historical-inline-45-epoch.mjs';
import {historicalInline46OrSupportRead as historicalInline46Read} from './historical-reference-read.mjs';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const fixturePath=path.join(root,'tests/fixtures/historical-navigation-43-epoch.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fixtureBytes=fs.readFileSync(fixturePath);
assert.equal(sha(fixtureBytes),'9bbf527a46d9f435b2073941e8adeffb8485dbb66a80dbc4ee4978476f24f838');
const fixture=JSON.parse(fixtureBytes);
assert.equal(fixture.schema,'vm-navigation-before-iframe-43-1');
assert.equal(fixture.source,'3e66d2a7cb1807f792929cbe292a4cfc81e4e79e');
assert.equal(fixture.reviewIntegration,'1b9b10d0d60b9c29ac11bfe0674d860c5949c7543fc496c66022d7572dd340b5');
const records=new Map(fixture.records.map(row=>[row.path,row]));
assert.equal(records.size,fixture.records.length);
const frozen=new Map();
for(const row of records.values()){
 const bytes=zlib.gunzipSync(Buffer.from(row.gzipBase64,'base64'));
 assert.equal(sha(bytes),row.sha256,'Frozen epoch43 record: '+row.path);
 frozen.set(row.path,bytes);
}
const relativePath=input=>{
 const absolute=input instanceof URL?fileURLToPath(input):path.resolve(root,input);
 const relative=path.relative(root,absolute).replaceAll('\\','/');
 assert(relative&&!relative.startsWith('../')&&!path.isAbsolute(relative),'Historical read escaped source: '+absolute);
 return relative;
};
const readPath=relative=>frozen.get(relative)??(['components/HeadAtlasInlineComparison.tsx','components/HeadAtlasInlineComparisonLoader.tsx','components/head-atlas.css','scripts/bind-clinical-review.mjs'].includes(relative)?historicalInline45Read(relative):historicalInline46Read(relative));
export function frozenNavigation43Bytes(relative){
 assert.equal(relative,'components/HeadAtlasViewer.tsx');
 return Buffer.from(frozen.get(relative));
}
const historicalRead=(input,options)=>{
 const bytes=readPath(relativePath(input));
 return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;
};
assert.equal(sha(fs.readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),
 'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Exact frozen historical schema1 validator');
export function historicalNavigation43ValidateCurrentAtlasDelivery(options={}){
 const pin=options.pin??JSON.parse(readPath('tests/fixtures/current-atlas-delivery.json'));
 return validateHistoricalAtlasDelivery({...options,pin,read:options.read??readPath});
}

/** Execute the exact original register43 node:test body against its closed source epoch. */
export function runFrozenNavigation43Epoch(wrapperUrl){
 const pin=JSON.parse(readPath('tests/fixtures/current-atlas-delivery.json'));
 assert.equal(pin.source,fixture.source);
 assert.equal(pin.reviewIntegration,fixture.reviewIntegration);
 const docs=[...Object.keys(pin.documents),'docs/completion-checklist.json','docs/completion-checklist.md'];
 assert.deepEqual(Object.keys(fixture.documents).sort(),docs.sort());
 for(const [relative,digest] of Object.entries(fixture.documents))assert.equal(sha(readPath(relative)),digest,'Historical document changed: '+relative);
 const inputs=JSON.parse(readPath('atlas-review/integration-inputs.json'));
 assert.equal(inputs.sourceCommit,fixture.source);
 assert.equal(inputs.sha256,fixture.reviewIntegration);
 assert.equal(sha(JSON.stringify(inputs.inputs)),fixture.reviewIntegration);
 assert.equal(inputs.inputs.length,1647);
 for(const row of inputs.inputs)assert.equal(sha(readPath(row.path)),row.sha256,'Historical Review input changed: '+row.path);
 const original=readPath('tests/salpingopharyngeus-integration-register.test.mjs');
 assert.equal(sha(original),fixture.originalTestSha256);
 const code=transformSync(original.toString(),{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(wrapperUrl)}}).code;
 const require=createRequire(wrapperUrl),module={exports:{}};
 const validator=(options={})=>historicalNavigation43ValidateCurrentAtlasDelivery({...options,pin:options.pin??pin,read:options.read??readPath});
 const load=name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./current-atlas-delivery.mjs'?{validateCurrentAtlasDelivery:validator}:name==='../scripts/refresh-completion-checklist.mjs'?{renderChecklist,validateChecklist}:require(name);
 new Function('require','module','exports',code)(load,module,module.exports);
}
