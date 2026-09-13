import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {atlasStudySuffix} from '../lib/atlas-study-transport.ts';

test('whole-body continuation relays exact study identity without external routing or unrelated fields',()=>{
  const p={study:'1',structure:'vm:anatomy:body:spine:right:muscle:right-longus-capitis',side:'right',source:'a'.repeat(64)};
  const suffix=atlasStudySuffix({...p,patientId:'private',token:'secret',redirect:'https://example.test',region:'whole-body'});
  assert.ok(suffix);assert.deepEqual(Object.fromEntries(new URLSearchParams(suffix.slice(1))),p);
  assert.equal(atlasStudySuffix({}), '');assert.equal(atlasStudySuffix({unknown:'ignored'}),'');
  for(const key of Object.keys(p)){
    assert.equal(atlasStudySuffix({...p,[key]:[p[key as keyof typeof p],p[key as keyof typeof p]]}),null);
    assert.equal(atlasStudySuffix({...p,[key]:'<script>&region=foot'}),null);
  }
  for(const patch of [{source:'a'.repeat(63)},{structure:'x'.repeat(241)},{study:'3'},{side:'either'},{focus:'../escape'},{detail:'x'.repeat(300)}]){
    assert.equal(atlasStudySuffix({...p,...patch}),null);
  }
  const nested={...p,study:'2',detail:'eye',part:'test:part',partSource:'b'.repeat(64)};
  assert.deepEqual(Object.fromEntries(new URLSearchParams(atlasStudySuffix(nested)!.slice(1))),nested);
  assert.equal(atlasStudySuffix({structure:'valid-id'}),'&structure=valid-id','Partial query retained for module rejection, never silently dropped');
  const page=readFileSync(new URL('../app/atlas/3d/page.tsx',import.meta.url),'utf8');
  assert.ok(page.includes('const studySuffix=atlasStudySuffix(params)'));
  assert.ok(page.includes('if(studySuffix===null)notFound()'));
  assert.ok(page.includes('region=${region.id}${studySuffix}'));
  assert.ok(page.includes('src={source}'));
});
