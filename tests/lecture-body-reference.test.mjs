import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const proposal=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const website=process.env.VM_WEBSITE_ROOT??(existsSync(resolve(proposal,'package.json'))?proposal:undefined);
if(!website||!existsSync(resolve(website,'package.json')))
  throw new Error('Install under website/tests or set VM_WEBSITE_ROOT for the isolated proposal');
const index=JSON.parse(readFileSync(resolve(proposal,'lib/lecture-body-catalog.json'),'utf8'));
const requireWebsite=createRequire(resolve(website,'package.json'));
const esbuild=requireWebsite('esbuild');
async function load(mutate){
  const modulePath=resolve(proposal,'lib/lecture-body-reference.ts').replaceAll('\\','/');
  const build=await esbuild.build({stdin:{contents:`export * from '${modulePath}';
export {parseStudyLink,resolveStudyLink} from '@/atlas-review/lib/study-links';
export {bodyDisplayCatalog} from '@/atlas-review/lib/body-display-catalog';`,resolveDir:website,sourcefile:'lecture-body-test-entry.ts'},
    absWorkingDir:website,alias:{'@':website},bundle:true,platform:'node',format:'cjs',write:false,
    plugins:[{name:'proposal-runtime-manifest',setup(build){
      build.onResolve({filter:/^\.\.\/public\/atlas-runtime\/head-neck\/manifest\.json$/},()=>({
        path:resolve(website,'public/atlas-runtime/head-neck/manifest.json'),
      }));
      if(mutate)build.onLoad({filter:/public[/\\]atlas-runtime[/\\]head-neck[/\\]manifest\.json$/},args=>{
        const manifest=JSON.parse(readFileSync(args.path,'utf8'));
        if(mutate==='revision')manifest.sourceCommit='a'.repeat(40);
        else manifest.files.find(file=>file.path==='models/bodyparts3d/full-body/catalog.json').sha256='a'.repeat(64);
        return {contents:JSON.stringify(manifest),loader:'json'};
      });
    }}]});
  const module={exports:{}};
  new Function('require','module','exports',build.outputFiles[0].text)(requireWebsite,module,module.exports);
  return module.exports;
}
const api=await load();
const raw=JSON.parse(readFileSync(resolve(website,'atlas-review/public/models/bodyparts3d/full-body/catalog.json'),'utf8'));
const catalog=api.bodyDisplayCatalog(raw);

