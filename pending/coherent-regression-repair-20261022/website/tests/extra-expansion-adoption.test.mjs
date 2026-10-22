import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {expansionImport,expansionMap,migrationBlock,migrationRefusal,verifyExtraExpansionSources} from './extra-expansion-adoption-source-proof.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');

test('nonhead and shoulder SSR adopt the actual expansion dependency while all original sources survive',()=>{
 assert.equal(verifyExtraExpansionSources(read).wholeOriginalSources,3);
});

test('additional real-frame consumers reject missing, duplicated, substituted dependencies and altered old assertions',()=>{
 for(const name of ['atlas-nonhead-comparison-ui.test.mjs','atlas-shoulder-navigation-current.test.mjs']){
  const source=read(name);
  for(const changed of [source.replace(expansionImport,''),source+expansionMap,
   source.replace(expansionMap,"  './atlas-runtime-expansion':{},\n"),
   source.replace('assert.equal(', 'assert.notEqual('),
  ]){
   assert.notEqual(changed,source,'Each refusal must actually mutate the source');
   assert.throws(()=>verifyExtraExpansionSources(path=>path===name?changed:read(path)));
  }
 }
});

test('nonhead preservation keeps its original whole-source proof and the new dependency refusals',()=>{
 const name='nonhead-frame-migration.test.mjs',source=read(name);
 for(const changed of [source.replace(migrationBlock,''),source+migrationBlock,source.replace(migrationRefusal,''),
  source.replace('stripLiveLearningLoader(stripExpansionLoader(candidate))','stripLiveLearningLoader(candidate)'),
  source.replace("assert.equal(original.sha256,expectedSha)","assert.notEqual(original.sha256,expectedSha)"),
 ]){
  assert.notEqual(changed,source);
  assert.throws(()=>verifyExtraExpansionSources(path=>path===name?changed:read(path)));
 }
});
