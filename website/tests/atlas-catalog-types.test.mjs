import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFile, mkdir, mkdtemp, readFile, rm, unlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import {declarationFor, generateCatalogTypes, validateCatalogContract} from '../scripts/atlas-catalog-types.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=path.join(root,'scripts/atlas-catalog-types.mjs');
const catalogs=[
  'atlas-review/public/models/bodyparts3d/full-body/catalog.json',
  'public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json',
];
const declaration=(relativePath)=>relativePath.replace(/\.json$/,'.d.json.ts');
const sha256=(bytes)=>createHash('sha256').update(bytes).digest('hex');
const absolute=(base,relativePath)=>path.join(base,...relativePath.split('/'));

const compactCatalog=(catalog)=>({...catalog,
  structures:catalog.structures.slice(0,1),bundles:catalog.bundles.slice(0,1),
  regions:catalog.regions.slice(0,1),excluded:catalog.excluded.slice(0,1),
});

test('a real catalog satisfies BodyCatalog; malformed required and optional nested fields fail',async()=>{
  const original=await readFile(absolute(root,catalogs[0]),'utf8');
  assert.doesNotThrow(()=>validateCatalogContract(original,root));
  const base=compactCatalog(JSON.parse(original));
  assert.doesNotThrow(()=>validateCatalogContract(JSON.stringify(base),root));
    const cases=[
      ['missing required top-level field',c=>delete c.coverage],
      ['wrong coordinate tuple member',c=>c.coordinateSystem.sourceToSceneColumnMajor[0]='zero'],
      ['missing structure bound',c=>delete c.structures[0].bounds.min],
      ['wrong structure system union',c=>c.structures[0].system='not-a-system'],
      ['wrong nested source hash type',c=>c.structures[0].sources[0].sha256=7],
      ['wrong optional provenance literal',c=>c.structures[0].provenance.method='invented-method'],
      ['wrong optional validation literal',c=>c.structures[0].validation.anatomicalReview=true],
      ['wrong optional presentation part',c=>c.structures[0].presentationParts=[{displaySide:'middle'}]],
      ['wrong optional representation',c=>c.structures[0].representation={coverage:'complete'}],
      ['missing bundle field',c=>delete c.bundles[0].sha256],
      ['wrong required coverage',c=>c.coverage.nerves=3],
      ['wrong optional coverage',c=>c.coverage.vessels=3],
      ['wrong exclusion field',c=>c.excluded[0].reason=3],
    ];
  for(const [label,mutate] of cases){
    const changed=structuredClone(base);
    mutate(changed);
    assert.throws(()=>validateCatalogContract(JSON.stringify(changed),root),undefined,label);
  }
});

test('declarations are deterministic, bind both hashes, and use the original BodyCatalog type',async()=>{
  const schemaPaths=['atlas-review/app/body-types.ts','atlas-review/lib/anatomy-coordinates.ts'];
  const schemaSha256=sha256(JSON.stringify(await Promise.all(schemaPaths.map(async item=>({
    path:item,sha256:sha256(await readFile(absolute(root,item))),
  })))));
  for(const relativePath of catalogs){
    const catalogSha256=sha256(await readFile(absolute(root,relativePath)));
    const first=declarationFor(relativePath,catalogSha256,schemaSha256);
    assert.equal(first,declarationFor(relativePath,catalogSha256,schemaSha256));
    assert.match(first,/BodyCatalog/);
    assert.match(first,/atlas-review\/app\/body-types|body-types/);
    assert(first.includes(catalogSha256),relativePath);
    assert(first.includes(schemaSha256),relativePath);
    assert.doesNotMatch(first,/\bany\b/);
    assert(first.length<5000,'declaration must not embed the full catalog');
  }
});

test('TypeScript resolves both JSON imports through small declarations while runtime JSON bytes remain available',async()=>{
  const before=await Promise.all(catalogs.map(item=>readFile(absolute(root,item))));
  const options={module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
    target:ts.ScriptTarget.ES2022,strict:true,noEmit:true,types:[],lib:['lib.es2022.d.ts'],
    resolveJsonModule:true,allowArbitraryExtensions:true};
  const entry=path.join(root,'__catalog_resolution_test__.ts');
  const text=catalogs.map((p,i)=>`import value${i} from './${p}'; export {value${i}};`).join('\n');
  const host=ts.createCompilerHost(options),getSourceFile=host.getSourceFile.bind(host);
  host.getSourceFile=(name,language,onError,fresh)=>path.resolve(name)===entry
    ?ts.createSourceFile(name,text,language,true):getSourceFile(name,language,onError,fresh);
  const program=ts.createProgram([entry],options,host);
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(d=>d.code),[]);
  assert.equal(program.getSourceFiles().filter(s=>/full-body[/\\]catalog\.json$/.test(s.fileName)).length,0);
  assert.equal(program.getSourceFiles().filter(s=>/full-body[/\\]catalog\.d\.json\.ts$/.test(s.fileName)).length,2);
  const checker=program.getTypeChecker(),source=program.getSourceFile(entry);
  for(const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(source))){
    const type=checker.getTypeOfSymbolAtLocation(symbol,source);
    assert.equal(type.flags&ts.TypeFlags.Any,0);
    assert.equal(checker.typeToString(type),'BodyCatalog');
  }
  for(const relativePath of catalogs){
    const importer=absolute(root,'lib/body-structure-search.ts');
    const resolved=ts.resolveModuleName(absolute(root,relativePath),importer,options,ts.sys).resolvedModule;
    assert(resolved,relativePath);
    assert.equal(path.normalize(resolved.resolvedFileName),path.normalize(absolute(root,declaration(relativePath))));
    const text=await readFile(resolved.resolvedFileName,'utf8');
    assert.match(text,/BodyCatalog/);
    assert(text.length<5000);
    assert.equal(typeof JSON.parse(await readFile(absolute(root,relativePath),'utf8')).structures.length,'number');
    const loaded=await import(pathToFileURL(absolute(root,relativePath)).href,{with:{type:'json'}});
    assert.deepEqual(loaded.default,JSON.parse(before[catalogs.indexOf(relativePath)].toString('utf8')));
  }
  const after=await Promise.all(catalogs.map(item=>readFile(absolute(root,item))));
  before.forEach((bytes,index)=>assert.deepEqual(after[index],bytes,catalogs[index]));
});

