import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {basename,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const installedRoot=resolve(fileURLToPath(new URL('../',import.meta.url)));
const websiteCandidate=basename(installedRoot)==='website'&&existsSync(resolve(installedRoot,'package.json'))
  ?installedRoot:process.env.VM_WEBSITE_ROOT;
if(!websiteCandidate||!existsSync(resolve(websiteCandidate,'package.json')))
  throw new Error('Set VM_WEBSITE_ROOT to the canonical website for this isolated proposal test');
const website:string=websiteCandidate;
const candidate=resolve(dirname(fileURLToPath(import.meta.url)),'../lib/body-structure-search.ts');
const requireWebsite=createRequire(`${website}/package.json`);
const esbuild=requireWebsite('esbuild') as typeof import('esbuild');

type Mutation='stale-review-revision'|'malformed-review-revision'|'manifest-hash-mismatch'|'catalog-mismatch';
async function load(mutation?:Mutation){
  const entry=candidate.replaceAll('\\','/');
  const output=await esbuild.build({stdin:{contents:`export * from '${entry}'; export {parseStudyLink,resolveStudyLink,makeStudyLink} from '@/atlas-review/lib/study-links'; export {bodyDisplayCatalog} from '@/atlas-review/lib/body-display-catalog'; export {atlasStudySuffix} from '@/lib/atlas-study-transport'; export {atlasReferenceRevisionCurrent} from '@/lib/atlas-reference-revision';`,resolveDir:website,sourcefile:'body-search-test-entry.ts'},
    absWorkingDir:website,alias:{'@':website},bundle:true,platform:'node',format:'cjs',write:false,
    plugins:mutation?[{name:'source-mutation',setup(build){
      const filter=mutation==='catalog-mismatch'
        ?/public[/\\]atlas-runtime[/\\]head-neck[/\\]models[/\\]bodyparts3d[/\\]full-body[/\\]catalog\.json$/
        :mutation==='manifest-hash-mismatch'
          ?/public[/\\]atlas-runtime[/\\]head-neck[/\\]manifest\.json$/
          :/atlas-review[/\\]manifest\.json$/;
      build.onLoad({filter},args=>{
        const value=JSON.parse(readFileSync(args.path,'utf8'));
        if(mutation==='stale-review-revision')value.revision='a'.repeat(40);
        else if(mutation==='malformed-review-revision')value.revision='invalid';
        else if(mutation==='manifest-hash-mismatch')value.files.find((file:any)=>file.path==='models/bodyparts3d/full-body/catalog.json').sha256='0'.repeat(64);
        else value.structures[0].name='Mutated source label';
        return {contents:JSON.stringify(value),loader:'json'};
      });
    }}]:[]});
  const module:{exports:Record<string,any>}={exports:{}};
  assert(output.outputFiles?.length);
  new Function('require','module','exports',output.outputFiles[0].text)(requireWebsite,module,module.exports);
  return module.exports;
}
const api=await load();
const raw=JSON.parse(readFileSync(`${website}/public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json`,'utf8'));
const imported=JSON.parse(readFileSync(`${website}/atlas-review/public/models/bodyparts3d/full-body/catalog.json`,'utf8'));
const catalog=api.bodyDisplayCatalog(imported);
const manifest=JSON.parse(readFileSync(`${website}/public/atlas-runtime/head-neck/manifest.json`,'utf8'));

test('current source catalogue and display corrections bind 1104 root selections',()=>{
  assert.equal(raw.structures.length,1022);
  assert.deepEqual(raw,imported);
  assert.equal(catalog.structures.length,1104);
  assert.equal(new Set(catalog.structures.map((s:{id:string})=>s.id)).size,1104);
  assert.deepEqual(api.searchBodyStructures('Achilles'),api.searchBodyStructuresWithIdentity('Achilles').map((r:any)=>r.row));
});

test('aliases, regions, sides and source identities resolve through existing parser',()=>{
  const queries=['Achilles','left Achilles','right Achilles','collarbone','right clavicle','scapula','patella','esophagus','FMA13322',
    'vm:anatomy:body:leg:right:tendon:right-calcaneal-tendon','vm:anatomy:body:leg:left:tendon:left-calcaneal-tendon',
    'right supraspinatus','left supraspinatus'];
  for(const query of queries){
    const rows=api.searchBodyStructuresWithIdentity(query);
    assert(rows.length>0,query);
    for(const {row,identity} of rows){
      assert.equal(row.kind,'Anatomy concept');
      const url=new URL(row.href,'https://atlas.invalid'),params=Object.fromEntries(url.searchParams);
      assert.equal(url.pathname,'/atlas/3d');assert.equal(params.atlasRevision,manifest.sourceCommit);
      assert.equal(params.structure,identity.structureId);
      assert.equal(params.region,catalog.structures.find((s:any)=>s.id===identity.structureId)?.region);
      assert.equal(api.atlasReferenceRevisionCurrent(params,manifest.sourceCommit),true);
      assert(api.atlasStudySuffix(params)?.includes('study=1'));
      const link=api.parseStudyLink(params);
      assert.equal(link.status,'requested');
      const resolved=api.resolveStudyLink(catalog,params.region,link);
      assert.equal(resolved.status,'ready',`${query}: ${row.title}`);
      assert.equal(resolved.selected.id,identity.structureId);
      assert.equal(params.source,catalog.bundles.find((b:any)=>b.id===resolved.selected.bundle)?.sha256);
    }
  }
  assert(api.searchBodyStructures('left Achilles').every((row:any)=>/Left/.test(row.title)));
  assert(api.searchBodyStructures('right Achilles').every((row:any)=>/Right/.test(row.title)));
  assert(api.searchBodyStructures('supraspinatus').some((row:any)=>/supraspinatus/i.test(row.title)));
  assert(api.searchBodyStructures('collarbone').some((row:any)=>/clavicle/i.test(row.title)));
  const partial=catalog.structures.find((s:any)=>s.representation?.coverage==='partial');
  assert(partial);
  const partialRow=api.searchBodyStructures(partial.fmaId).find((row:any)=>row.title===partial.name);
  assert(partialRow);assert.match(partialRow.summary,/Partial source representation/);
  for(const structure of catalog.structures){
    const side=['left','right'].includes(structure.laterality)?structure.laterality:'both';
    assert(api.makeStudyLink(catalog,structure.region,structure.id,side),structure.id);
  }
});

test('bounds, refusals, deterministic order and fresh rows',async()=>{
  for(const value of [null,undefined,[],['Achilles'],{},7,'','a','%',"<script>",'SELECT * FROM anatomy','x'.repeat(81)])
    assert.deepEqual(api.searchBodyStructures(value),[]);
  for(const excluded of raw.excluded)assert.deepEqual(api.searchBodyStructures(excluded.fmaId),[]);
  assert.deepEqual(api.searchBodyStructures('zz-no-such-structure'),[]);
  const first=api.searchBodyStructures('right'),second=api.searchBodyStructures('right');
  assert(first.length<=12);assert.deepEqual(first,second);assert.notStrictEqual(first,second);
  if(first.length){first[0].title='changed';assert.notEqual(api.searchBodyStructures('right')[0].title,'changed');}
  const href=api.searchBodyStructures('Achilles')[0].href,params=Object.fromEntries(new URL(href,'https://atlas.invalid').searchParams);
  assert.equal(api.parseStudyLink({...params,source:'0'.repeat(64)}).status,'requested');
  assert.equal(api.resolveStudyLink(catalog,params.region,api.parseStudyLink({...params,source:'0'.repeat(64)})).status,'rejected');
  assert.equal(api.parseStudyLink({...params,side:['left','right']}).status,'invalid');
  assert.equal(api.parseStudyLink({...params,source:undefined}).status,'invalid');
  assert.equal(api.atlasReferenceRevisionCurrent({...params,atlasRevision:'a'.repeat(40)},manifest.sourceCommit),false);
  assert.equal(api.atlasStudySuffix({...params,structure:['a','b']}),null);
  for(const mutation of ['stale-review-revision','malformed-review-revision','manifest-hash-mismatch','catalog-mismatch'] as const){
    const changed=await load(mutation);
    assert.deepEqual(changed.searchBodyStructures('Achilles'),[],mutation);
  }
});
