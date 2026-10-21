import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import test from 'node:test';
test('native-anchor history harness preserves all other original assertions',()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/head-image-history-native-anchor.json',import.meta.url));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'a1d64eceb4e62a95d1f9e0ec1556075b5c6d177f8742f3c480fb88b47c5402af');
 const fixture=JSON.parse(bytes),original=zlib.gunzipSync(Buffer.from(fixture.originalGzipBase64,'base64'));
 assert.equal(fixture.originalSha256,'688931ef86ee36dec5150be8d53c421296f52bddf52b8dd53f78a695e58f1835');
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),fixture.originalSha256);
 let expected=original.toString();assert.equal(fixture.replacements.length,3);
 for(const [from,to]of fixture.replacements){assert.equal(expected.split(from).length,2);expected=expected.replace(from,to);}
 const helperSeams=[["import {headMaskHits} from '../lib/head-mask-picking.ts';","import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';\nimport {headMaskHits} from '../lib/head-mask-picking.ts';"],["name==='../lib/head-atlas-display'?{headLabel:","name==='../lib/head-atlas-display'?{...require('../lib/head-atlas-display.ts'),headLabel:"],["    name.endsWith('.css')?{}:require(name);","    name==='../lib/head-disclosure-keyboard'?{headDisclosureKeyDown}:\n    name.endsWith('.css')?{}:require(name);"]];
 for(const [from,to]of helperSeams){assert.equal(expected.split(from).length,2);expected=expected.replace(from,to);}
 const additional=fs.readFileSync(new URL('./fixtures/head-image-history-retry-focus.tests.raw',import.meta.url),'utf8');
 assert.equal(crypto.createHash('sha256').update(additional).digest('hex'),'33d69dce7feb403fb84dfbb7c408c0f9bc407d60a80be52099ffb001eb8f8d94');
 const marker="test('native retry cancels on clear, package close, other selection or practice without stale anatomy',async()=>{";assert.equal(expected.split(marker).length,2);expected=expected.replace(marker,additional+marker);
 assert.equal(fs.readFileSync(new URL('./head-image-history.test.ts',import.meta.url),'utf8').replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));
});
