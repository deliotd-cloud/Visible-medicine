import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {historicalHeadPilotRuntime,listHeadPilotDirectory,readHeadPilotFile,readHistoricalUnchangedFile} from './historical-head-pilot-read.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const asset='assets/anatomy-load-state-DW5P5x4y.js';
const expected='6747c2d7b99b27cc4d5c5c32c9add7f828aee34e861ff633fd9cfb5a9a969a31';

test('declared unchanged 9fba asset and packed manifest retain complete original bytes',async()=>{
  const manifest=await readHeadPilotFile(new URL('manifest.json',historicalHeadPilotRuntime));
  assert.equal(sha(manifest),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
  const bytes=await readHeadPilotFile(new URL(asset,historicalHeadPilotRuntime));
  assert.equal(bytes.length,460729);assert.equal(sha(bytes),expected);
  assert.deepEqual(bytes,await readHistoricalUnchangedFile(asset));
  const names=await listHeadPilotDirectory(historicalHeadPilotRuntime,{withFileTypes:true});
  assert(names.some(row=>row.name==='manifest.json'&&row.isFile()));
  assert(names.some(row=>row.name==='assets'&&row.isDirectory()));
});

test('missing or changed original manifest and asset are refused',async()=>{
  const missing=()=>{throw new Error('ENOENT: missing historical source');};
  await assert.rejects(readHistoricalUnchangedFile(asset,missing),/ENOENT/);
  const manifest=readFileSync(process.env.VM_HEAD_PILOT_9FBA_ROOT+'/manifest.json');
  const badManifest=Buffer.from(manifest);badManifest[0]^=1;
  await assert.rejects(readHistoricalUnchangedFile(asset,()=>badManifest),/Original manifest changed/);
  await assert.rejects(readHistoricalUnchangedFile(asset,undefined,missing),/ENOENT/);
  const bytes=readFileSync(process.env.VM_HEAD_PILOT_9FBA_ROOT+'/'+asset);
  const badAsset=Buffer.from(bytes);badAsset[0]^=1;
  await assert.rejects(readHistoricalUnchangedFile(asset,undefined,async()=>badAsset),/Original historical asset changed/);
});

test('closed inventory and host allowlist still refuse undeclared paths',async()=>{
  await assert.rejects(readHeadPilotFile(new URL('assets/not-declared.js',historicalHeadPilotRuntime)),/not declared/);
  await assert.rejects(readHeadPilotFile(new URL('../outside.js',historicalHeadPilotRuntime)),/not declared/);
  await assert.rejects(readHeadPilotFile(new URL('../private.txt',import.meta.url)),/Pilot host read is not declared/);
});
