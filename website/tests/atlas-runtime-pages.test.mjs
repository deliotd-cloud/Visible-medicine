import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {restoreAtlas3dQueryPage,pageQueryImports,pageQueryValidation,pageQueryRedirect,pageQuerySource} from './page-ssr-query-role.mjs';
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
 const current=readFileSync(new URL('../'+row.path,import.meta.url),'utf8').replaceAll('\r\n','\n');
 const actual=row.path==='app/atlas/3d/page.tsx'?restoreAtlas3dQueryPage(current):current;
 assert.equal(actual,expected,'Retain exact source/query/title/attributes, teaching, licences, navigation, revision and head-channel conditions');
 assert.equal((actual.match(/<AtlasRuntimeFrame\b/g)||[]).length,1);
 assert(!actual.includes('<iframe'));
});

test('the 3D page query role refuses lost, repeated, reordered or substituted source seams',()=>{
 const source=readFileSync(new URL('../app/atlas/3d/page.tsx',import.meta.url),'utf8').replaceAll('\r\n','\n');
 const changed=[
  source.replace(pageQueryImports,''),source+pageQueryImports,
  source.replace(pageQueryImports,pageQueryImports.split('\n').reverse().join('\n')),
  source.replace(pageQueryValidation,''),source+pageQueryValidation,
  source.replace(pageQueryValidation,pageQueryValidation.replace('hasHeadLearningQuery(params)','false')),
  source.replace(pageQueryRedirect,''),source.replace(pageQueryRedirect,pageQueryRedirect.replace('!tourSuffix&&','')),
  source.replace(pageQuerySource,''),source.replace(pageQuerySource,pageQuerySource.replace('${tourSuffix}','')),
  source+'\n// foreign route change\n',
 ];
 for(const candidate of changed){assert.notEqual(candidate,source);assert.throws(()=>restoreAtlas3dQueryPage(candidate));}
});
