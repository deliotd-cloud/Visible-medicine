import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const json=p=>JSON.parse(readFileSync(p)),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function bodies(source){const ast=ts.createSourceFile('test.ts',source,ts.ScriptTarget.Latest,true),out=[];function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(ast)==='test')out.push(n.getText(ast));ts.forEachChild(n,visit);}visit(ast);return out;}

test('all original lecture test bodies and exact source bytes remain preserved after harness-only integration',()=>{
 const archive='tests/fixtures/lineage-legacy-before-20261016',manifest=json(archive+'/manifest.json');
 assert.equal(manifest.schema,'vm-lineage-legacy-frozen-1');assert.equal(manifest.records.length,4);let cases=0;
 for(const f of manifest.records){assert(f.frozenPath.startsWith(archive+'/')&&f.frozenPath.endsWith('.txt'));const bytes=readFileSync(f.frozenPath);assert.equal(sha(bytes),f.sha256);assert.deepEqual(bodies(readFileSync(f.path,'utf8')),bodies(bytes.toString()));assert.equal(bodies(bytes.toString()).length,f.testCases);cases+=f.testCases;}
 assert.equal(cases,40);
});
test('Studio lineage uses the separately pinned current Atlas delivery without altering its source',()=>{
 const pin=validateCurrentAtlasDelivery(),root=currentAtlasDeliveryRoot();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(pin.source,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');
 assert.equal(pin.sourceTree,'de883b9d6bccb3b4403256e42fabc7471e0ea8c9');
 assert.equal(pin.reviewIntegration,'245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37');
 assert.equal(pin.reviewSourceFiles,1520);
 assert.equal(typeof root,'string');assert(root.length>0);
});
