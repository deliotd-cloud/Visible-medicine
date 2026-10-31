import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {validatedCervicalA01TemporaryDirectory,cervicalA01ChildEnvironment} from './cervical-a01-history-transport.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));

test('supplied existing temporary directory resolves independently of drive',()=>{
 const canonical=fs.realpathSync(here);
 assert.equal(validatedCervicalA01TemporaryDirectory(here),canonical);
 const lexicalAlias=here+path.sep+'..'+path.sep+path.basename(here);
 assert.equal(validatedCervicalA01TemporaryDirectory(lexicalAlias),canonical);
});

test('invalid temporary paths are refused',()=>{
 for(const candidate of [undefined,'','   ','.',path.basename(here),
  path.join(here,'missing-'+randomUUID()),fileURLToPath(import.meta.url)]){
  assert.throws(()=>validatedCervicalA01TemporaryDirectory(candidate),String(candidate));
 }
});

test('child environment uses one canonical temp and fixed source pins',()=>{
 const parent={Path:'sentinel-path',SystemRoot:'sentinel-system',WINDIR:'sentinel-windir',
  ComSpec:'sentinel-comspec',PATHEXT:'sentinel-ext',OS:'sentinel-os',
  PROCESSOR_ARCHITECTURE:'sentinel-arch',NUMBER_OF_PROCESSORS:'sentinel-count',
  TEMP:'forged-temp',TMP:'forged-tmp',TMPDIR:'forged-tmpdir',
  VM_ATLAS_SOURCE_REPO:'forged-atlas',ATLAS_SOURCE_REPO:'forged-atlas',
  NODE_OPTIONS:'--inspect',GIT_NO_REPLACE_OBJECTS:'0',GIT_OPTIONAL_LOCKS:'1',SECRET:'must-not-pass'};
 const env=cervicalA01ChildEnvironment(parent,here);
 const canonical=fs.realpathSync(here);
 assert.equal(env.TEMP,canonical);assert.equal(env.TMP,canonical);assert.equal(env.TMPDIR,canonical);
 assert.equal(env.VM_ATLAS_SOURCE_REPO,env.ATLAS_SOURCE_REPO);
 assert.match(env.ATLAS_SOURCE_REPO,/20261025-regional-title-native[\\/]atlas$/);
 assert.notEqual(env.ATLAS_SOURCE_REPO,parent.ATLAS_SOURCE_REPO);
 assert.equal(env.NODE_OPTIONS,'--max-old-space-size=768');
 assert.equal(env.GIT_NO_REPLACE_OBJECTS,'1');assert.equal(env.GIT_OPTIONAL_LOCKS,'0');
 for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','OS',
  'PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])assert.equal(env[key],parent[key]);
 assert.deepEqual(Object.keys(env).sort(),[
  'Path','SystemRoot','WINDIR','ComSpec','PATHEXT','OS','PROCESSOR_ARCHITECTURE',
  'NUMBER_OF_PROCESSORS','TEMP','TMP','TMPDIR','VM_ATLAS_SOURCE_REPO',
  'ATLAS_SOURCE_REPO','GIT_NO_REPLACE_OBJECTS','GIT_OPTIONAL_LOCKS','NODE_OPTIONS'].sort());
 assert(!Object.hasOwn(env,'SECRET'));
});
