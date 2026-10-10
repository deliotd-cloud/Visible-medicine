import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, readdir, realpath, rm, stat, symlink, link, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {collectObservedSnapshot} from './source-snapshot-collect.mjs';
import {SnapshotValidationError, validateSourceSnapshot} from './source-snapshot-manifest.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=async run=>{
  const root=await mkdtemp(join(tmpdir(),'vm-snapshot-'));
  try{return await run(root);}
  finally{
    const actual=await realpath(root),parent=await realpath(tmpdir());
    const child=relative(parent,actual);
    assert(child&&child===basename(actual)&&!child.startsWith('..')&&!isAbsolute(child),
      'Only this test-owned temporary directory may be removed');
    await rm(actual,{recursive:true,force:false});
  }
};
const put=async(root,path,bytes)=>{
  const absolute=join(root,...path.split('/'));
  await mkdir(resolve(absolute,'..'),{recursive:true});
  await writeFile(absolute,bytes);
  return absolute;
};
const refuses=async(root,options)=>assert.rejects(()=>collectObservedSnapshot(root,options));
const unsupportedLink=error=>['EPERM','EACCES','ENOTSUP','EOPNOTSUPP','UNKNOWN'].includes(error?.code);

test('actual nested bytes, zero-length file, binary fixture and deterministic inventory',async()=>fixture(async root=>{
  const originals=new Map([
    ['LICENSE',Buffer.from('fixture notice\n')],
    ['app/page.tsx',Buffer.from('export default 1;\n')],
    ['public/models/admitted.glb',Buffer.from([0,255,1,0,128,13,10])],
    ['empty.txt',Buffer.alloc(0)],
  ]);
  for(const [path,bytes]of originals)await put(root,path,bytes);
  const before=await readdir(root);
  const first=await collectObservedSnapshot(root),second=await collectObservedSnapshot(root);
  assert.deepEqual(first,second);
  assert.deepEqual(first.map(row=>row.path),[...originals.keys()].sort());
  for(const row of first){
    const bytes=originals.get(row.path);
    assert(bytes,row.path);
    assert.deepEqual(row,{path:row.path,sha256:digest(bytes),bytes:bytes.length,
      entryType:'file',isSymbolicLink:false});
    assert.deepEqual(await readFile(join(root,...row.path.split('/'))),bytes);
  }
  assert.deepEqual(await readdir(root),before,'Collector did not create or copy files');
}));

test('an extra real file is observed independently and then refused by the pure declaration checker',async()=>fixture(async root=>{
  const paths=[['package.json','{}'],['public/models/fixture.glb',Buffer.from([0,1,255])],['LICENSE','fixture']];
  for(const [path,bytes]of paths)await put(root,path,bytes);
  const expected=await collectObservedSnapshot(root);
  const role=path=>path.endsWith('.glb')?'model':path==='LICENSE'?'notice':'code';
  const proposed=expected.map(row=>({...row,role:role(row.path)}));
  const proof=id=>({id,revision:'synthetic-fixture-1',sha256:'f'.repeat(64)});
  const admissions={
    code:proposed.filter(p=>p.role==='code').map(p=>({...p,admitted:true,proof:proof('fixture-code')})),
    model:proposed.filter(p=>p.role==='model').map(p=>({...p,admitted:true,proof:proof('fixture-model'),rights:{
      sourceId:'fixture-source',licenseId:'fixture-license',evidenceId:'fixture-rights',
      evidenceRevision:'synthetic-fixture-1',evidenceSha256:'e'.repeat(64),noticePath:'LICENSE',
      commercialUse:true,redistribution:true,derivatives:true,independentlyReviewed:true}})),
    notice:proposed.filter(p=>p.role==='notice').map(p=>({...p,admitted:true,proof:proof('fixture-notice')})),
  };
  const declaration={stage:{sourceType:'canonical-atlas-working-tree',
    sourceCommit:'9b2003d75b9c27861befeaf253ce7d52cce497a6',filesystemEvidence:'lstat+sha256',
    gitHistoryIncluded:false,isAdaptedExport:false},proposed,observed:expected,admissions,
    required:{code:['package.json'],model:['public/models/fixture.glb'],notice:['LICENSE']}};
  assert.equal(validateSourceSnapshot(declaration).consistencyOnly,true);
  await put(root,'extra.txt','unlisted');
  const observed=await collectObservedSnapshot(root);
  assert(observed.some(row=>row.path==='extra.txt'));
  assert.throws(()=>validateSourceSnapshot({...declaration,observed}),error=>
    error instanceof SnapshotValidationError&&error.code==='INVENTORY_SET');
}));

