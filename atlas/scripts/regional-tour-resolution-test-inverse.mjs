import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const proposedRegistrySha='c41ed833cdfac7ca925023221298bcdd3c57e46030121c61db27437259c968d7';
const originalRegistrySha='b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d';
const originalScriptSha='faec9235a9b0d8ea716eda7daafb912449a0c546cca8b8d636db115eb8248c7f';

function replaceOnce(text,current,previous,label){
  assert.equal(text.split(current).length,2,`${label}: inverse must be unique`);
  return text.replace(current,previous);
}

/** Remove only the reviewed c41 frame/evidence reuse edits before the closed 2381 inverse. */
export function restoreRegionalTourResolution(currentRegistry){
  assert.equal(digest(currentRegistry),proposedRegistrySha,'The reviewed registry input must be exact');
  const original=readFileSync(new URL('./fixtures/regional-tours-original.ts.raw',import.meta.url));
  assert.equal(digest(original),originalRegistrySha,'The first-party registry fixture must be exact');
  let inverse=currentRegistry;
  inverse=replaceOnce(inverse,
    'function frameFromResolvedStructures(tour:RegionalTour,structures:BodyStructure[],index?:number) {',
    'export function regionalTourFrame(catalog:BodyCatalog,tour:RegionalTour,index?:number) {\n  const structures=regionalTourStructures(catalog,tour);',
    'frame helper header');
  inverse=replaceOnce(inverse,
    'export function regionalTourFrame(catalog:BodyCatalog,tour:RegionalTour,index?:number) {\n  return frameFromResolvedStructures(tour,regionalTourStructures(catalog,tour),index);\n}\n/** Admit the exact source once for one learner evaluation. Never retain this result. */\nexport function regionalTourResolvedFrames(catalog:BodyCatalog,tour:RegionalTour) {\n  const structures=regionalTourStructures(catalog,tour);\n  return {structures,frames:tour.steps.map((_,index)=>frameFromResolvedStructures(tour,structures,index))};\n}\n',
    '', 'new frame and batch exports');
  inverse=replaceOnce(inverse,
    'tour.steps.some(s=>s.frameIds)?regionalTourResolvedFrames(catalog,tour).frames:undefined;',
    'tour.steps.some(s=>s.frameIds)?tour.steps.map((_,i)=>regionalTourFrame(catalog,tour,i)):undefined;',
    'optional step frames');
  inverse=replaceOnce(inverse,
    'coordinateSystem:catalog.coordinateSystem,sourceVersion:catalog.sourceVersion,frame:frameFromResolvedStructures(tour,structures),',
    'coordinateSystem:catalog.coordinateSystem,sourceVersion:catalog.sourceVersion,frame:regionalTourFrame(catalog,tour),',
    'evidence overview');
  inverse=replaceOnce(inverse,
    '...(tour.steps.some(s=>s.frameIds)?{stepFrames:tour.steps.map((_,index)=>frameFromResolvedStructures(tour,structures,index))}:{})',
    '...(tour.steps.some(s=>s.frameIds)?{stepFrames:regionalTourStepFrames(catalog,tour)}:{})',
    'evidence step frames');
  assert.deepEqual(Buffer.from(inverse,'utf8'),original,'Only the reviewed performance edits may be inverted');
  return inverse;
}

/** Prove the adapted test is exactly the original faec source plus three insertions. */
export function assertWholeBodyTestInverse(currentTest){
  const original=readFileSync(new URL('./fixtures/test-whole-body-guided-learning-original.mjs.raw',import.meta.url));
  assert.equal(digest(original),originalScriptSha,'The first-party whole-body fixture must be exact');
  let inverse=currentTest;
  inverse=replaceOnce(inverse,
    "import {restoreRegionalTourResolution,assertWholeBodyTestInverse} from './regional-tour-resolution-test-inverse.mjs';\n",
    '', 'test helper import');
  inverse=replaceOnce(inverse,
    'assertWholeBodyTestInverse(readFileSync(new URL(import.meta.url),\'utf8\'));\n',
    '', 'self-inverse guard');
  inverse=replaceOnce(inverse,
    'let inverse=restoreRegionalTourResolution(currentRegistry);',
    'let inverse=currentRegistry;',
    'reviewed registry inverse call');
  assert.deepEqual(Buffer.from(inverse,'utf8'),original,'Every original theorem and history input must remain byte-exact');
}
