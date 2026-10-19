import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {transformSync} from 'esbuild';
import {frozenNavigation43Bytes,historicalNavigation43ValidateCurrentAtlasDelivery} from './historical-navigation-43-epoch.mjs';
import {historicalInline45Read} from './historical-inline-45-epoch.mjs';
import {historicalInline46OrSupportRead as historicalInline46Read} from './historical-reference-read.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const base='tests/fixtures/head-masks-before-salpingopharyngeus/';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const live=relative=>fs.readFileSync(path.join(root,relative));
const archiveBytes=live(base+'manifest.json');
assert.equal(sha(archiveBytes),'a2fd6cfef5e02d3ea1038abf0ba163fa9bc416dae0a5c3adf025a71faf26e87b');
const archive=JSON.parse(archiveBytes);
assert.equal(archive.schema,'vm-head-masks-before-salpingopharyngeus-1');
assert.equal(archive.source,'0ac11ca2eb8effe47f2b6927f7987a9a36c7e3a2');
assert.equal(archive.reviewIntegration,'301707213f9c79bc07eb091870c616bf5f1d413511e19a7e1a2457c9db4581a6');
assert.equal(archive.inputs.length,1645);
const records=new Map(archive.records.map(row=>[row.path,row]));
assert.equal(records.size,archive.records.length);
for(const row of records.values()){
 assert(row.frozenPath.startsWith(base)&&row.frozenPath.endsWith('.txt'),row.path);
 assert.equal(sha(live(row.frozenPath)),row.sha256,row.path);
}
const relativePath=input=>{
 const absolute=input instanceof URL?fileURLToPath(input):path.resolve(root,input);
 const relative=path.relative(root,absolute).replaceAll('\\','/');
 assert(relative&&!relative.startsWith('../')&&!path.isAbsolute(relative),'Historical read escaped source: '+absolute);
 return relative;
};
const historicalRead=(input,options)=>{
 const relative=relativePath(input),record=records.get(relative);
 const bytes=record?live(record.frozenPath):relative==='components/HeadAtlasViewer.tsx'?frozenNavigation43Bytes(relative):['components/HeadAtlasInlineComparison.tsx','components/HeadAtlasInlineComparisonLoader.tsx','components/head-atlas.css','scripts/bind-clinical-review.mjs'].includes(relative)?historicalInline45Read(relative):historicalInline46Read(relative);
 return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;
};
const readPath=relative=>historicalRead(path.join(root,relative));
const pin=JSON.parse(readPath('tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,archive.source);
assert.equal(pin.reviewIntegration,archive.reviewIntegration);
assert.deepEqual(Object.keys(archive.documents).sort(),[...Object.keys(pin.documents),'docs/completion-checklist.json','docs/completion-checklist.md'].sort());
for(const [relative,digest]of Object.entries(archive.documents))assert.equal(sha(readPath(relative)),digest,'Historical document changed: '+relative);
for(const [relative,digest]of Object.entries(pin.documents))assert.equal(archive.documents[relative],digest,'Historical pin changed: '+relative);
const inputs=JSON.parse(readPath('atlas-review/integration-inputs.json'));
assert.equal(inputs.sourceCommit,archive.source);
assert.equal(inputs.sha256,archive.reviewIntegration);
assert.deepEqual(archive.inputs,inputs.inputs);
for(const row of archive.inputs)assert.equal(sha(readPath(row.path)),row.sha256,'Historical Review input changed: '+row.path);
assert.equal(sha(readPath('tests/head-mask-resource-binding.test.mjs')),'3aa1c35bc817e378d081d1e578890152f6d5f742d042bd726bb4dc52a7cbe49f');

const validator=(options={})=>historicalNavigation43ValidateCurrentAtlasDelivery({...options,pin:options.pin??pin,read:options.read??readPath});
const require=createRequire(import.meta.url);
const fsShim={...fs,readFileSync:historicalRead};
const moduleLoad=(source,sourceUrl,overrides={})=>{
 const code=transformSync(source,{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(sourceUrl)}}).code;
 const module={exports:{}};
 const load=name=>name==='node:fs'?fsShim:name==='./current-atlas-delivery.mjs'?{validateCurrentAtlasDelivery:validator}:overrides[name]??require(name);
 new Function('require','module','exports',code)(load,module,module.exports);
 return module.exports;
};

/** Run the exact register42 test, with its full node:test registrations. */
export function runFrozenHeadMask42Epoch(wrapperUrl){
 const source=readPath('tests/head-mask-resource-binding.test.mjs').toString();
 moduleLoad(source,wrapperUrl);
}

/** Run the unchanged register41 source and helper against its own 20-record archive. */
export function runFrozenHeadMask41Epoch(sourcePath,wrapperUrl){
 assert(['tests/head-comparison-renderer-revision.test.mjs','tests/clinical-review-inbox-navigation-revision.test.mjs'].includes(sourcePath));
 const helperPath='tests/historical-head-mask-epoch.mjs';
 const helperUrl=pathToFileURL(path.join(root,helperPath)).href;
 const helper=moduleLoad(readPath(helperPath).toString(),helperUrl);
 helper.runFrozenHeadMaskEpoch(sourcePath,wrapperUrl);
}
