import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/atlas-runtime-pages-before-recovery.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const expected=['3d','spine-3d','pelvis-3d','thorax-3d','abdomen-3d','shoulder-3d','lower-limb-3d','female-pelvis-3d'];
assert.equal(fixture.schema,'vm-atlas-runtime-page-preimages-1');
assert.deepEqual(fixture.records.map(row=>row.path),expected.map(route=>`app/atlas/${route}/page.tsx`));
for(const row of fixture.records)test(`${row.path} changes only its plain frame tag and adds the shared recovery import`,()=>{
 const before=Buffer.from(row.beforeBase64,'base64');assert.equal(sha(before),row.beforeSha256);
 const original=before.toString().replaceAll('\r\n','\n');
 assert.equal((original.match(/<iframe\b/g)||[]).length,1);
 const expected="import {AtlasRuntimeFrame} from '../../../components/AtlasRuntimeFrame';\n"+original.replace('<iframe','<AtlasRuntimeFrame');
 const actual=readFileSync(new URL('../'+row.path,import.meta.url),'utf8').replaceAll('\r\n','\n');
 assert.equal(actual,expected,'Retain exact source/query/title/attributes, teaching, licences, navigation, revision and head-channel conditions');
 assert.equal((actual.match(/<AtlasRuntimeFrame\b/g)||[]).length,1);
 assert(!actual.includes('<iframe'));
});
