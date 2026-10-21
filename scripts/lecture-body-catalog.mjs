import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const flags=process.argv.slice(2);
if(flags.length>1||(flags.length===1&&flags[0]!=='--check'))
  throw new Error('Usage: lecture-body-catalog.mjs [--check]');
const scriptDir=dirname(fileURLToPath(import.meta.url));
const installed=resolve(scriptDir,'..');
const website=process.env.VM_WEBSITE_ROOT??(existsSync(resolve(installed,'package.json'))?installed:undefined);
if(!website||!existsSync(resolve(website,'package.json')))
  throw new Error('Install under website/scripts or set VM_WEBSITE_ROOT for the isolated proposal');
const proposal=installed;
const target=resolve(proposal,'lib/lecture-body-catalog.json');
const requireWebsite=createRequire(resolve(website,'package.json'));
const esbuild=requireWebsite('esbuild');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=path=>JSON.parse(readFileSync(path,'utf8'));
const runtime=readJson(resolve(website,'public/atlas-runtime/head-neck/manifest.json'));
const review=readJson(resolve(website,'atlas-review/manifest.json'));
const runtimeCatalogPath=resolve(website,'public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json');
const importedCatalogPath=resolve(website,'atlas-review/public/models/bodyparts3d/full-body/catalog.json');
const runtimeBytes=readFileSync(runtimeCatalogPath),importedBytes=readFileSync(importedCatalogPath);
const runtimeHash=hash(runtimeBytes),importedHash=hash(importedBytes);
const runtimeFile=runtime.files.find(file=>file.path==='models/bodyparts3d/full-body/catalog.json');
const reviewFile=review.files.find(file=>file.path==='public/models/bodyparts3d/full-body/catalog.json');
assert.match(runtime.sourceCommit,/^[a-f0-9]{40}$/);
assert.equal(runtime.sourceCommit,review.revision);
assert.equal(runtimeHash,importedHash);
assert.equal(runtimeHash,runtimeFile?.sha256);
assert.equal(runtimeHash,reviewFile?.sourceSha256);
assert.equal(runtimeHash,reviewFile?.importedSha256);

const output=await esbuild.build({
  stdin:{contents:`export {bodyDisplayCatalog} from '@/atlas-review/lib/body-display-catalog';
export {makeStudyLink,parseStudyLink,resolveStudyLink} from '@/atlas-review/lib/study-links';
export {structureSearchAliases} from '@/atlas-review/lib/anatomy-search';
export {atlasBodyRegions} from '@/lib/atlas-navigation';`,resolveDir:website,sourcefile:'lecture-body-catalog-entry.ts'},
  absWorkingDir:website,alias:{'@':website},bundle:true,platform:'node',format:'cjs',write:false,
});
const module={exports:{}};
new Function('require','module','exports',output.outputFiles[0].text)(requireWebsite,module,module.exports);
const {bodyDisplayCatalog,makeStudyLink,parseStudyLink,resolveStudyLink,structureSearchAliases,atlasBodyRegions}=module.exports;
const imported=JSON.parse(importedBytes.toString('utf8'));
const raw=JSON.parse(runtimeBytes.toString('utf8'));
assert.deepEqual(raw,imported);
const catalog=bodyDisplayCatalog(imported);
assert(catalog.structures.length>0,'A current source catalogue must contain structures');
assert.equal(catalog.sourceVersion,raw.sourceVersion);
const regions=atlasBodyRegions.map(region=>[region.id,region.label]);
const regionIds=new Set(regions.map(row=>row[0]));
const bundles=catalog.bundles.map(bundle=>bundle.sha256);
assert.equal(new Set(bundles).size,bundles.length);
const ids=new Set();
const rows=catalog.structures.map(structure=>{
  assert(!ids.has(structure.id));ids.add(structure.id);
  assert(regionIds.has(structure.region));
  const side=['left','right'].includes(structure.laterality)?structure.laterality:'both';
  const sourceSha256=catalog.bundles.find(bundle=>bundle.id===structure.bundle)?.sha256;
  assert.match(sourceSha256??'',/^[a-f0-9]{64}$/);
  const link=makeStudyLink(catalog,structure.region,structure.id,side);
  assert(link,structure.id);
  const parsed=new URL(link,'https://atlas.invalid');
  assert.equal(parsed.pathname,structure.region==='whole-body'?'/':`/regions/${structure.region}`);
  assert.equal(parsed.searchParams.get('study'),'1');
  assert.equal(parsed.searchParams.get('structure'),structure.id);
  assert.equal(parsed.searchParams.get('side'),side);
  assert.equal(parsed.searchParams.get('source'),sourceSha256);
  assert.equal(resolveStudyLink(catalog,structure.region,parseStudyLink(Object.fromEntries(parsed.searchParams))).status,'ready');
  const aliases=structureSearchAliases(structure);
  return [structure.id,structure.name,structure.sourceName,structure.fmaId,
    regions.findIndex(row=>row[0]===structure.region),side,bundles.indexOf(sourceSha256),
    aliases.length?aliases:[],structure.representation?.coverage==='partial'?structure.representation.description:''];
});
const document={schema:'vm-lecture-body-catalog-v1',sourceCommit:runtime.sourceCommit,
  catalogSha256:runtimeHash,regions,bundles,rows};
const content=JSON.stringify(document)+'\n';
if(flags[0]==='--check'){
  assert.equal(readFileSync(target,'utf8'),content,'Generated body catalogue is stale');
}else writeFileSync(target,content);
console.log(JSON.stringify({rows:rows.length,bytes:Buffer.byteLength(content),sha256:hash(content),mode:flags[0]==='--check'?'check':'write'}));
