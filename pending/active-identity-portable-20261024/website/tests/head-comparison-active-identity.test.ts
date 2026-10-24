import fs from 'node:fs';
import assert from 'node:assert/strict';
import {runHistoricalActiveIdentity} from './head-active-identity-historical-source.mjs';
const read=fs.readFileSync;
await runHistoricalActiveIdentity();
assert.equal(fs.readFileSync,read,'Historical viewer read hook restored');
