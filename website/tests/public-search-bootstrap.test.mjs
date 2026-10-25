import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {invertPublicSearchBootstrap,ORIGINAL_PLATFORM_SHA256} from './public-search-bootstrap-source.mjs';
import {invertGuestCorePrerequisites} from './guest-core-prerequisites-source.mjs';

const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const requireWebsite=createRequire(path.join(root,'package.json'));
const ts=requireWebsite('typescript');
const source=readFileSync(new URL('../lib/platform-governance.ts',import.meta.url),'utf8');

function harness({failCore=false,failPlatform=false}={}){
  const db=new DatabaseSync(':memory:');
  const events=[];
  const queries=[];
  let authCalls=0;
  const coreError=new Error('core setup failed');
  const platformError=new Error('platform setup failed');
  const core=async()=>{
    events.push('core');
    if(failCore)throw coreError;
    db.exec('CREATE TABLE users(id TEXT PRIMARY KEY); CREATE TABLE courses(id TEXT PRIMARY KEY, title TEXT); CREATE TABLE modules(id TEXT, course_id TEXT); CREATE TABLE workbooks(id TEXT, module_id TEXT, title TEXT, mode TEXT, status TEXT); CREATE TABLE cases(id TEXT, title TEXT, description TEXT, classification TEXT, status TEXT)');
  };
  const platform=async()=>{
    events.push('platform');
    for(const table of ['users','courses'])assert(db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?').get(table),`${table} must exist before platform setup`);
    if(failPlatform)throw platformError;
    db.exec('CREATE TABLE atlas_publication_versions(id TEXT, slug TEXT, title TEXT, modality TEXT, status TEXT); CREATE TABLE atlas_annotations(structure_name TEXT, description TEXT, publication_version_id TEXT, synonyms_json TEXT, status TEXT); CREATE TABLE course_releases(slug TEXT, title TEXT, summary TEXT, level TEXT, duration_label TEXT, publisher_name TEXT, status TEXT, visibility TEXT)');
  };
  const mocks={
    'cloudflare:workers':{env:{DB:{prepare(sql){events.push('query');queries.push(sql);return {bind(...params){return {all:async()=>({results:db.prepare(sql).all(...params)})};}};}}}},
    '@/db/bootstrap':{ensureDatabase:core,ensureEducationUser:()=>{authCalls++;throw new Error('anonymous search attempted to create a user');},appendAudit:()=>{authCalls++;throw new Error('anonymous search attempted audit');}},
    '@/db/platform':{ensurePlatformSchema:platform},
    '@/lib/catalog':{atlasModules:[]},
    '@/lib/domain':{},
    '@/lib/atlas-structure-search':{searchAtlasStructureLearning:()=>[]},
    '@/lib/search-kind':{parseSearchKind:()=> 'all',filterSearchKind:rows=>rows},
  };
  const output={};
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('exports','require',code)(output,name=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];});
  return {db,events,queries,search:output.searchEducation,coreError,platformError,authCalls:()=>authCalls};
}

test('two exact bootstrap seams invert to the hash-pinned complete original source',()=>{
  assert.equal(ORIGINAL_PLATFORM_SHA256,'142458d43a4d0fb095090a971c46450d3faffd271331ce536776fda977a574b0');
  const inverse=invertPublicSearchBootstrap(invertGuestCorePrerequisites(source,'lib/platform-governance.ts'));
  assert.match(inverse,/export async function searchEducation/);
  assert.throws(()=>invertPublicSearchBootstrap(invertGuestCorePrerequisites(source.replace("status='published'","status='draft'"),'lib/platform-governance.ts')),/outside the two approved seams changed/);
  assert.throws(()=>invertPublicSearchBootstrap(invertGuestCorePrerequisites(source,'lib/platform-governance.ts').replace("export async function searchEducation(queryValue: unknown, kindValue: unknown = 'all') {\r\n  await ensureDatabase();\r\n  await ensurePlatformSchema();","export async function searchEducation(queryValue: unknown, kindValue: unknown = 'all') {\r\n  await ensurePlatformSchema();")),/missing or duplicated exact bootstrap seam/);
});

test('actual transpiled public search awaits core, platform, then four published selects on empty SQLite',async()=>{
  const f=harness();
  try{
    assert.deepEqual(await f.search('Pons'),[]);
    assert.deepEqual(f.events,['core','platform','query','query','query','query']);
    assert(f.queries.every(sql=>sql.includes("status='published'")));
    assert(f.queries.some(sql=>sql.includes("course_releases WHERE status='published' AND visibility='public'")));
    assert.equal(f.authCalls(),0);
    assert.equal(f.db.prepare('SELECT count(*) AS n FROM users').get().n,0);
    assert.equal(f.db.prepare('SELECT count(*) AS n FROM courses').get().n,0);
  }finally{f.db.close();}
});

test('core and platform initialization failures reject before public queries or identity work',async()=>{
  for(const options of [{failCore:true},{failPlatform:true}]){
    const f=harness(options);
    try{
      await assert.rejects(f.search('Pons'),options.failCore?f.coreError:f.platformError);
      assert.deepEqual(f.events,options.failCore?['core']:['core','platform']);
      assert.equal(f.authCalls(),0);
    }finally{f.db.close();}
  }
});
