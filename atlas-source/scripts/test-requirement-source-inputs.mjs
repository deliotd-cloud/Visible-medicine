import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compiledRequirementSourcePaths} from './requirement-source-inputs.mjs';
import {build} from './workspace-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),entry='requirements-audit-entry.ts';
const metadata=paths=>({inputs:Object.fromEntries([...paths.map(p=>['workspace-test:'+path.resolve(root,p),{}]),[entry,{}]])});
test('compiled project inputs remain portable, ordered and separate from installed-library classification',()=>{
 const input=metadata(['lib/corpus-imaging.ts','content/corpus-imaging.ts','node_modules/three/build/three.module.js']);
 assert.deepEqual(compiledRequirementSourcePaths(input,root),['content/corpus-imaging.ts','lib/corpus-imaging.ts']);
});
test('unknown virtual entries, foreign roots and malformed compiler metadata refuse',()=>{
 for(const input of [undefined,{}, {inputs:[]}, {inputs:{}}, {inputs:{[entry]:{}}}, {inputs:{'foreign:source.ts':{},[entry]:{}}}, {inputs:{'workspace-test:relative.ts':{},[entry]:{}}}, metadata(['../outside.ts'])])assert.throws(()=>compiledRequirementSourcePaths(input,root));
 const input=metadata(['lib/corpus-imaging.ts']);input.inputs['unexpected-entry.ts']={};assert.throws(()=>compiledRequirementSourcePaths(input,root));
});
test('JSON import attributes name one physical source and unsupported attributes refuse',()=>{
 const absolute=path.resolve(root,'content/source.json'),base='workspace-test:'+absolute,typed=base+" with { type: 'json' }";
 assert.deepEqual(compiledRequirementSourcePaths({inputs:{[entry]:{},[base]:{},[typed]:{with:{type:'json'}}}},root),['content/source.json']);
 assert.deepEqual(compiledRequirementSourcePaths({inputs:{[entry]:{},[base]:{with:{type:'json'}}}},root),['content/source.json']);
 for(const inputs of [{[typed]:{}},{[base+" with { type: 'css' }"]:{with:{type:'json'}}},{[typed]:{with:{type:'css'}}},{[typed]:{with:{type:'json',foreign:'x'}}}])assert.throws(()=>compiledRequirementSourcePaths({inputs:{[entry]:{},...inputs}},root));
});
test('actual hermetic compiler exposes both source-bound CT helper and authored text',async()=>{
 const compiled=await build({stdin:{contents:"export {corpusImagingLesson} from './lib/corpus-imaging.ts';",sourcefile:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',metafile:true});
 const files=compiledRequirementSourcePaths(compiled.metafile,root);assert(files.includes('lib/corpus-imaging.ts'));assert(files.includes('content/corpus-imaging.ts'));assert(files.includes('content/corpus-imaging-pins.json'));assert(files.every(file=>!file.startsWith('node_modules/')));
});
test('actual typed and untyped JSON imports retain one physical source hash target',async()=>{
 const compiled=await build({stdin:{contents:"import plain from './public/models/bodyparts3d/full-body/catalog.json';import typed from './public/models/bodyparts3d/full-body/catalog.json' with {type:'json'};export {plain,typed};",sourcefile:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',metafile:true});
 assert.deepEqual(compiledRequirementSourcePaths(compiled.metafile,root),['public/models/bodyparts3d/full-body/catalog.json']);
});
test('generated inventory fingerprints actual CT source and its generator without changing approval scope',()=>{
 const report=JSON.parse(readFileSync(new URL('../docs/requirement-audit.json',import.meta.url))),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 for(const file of ['lib/corpus-imaging.ts','content/corpus-imaging.ts','content/corpus-imaging-pins.json','scripts/audit-requirements.mjs','scripts/requirement-source-inputs.mjs'])assert.equal(report.sourceHashes[file],sha(readFileSync(path.join(root,file))),file+' actual bytes');
 assert(report.sourceHashes['package-lock.json']);assert.equal(report.boundaries.clinicalValidation,false);assert.equal(report.review.hasPrivateReviews,false);
});
