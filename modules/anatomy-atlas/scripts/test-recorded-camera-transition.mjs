import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assertRecordedGuidedCameraTransition as camera,assertRecordedTourPackageTransition as pkg} from './recorded-camera-transition.mjs';
const bases=['a10f1fd19c7dcf27470943f4775cb509f7da811f','a1f7f82d524f5c40e53151a2d4e36f29d8e85d0f'];
const bytes=readFileSync('app/fitted-camera.tsx'),packageBytes=readFileSync('package.json');
test('both original camera goldens admit only the independently saved three-line keyboard fix',()=>{
 for(const base of bases){const proof=camera(base,bytes);assert.equal(proof.base,base);assert.notEqual(proof.originalSha256,proof.acceptedSha256);}
});
test('camera rollback, extra edits, changed controls, line endings and foreign baselines fail closed',()=>{
 const variants=[Buffer.concat([bytes,Buffer.from('\n')]),Buffer.from(bytes.toString().replace('transition.current = null;','transition.current = undefined;')),Buffer.from(bytes.toString().replace('capture();','capture(); invalidate();')),Buffer.from(bytes.toString().replaceAll('\n','\r\n')),execFileSync('git',['show',bases[0]+':app/fitted-camera.tsx'],{windowsHide:true})];
 for(const base of bases)for(const mutant of variants)assert.throws(()=>camera(base,mutant));
 assert.throws(()=>camera('0'.repeat(40),bytes));assert.throws(()=>camera(bases[0],bytes.toString()));
});
test('recorded test-only package commands preserve original dependencies, engines and commands',()=>{
 const proof=pkg(bases[1],packageBytes);assert.equal(proof.addedTestCommands,14);assert.equal(proof.dependenciesChanged,false);
});
test('package dependency changes, command changes, missing additions and unknown baselines are refused',()=>{
 const original=JSON.parse(packageBytes),dependency=structuredClone(original);dependency.dependencies.three='0.0.0';
 const command=structuredClone(original);command.scripts.dev='echo unexpected';
 const missing=structuredClone(original);delete missing.scripts['lower-venous-tour:test'];
 for(const value of [dependency,command,missing])assert.throws(()=>pkg(bases[1],Buffer.from(JSON.stringify(value,null,2)+'\n')));
 assert.throws(()=>pkg(bases[0],packageBytes));assert.throws(()=>pkg(bases[1],packageBytes.toString()));
});