test('all 1104 generated roots roundtrip through the real viewer study resolver',()=>{
  assert.equal(index.rows.length,1104);
  assert.equal(new Set(index.rows.map(row=>row[0])).size,1104);
  for(const row of index.rows){
    const ref=api.createLectureBodyReference(row[0]);
    assert(ref,row[0]);
    assert.deepEqual(Object.keys(ref),['kind','structureId','region','side','sourceSha256','atlasRevision','atlasTarget']);
    const resolved=api.resolveLectureBodyReference(ref);
    assert.equal(resolved?.atlasHref,ref.atlasTarget,row[0]);
    const target=new URL(ref.atlasTarget,'https://atlas.invalid');
    assert.equal(target.pathname,'/atlas/3d');
    const params=Object.fromEntries(target.searchParams);
    assert.equal(params.region,ref.region);assert.equal(params.atlasRevision,ref.atlasRevision);
    assert.equal(params.source,ref.sourceSha256);assert.equal(params.structure,ref.structureId);
    assert.equal(params.side,ref.side);
    const link=api.parseStudyLink(params);
    assert.equal(link.status,'requested');
    const actual=api.resolveStudyLink(catalog,ref.region,link);
    assert.equal(actual.status,'ready',row[0]);assert.equal(actual.selected.id,ref.structureId);
  }
});
test('specific side, aliases, region filter and deliberate picker bounds',()=>{
  assert.equal(api.lectureBodyOptions('', 'all').length,0);
  assert.equal(api.lectureBodyOptions('a').length,0);
  assert.equal(api.lectureBodyOptions('Achilles').length,2);
  assert.deepEqual(new Set(api.lectureBodyOptions('Achilles').map(item=>item.reference.side)),new Set(['left','right']));
  assert(api.lectureBodyOptions('left Achilles').every(item=>item.reference.side==='left'));
  assert.equal(api.lectureBodyOptions('left Achilles').length,1);
  assert.equal(api.lectureBodyOptions('right Achilles').length,1);
  assert.equal(api.lectureBodyOptions('left Achilles')[0].reference.side,'left');
  assert.equal(api.lectureBodyOptions('right Achilles')[0].reference.side,'right');
  assert(api.lectureBodyOptions('left collarbone').every(item=>item.reference.side==='left'));
  assert(api.lectureBodyOptions('right collarbone').every(item=>item.reference.side==='right'));
  assert(api.lectureBodyOptions('collarbone').some(item=>/clavicle/i.test(item.label)));
  assert(api.lectureBodyOptions('','leg').length>0);
  assert(api.lectureBodyOptions('','leg').length<=12);
  assert(api.lectureBodyOptions('leg','unknown').length===0);
  assert(api.lectureBodyOptions('right').length<=12);
  assert(api.lectureBodyRegions.some(item=>item.id==='whole-body'));
});
test('strict shape, detached clones, six bound and exact duplicate refusal',()=>{
  const ref=api.createLectureBodyReference(index.rows[0][0]);
  const copy=api.validateLectureBodyReference(ref);
  assert.deepEqual(copy,ref);assert.notStrictEqual(copy,ref);
  const refs=index.rows.slice(0,6).map(row=>api.createLectureBodyReference(row[0]));
  assert.equal(api.validateLectureBodyReferences(refs).length,6);
  assert.notStrictEqual(api.validateLectureBodyReferences(refs)[0],refs[0]);
  assert.throws(()=>api.validateLectureBodyReferences([]));
  assert.throws(()=>api.validateLectureBodyReferences([...refs,refs[0]]));
  assert.throws(()=>api.validateLectureBodyReferences([ref,ref]));
  assert.throws(()=>api.validateLectureBodyReferences([ref,{kind:'head-concept-v1',conceptId:'brainstem-pons'}]));
  assert.throws(()=>api.validateLectureBodyReferences([ref,,refs[1]]));
  const expanded=[ref];expanded.extra=1;assert.throws(()=>api.validateLectureBodyReferences(expanded));
  assert.deepEqual(api.lectureSlideBodyReferences({bodyAnatomyReferences:[ref]}),[ref]);
  assert.deepEqual(api.lectureSlideBodyReferences({bodyAnatomyReferences:[ref,ref]}),[]);
  assert.deepEqual(api.lectureSlideBodyReferences({anatomyReference:{kind:'head-concept-v1'}}),[]);
});
test('stale and forged fields never produce navigation, but valid old shapes parse',()=>{
  const ref=api.createLectureBodyReference(index.rows[0][0]);
  for(const field of ['structureId','region','side','sourceSha256','atlasRevision','atlasTarget']){
    const forged={...ref,[field]:field==='atlasTarget'?'https://evil.invalid/':
      field==='sourceSha256'?'a'.repeat(64):field==='atlasRevision'?'a'.repeat(40):
      field==='side'?(ref.side==='right'?'left':'right'):'forged'};
    assert.equal(api.resolveLectureBodyReference(forged),null,field);
  }
  assert.equal(api.createLectureBodyReference('not-a-source-id'),null);
  assert.equal(api.resolveLectureBodyReference({...ref,atlasTarget:'/atlas/3d?region=leg&study=1'}),null);
  assert.equal(api.resolveLectureBodyReference({...ref,atlasTarget:'//evil.invalid/atlas/3d?x=1'}),null);
  assert.throws(()=>api.validateLectureBodyReference({...ref,unexpected:1}));
  assert.throws(()=>api.validateLectureBodyReference({...ref,kind:'head-concept-v1'}));
  assert.throws(()=>api.validateLectureBodyReference({...ref,sourceSha256:'x'}));
  for(const field of ['kind','structureId','region','side','sourceSha256','atlasRevision','atlasTarget']){
    for(const wrong of [[ref[field]],7,{value:ref[field]}]){
      assert.throws(()=>api.validateLectureBodyReference({...ref,[field]:wrong}),`${field}: ${typeof wrong}`);
      assert.equal(api.resolveLectureBodyReference({...ref,[field]:wrong}),null,field);
    }
  }
  let accessed=0;
  const accessor=Object.defineProperty({...ref},'atlasTarget',{get(){accessed++;return ref.atlasTarget;}});
  assert.throws(()=>api.validateLectureBodyReference(accessor));
  assert.equal(api.resolveLectureBodyReference(accessor),null);assert.equal(accessed,0);
  const stale={...ref,atlasRevision:'a'.repeat(40)};
  assert.deepEqual(api.validateLectureBodyReference(stale),stale);
  assert.equal(api.resolveLectureBodyReference(stale),null);
});
test('generator accepts only its one read-only check flag',()=>{
  const script=resolve(proposal,'scripts/lecture-body-catalog.mjs');
  for(const flags of [['--unknown'],['--check','--check'],['--write']]){
    const result=spawnSync(process.execPath,[script,...flags],{
      env:{...process.env,VM_WEBSITE_ROOT:website},encoding:'utf8'});
    assert.notEqual(result.status,0,flags.join(' '));
    assert.match(result.stderr,/Usage: lecture-body-catalog\.mjs/);
  }
});
test('runtime revision and catalog hash drift fail closed for all creation/resolution/search',async()=>{
  const ref=api.createLectureBodyReference(index.rows[0][0]);
  for(const kind of ['revision','catalog']){
    const changed=await load(kind);
    assert.equal(changed.createLectureBodyReference(ref.structureId),null);
    assert.equal(changed.resolveLectureBodyReference(ref),null);
    assert.deepEqual(changed.lectureBodyOptions('Achilles'),[]);
    assert.deepEqual(changed.validateLectureBodyReference(ref),ref);
  }
});
