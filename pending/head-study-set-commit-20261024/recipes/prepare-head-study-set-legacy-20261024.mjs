import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-head-study-set-commit',prep=json(stage+'/PREPARATION.json'),site=stage+'/website';
const file='tests/head-tour-study-set.test.ts',helper='tests/head-separate-component-loader.ts';
assert.equal(hash(site+'/'+file),hash(prep.parentWebsite+'/'+file));
fs.mkdirSync(stage+'/before/tests',{recursive:true});fs.copyFileSync(site+'/'+file,stage+'/before/'+file,fs.constants.COPYFILE_EXCL);
fs.copyFileSync(prep.parentWebsite+'/'+helper,site+'/'+helper,fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({beforeSha256:hash(stage+'/before/'+file),helperSha256:hash(site+'/'+helper),actualDependencyLoader:true}));
