import test from 'node:test';
import {runTeachingOriginalRole} from './atlas-teaching-original-roles.mjs';

for(const role of ['nested-focus','queue-initial','queue-feature','respiratory-original'])
 test(`whole unchanged ${role} proof executes in its original worktree`,async()=>{
  await runTeachingOriginalRole(role);
 });
