import test from 'node:test';
import {runTeachingOriginalRole} from './atlas-teaching-original-roles.mjs';

for(const role of ['nested-focus','queue-initial','queue-feature','respiratory-original'])
 test(`whole unchanged ${role} proof executes in its original worktree`,async()=>{
  await runTeachingOriginalRole(role);
 });

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {authenticatedTeachingNativeRoot,authenticatedTeachingOriginalRoot,authenticatedRespiratoryAliasRead} from './atlas-teaching-original-roles.mjs';

test('teaching originals require a separate exact native epoch, never the current Atlas fallback',()=>{
 const original=authenticatedTeachingNativeRoot();
 assert(path.isAbsolute(original));
 assert.throws(()=>authenticatedTeachingNativeRoot('relative/atlas'));
 assert.throws(()=>authenticatedTeachingNativeRoot(''));
 assert.throws(()=>authenticatedTeachingNativeRoot(process.env.VM_ATLAS_SOURCE_REPO));
});

test('respiratory legacy alias is accepted only for its exact immutable historical git read',()=>{
 const native=authenticatedTeachingNativeRoot(),website=authenticatedTeachingOriginalRoot('respiratory-original');
 const original=fs.readFileSync(path.join(website,'tests/atlas-respiratory-core-depth-checks.mjs'));
 assert.deepEqual(authenticatedRespiratoryAliasRead(original,native),{revision:'12570b5245dc6a253cbdd73ec4e044c58b81a927',tree:'a5ec4435cf81a68ecbebdefce11ac60a220b068d'});
 for(const changed of [Buffer.concat([original,Buffer.from('\n')]),Buffer.from(original.toString().replace('const sourceRevision =', 'const foreignRevision =')),Buffer.from(original.toString().replace("['show', `${sourceRevision}:${path}`]", "['show', `HEAD:${path}`]"))]){
  assert.throws(()=>authenticatedRespiratoryAliasRead(changed,native),'Any foreign edit or current-HEAD read must be refused');
 }
});