test('--check rejects missing, tampered, and stale declarations in a bounded fixture',async()=>{
  const fixture=await mkdtemp(path.join(os.tmpdir(),'vm-catalog-types-'));
  const copy=async(relativePath)=>{
    const destination=absolute(fixture,relativePath);
    await mkdir(path.dirname(destination),{recursive:true});
    await copyFile(absolute(root,relativePath),destination);
  };
  const check=()=>spawnSync(process.execPath,[script,'--check'],{
    cwd:root,env:{...process.env,VM_WEBSITE_ROOT:fixture},encoding:'utf8',timeout:120000,
  });
  try{
    for(const item of [
      ...catalogs,
      'atlas-review/manifest.json','public/atlas-runtime/head-neck/manifest.json',
      'atlas-review/app/body-types.ts','atlas-review/lib/anatomy-coordinates.ts',
      'package.json','tsconfig.json',
    ])await copy(item);
    for(const relativePath of catalogs){
      const compact=compactCatalog(JSON.parse(await readFile(absolute(fixture,relativePath),'utf8')));
      const bytes=Buffer.from(JSON.stringify(compact));
      await writeFile(absolute(fixture,relativePath),bytes);
      const manifestPath=relativePath.startsWith('atlas-review/')
        ?'atlas-review/manifest.json':'public/atlas-runtime/head-neck/manifest.json';
      const manifest=JSON.parse(await readFile(absolute(fixture,manifestPath),'utf8'));
      const recordPath=relativePath.startsWith('atlas-review/')
        ?relativePath.slice('atlas-review/'.length)
        :relativePath.slice('public/atlas-runtime/head-neck/'.length);
      const record=manifest.files.find(item=>item.path===recordPath);
      assert(record,recordPath);
      if(relativePath.startsWith('atlas-review/'))record.sourceSha256=record.importedSha256=sha256(bytes);
      else record.sha256=sha256(bytes);
      await writeFile(absolute(fixture,manifestPath),JSON.stringify(manifest));
    }
    generateCatalogTypes({websiteRoot:fixture});
    const original=await Promise.all(catalogs.map(item=>readFile(absolute(fixture,item))));
    let result=check();
    assert.equal(result.status,0,`valid fixture: ${result.stderr||result.stdout}`);
    await unlink(absolute(fixture,declaration(catalogs[0])));
    result=check();
    assert.notEqual(result.status,0,'missing declaration');
    generateCatalogTypes({websiteRoot:fixture});
    assert.equal(check().status,0,'valid again after restoring the missing declaration');
    const secondDeclaration=absolute(fixture,declaration(catalogs[1]));
    await writeFile(secondDeclaration,`${await readFile(secondDeclaration,'utf8')}\n// tampered\n`);
    result=check();
    assert.notEqual(result.status,0,'tampered declaration');
    assert.match(result.stderr,/Stale catalog declaration/);
    generateCatalogTypes({websiteRoot:fixture});
    assert.equal(check().status,0,'valid again after restoring the tampered declaration');
    await writeFile(absolute(fixture,catalogs[0]),`${original[0].toString('utf8')} `);
    result=check();
    assert.notEqual(result.status,0,'stale catalog bytes');
    assert.match(result.stderr,/Imported catalog source changed/);
    await writeFile(absolute(fixture,catalogs[0]),original[0]);
    await writeFile(absolute(fixture,'atlas-review/app/body-types.ts'),`${await readFile(absolute(fixture,'atlas-review/app/body-types.ts'),'utf8')}\n// changed schema source\n`);
    result=check();
    assert.notEqual(result.status,0,'stale schema');
    assert.match(result.stderr,/Stale catalog declaration/);
    assert.deepEqual(await readFile(absolute(fixture,catalogs[1])),original[1]);
  }finally{
    const temp=path.resolve(os.tmpdir()),resolved=path.resolve(fixture);
    assert(resolved.startsWith(temp+path.sep)&&path.basename(resolved).startsWith('vm-catalog-types-'));
    await rm(resolved,{recursive:true,force:true});
  }
});
