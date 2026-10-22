import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {transformSync} from 'esbuild';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';
import {historicalInline45Read} from './historical-inline-45-epoch.mjs';
import {historicalInline46OrSupportRead as historicalInline46Read} from './historical-reference-read.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base='tests/fixtures/head-masks-before-resource-budget/';
const read=p=>fs.readFileSync(path.join(root,p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
/** Execute unchanged41/a058 contracts against their exact closed source epoch. */
export function runFrozenHeadMaskEpoch(sourcePath,wrapperUrl){
 assert(['tests/head-comparison-renderer-revision.test.mjs','tests/clinical-review-inbox-navigation-revision.test.mjs'].includes(sourcePath));
 assert.equal(sha(read(base+'manifest.json')),'94ad4edb5fd6dfab31b6fe973f84431a85da7e1605eb676b99b611a8b1f2bc3e');
 const manifest=JSON.parse(read(base+'manifest.json')),records=new Map(manifest.records.map(row=>[row.path,row]));assert.equal(records.size,20);
 for(const row of records.values())assert.equal(sha(read(row.frozenPath)),row.sha256,row.path);
 const historicalRead=(input,options)=>{
  const absolute=input instanceof URL?fileURLToPath(input):path.resolve(root,input);
  const relative=path.relative(root,absolute).replaceAll('\\','/');assert(!relative.startsWith('../')&&!path.isAbsolute(relative));
  const record=records.get(relative),bytes=record?read(record.frozenPath):['components/HeadAtlasInlineComparison.tsx','components/HeadAtlasInlineComparisonLoader.tsx','components/head-atlas.css','scripts/bind-clinical-review.mjs'].includes(relative)?historicalInline45Read(relative):historicalInline46Read(relative);
  return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;
 };
 const readPath=p=>historicalRead(path.join(root,p));
 assert.equal(sha(fs.readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Frozen schema1 validator changed');
 const pin=JSON.parse(readPath('tests/fixtures/current-atlas-delivery.json'));
 assert.equal(pin.reviewIntegration,'a058b135f294162091ea270d97c81d00bb5c73492b5095cf0cb12e6d316d3808');
 const inputs=JSON.parse(readPath('atlas-review/integration-inputs.json'));
 for(const row of inputs.inputs)assert.equal(sha(readPath(row.path)),row.sha256,'Closed historical renderer input: '+row.path);
 const original=read(records.get(sourcePath).frozenPath).toString();
 const code=transformSync(original,{format:'cjs',platform:'node',target:'es2022',define:{'import.meta.url':JSON.stringify(wrapperUrl)}}).code;
 const require=createRequire(wrapperUrl),module={exports:{}};
 const load=name=>name==='node:fs'?{...fs,readFileSync:historicalRead}:name==='./current-atlas-delivery.mjs'?{validateCurrentAtlasDelivery:(options={})=>validateHistoricalAtlasDelivery({...options,pin:options.pin??pin,read:readPath})}:require(name);
 new Function('require','module','exports',code)(load,module,module.exports);
}
