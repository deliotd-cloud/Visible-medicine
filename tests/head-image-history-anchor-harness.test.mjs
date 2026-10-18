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
 assert.equal(fs.readFileSync(new URL('./head-image-history.test.ts',import.meta.url),'utf8').replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));
});