test('empty, missing, file and noncanonical root aliases refuse',async()=>fixture(async root=>{
  await refuses(root);
  await refuses(join(root,'absent'));
  const file=await put(root,'code.ts','x');
  await refuses(file);
  await refuses(root+sep+'..'+sep+basename(root));
}));

for(const path of [
  '.env','config/private-key.txt','private/data.txt','patient/scan.txt','ct-head/mask.bin',
  'public/original-source.zip','image.dcm','key.pem','bad name.txt',
])test(`forbidden or unsafe filesystem entry ${path} refuses`,async()=>fixture(async root=>{
  await put(root,'safe.ts','safe');
  await put(root,path,'fixture only');
  await refuses(root);
}));

test('file, byte and depth limits, plus malformed options, refuse',async()=>fixture(async root=>{
  await put(root,'a.ts','aa');
  await put(root,'nested/deeper/b.ts','bb');
  await refuses(root,{maxFiles:1});
  await refuses(root,{maxBytes:3});
  await refuses(root,{maxDepth:1});
  for(const options of [{maxFiles:0},{maxFiles:-1},{maxFiles:1.5},{maxFiles:'2'},
    {maxBytes:0},{maxBytes:Infinity},{maxDepth:-1},{maxDepth:1.5},
    {maxFiles:null},{maxBytes:undefined},null,[],{exclude:['extra.txt']},{admitted:true},
    Object.create({maxFiles:2}),{get maxFiles(){throw Error('Accessor must not run');}}])await refuses(root,options);
  let getterRead=false;
  await refuses(root,{get maxBytes(){getterRead=true;return 4;}});
  assert.equal(getterRead,false,'Options must be data, not executable accessors');
}));

test('hardlinked regular file refuses',async t=>fixture(async root=>{
  const source=await put(root,'source.ts','one inode');
  try{await link(source,join(root,'alias.ts'));}
  catch(error){if(unsupportedLink(error)){t.skip(`Hardlinks unavailable: ${error.code}`);return;}throw error;}
  assert.equal((await stat(source)).nlink>=2,true);
  await refuses(root);
}));

test('case-colliding file names refuse when filesystem supports both names',async t=>fixture(async root=>{
  await put(root,'Alpha.ts','upper');
  await put(root,'alpha.ts','lower');
  const names=await readdir(root);
  if(!names.includes('Alpha.ts')||!names.includes('alpha.ts')){
    t.skip('Filesystem folds these names to one entry');return;
  }
  await refuses(root);
}));

for(const [name,make]of [
  ['file',async root=>{
    const target=await put(root,'target.ts','target');
    await symlink(target,join(root,'alias.ts'),'file');
  }],
  ['directory',async root=>{
    await mkdir(join(root,'target'));
    await symlink(join(root,'target'),join(root,'alias'),'junction');
  }],
  ['root',async root=>{
    await put(root,'target.ts','target');
    const alias=join(root,'root-link');
    await symlink(root,alias,'junction');
    return alias;
  }],
])test(`symbolic ${name} alias refuses`,async t=>fixture(async root=>{
  let alias;
  try{alias=await make(root);}
  catch(error){if(unsupportedLink(error)){t.skip(`Symbolic links unavailable: ${error.code}`);return;}throw error;}
  await refuses(name==='root'?alias:root);
}));
