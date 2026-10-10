import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, writeFile, readFile, realpath, rm, link, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, relative, basename, isAbsolute} from 'node:path';
import {compileReviewedPathPolicy} from './source-snapshot-reviewed-paths.mjs';
import {collectObservedSnapshot} from './source-snapshot-collect.mjs';
import {validateSourceSnapshot, validateSnapshotPath, validateSnapshotPathWithReview,
  SnapshotValidationError} from './source-snapshot-manifest.mjs';

const sourceCommit='a'.repeat(40),sha=b=>createHash('sha256').update(b).digest('hex');
const identity=(path,bytes)=>({path,sha256:sha(bytes),bytes:bytes.length,
  gitBlob:createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')});
const reviewedFiles=new Map([
  ['app/regions/[region]/page.tsx',Buffer.from('export default function Region() { return null; }\n')],
  ['app/scene-recovery.tsx',Buffer.from('export const retry = () => 1;\n')],
  ['app/scene-recovery.css',Buffer.from('.retry { display: flex; }\n')],
]);
const originals=new Map([...reviewedFiles,['package.json',Buffer.from('{}\n')],
  ['public/models/example.glb',Buffer.from([0,1,255,0,128])],['LICENSE',Buffer.from('Synthetic test notice\n')]]);
const proof=id=>({id,revision:'synthetic-fixture-only',sha256:'f'.repeat(64)});
const envelope=()=>({schema:'vm-reviewed-source-names/1',sourceCommit,records:[...reviewedFiles].map(([path,bytes])=>({
  ...identity(path,bytes),role:'code',purpose:path.includes('[region]')?'framework-region-route':'renderer-recovery-code',proof:proof('name-review-only'),
}))});
const policy=()=>compileReviewedPathPolicy(envelope(),sourceCommit);
const options=()=>({sourceCommit,reviewedPathPolicy:policy()});
const role=path=>path==='LICENSE'?'notice':path.endsWith('.glb')?'model':'code';
const fixture=async run=>{
  const root=await mkdtemp(join(tmpdir(),'vm-reviewed-integration-'));
  try{return await run(root);}
  finally{
    const actual=await realpath(root),parent=await realpath(tmpdir()),child=relative(parent,actual);
    assert(child===basename(actual)&&child&&!child.startsWith('..')&&!isAbsolute(child));
    await rm(actual,{recursive:true,force:false});
  }
};
const put=async(root,path,bytes)=>{
  const full=join(root,...path.split('/'));await mkdir(resolve(full,'..'),{recursive:true});await writeFile(full,bytes);return full;
};
const seed=async root=>{for(const [path,bytes]of originals)await put(root,path,bytes);};
const codeIs=code=>error=>error instanceof SnapshotValidationError&&error.code===code;
const complete=observed=>{
  const proposed=observed.map(row=>({...row,role:role(row.path)}));
  const admissions=Object.fromEntries(['code','model','notice'].map(kind=>[kind,proposed.filter(row=>row.role===kind).map(row=>({
    ...row,admitted:true,proof:proof('separate-admission'),...(kind==='model'?{rights:{sourceId:'fixture-public-source',licenseId:'fixture-license',
      evidenceId:'fixture-independent-rights',evidenceRevision:'synthetic-fixture-only',evidenceSha256:'e'.repeat(64),noticePath:'LICENSE',
      commercialUse:true,redistribution:true,derivatives:true,independentlyReviewed:true}}:{}),
  }))]));
  return {stage:{sourceType:'canonical-atlas-working-tree',sourceCommit,filesystemEvidence:'lstat+sha256',gitHistoryIncluded:false,isAdaptedExport:false},
    proposed,observed,admissions,required:Object.fromEntries(['code','model','notice'].map(kind=>[kind,proposed.filter(row=>row.role===kind).map(row=>row.path)])),
    reviewedPathPolicy:policy()};
};

test('opt-in original paths require exact file bytes; ordinary collector shape stays unchanged',async()=>fixture(async root=>{
  await seed(root);await assert.rejects(()=>collectObservedSnapshot(root),codeIs('UNSAFE_PATH'));
  const observed=await collectObservedSnapshot(root,options());assert.equal(observed.length,6);
  assert.deepEqual(observed,await collectObservedSnapshot(root,options()));
  for(const row of observed){const bytes=originals.get(row.path);assert.deepEqual(row,{...identity(row.path,bytes),entryType:'file',isSymbolicLink:false});
    assert.deepEqual(await readFile(join(root,...row.path.split('/'))),bytes);}
  for(const path of reviewedFiles.keys())assert.throws(()=>validateSnapshotPath(path));
  const ordinary=join(root,'ordinary');await mkdir(ordinary);await put(ordinary,'page.tsx',Buffer.from('x'));
  assert.deepEqual(await collectObservedSnapshot(ordinary),[{path:'page.tsx',sha256:sha('x'),bytes:1,entryType:'file',isSymbolicLink:false}]);
}));

test('synthetic complete inventory passes consistency only, with separate admissions still mandatory',async()=>fixture(async root=>{
  await seed(root);const input=complete(await collectObservedSnapshot(root,options()));
  assert.deepEqual(validateSourceSnapshot(input),{consistencyOnly:true,sourceCommit,fileCount:6,codeDeclarations:4,modelDeclarations:1,noticeDeclarations:1});
  const without=()=>({...structuredClone({...input,reviewedPathPolicy:undefined}),reviewedPathPolicy:input.reviewedPathPolicy});
  for(const [change,code]of[
    [x=>{delete x.reviewedPathPolicy;},'UNSAFE_PATH'],
    [x=>{x.admissions.code=[];},'MISSING_ADMISSION'],
    [x=>{x.admissions.code[0].admitted=false;},'NOT_ADMITTED'],
    [x=>{delete x.admissions.code[0].proof;},'SCHEMA'],
    [x=>{x.admissions.model[0].rights.independentlyReviewed=false;},'MODEL_RIGHTS'],
    [x=>{x.admissions.model[0].rights.noticePath='NOTICE';},'MISSING_MODEL_NOTICE'],
    [x=>{x.observed[0].isSymbolicLink=true;},'NONREGULAR_FILE'],
    [x=>{x.stage.sourceCommit='b'.repeat(40);},'REVIEWED_POLICY_SOURCE'],
    [x=>{x.reviewedPathPolicy={};},'REVIEWED_TOKEN'],
  ]){const x=without();change(x);assert.throws(()=>validateSourceSnapshot(x),codeIs(code));}
}));

test('every reviewed declaration independently binds SHA-256, Git blob, size and code role',async()=>fixture(async root=>{
  await seed(root);const observed=await collectObservedSnapshot(root,options());
  for(const section of ['proposed','observed','admission'])for(const key of ['sha256','gitBlob','bytes']){
    const x=complete(structuredClone(observed));const rows=section==='admission'?x.admissions.code:x[section];
    const row=rows.find(r=>r.path==='app/scene-recovery.tsx');row[key]=key==='bytes'?row[key]+1:'1'.repeat(key==='gitBlob'?40:64);
    assert.throws(()=>validateSourceSnapshot(x),codeIs('REVIEWED_IDENTITY_MISMATCH'),`${section}.${key}`);
  }
  for(const section of ['proposed','observed','admission']){
    const x=complete(structuredClone(observed)),rows=section==='admission'?x.admissions.code:x[section];
    rows.find(r=>r.path==='app/scene-recovery.tsx').role='notice';
    assert.throws(()=>validateSourceSnapshot(x),codeIs('ROLE_FORMAT'));
  }
  await put(root,'app/scene-recovery.tsx',Buffer.from('changed'));
  await assert.rejects(()=>collectObservedSnapshot(root,options()),codeIs('REVIEWED_IDENTITY_MISMATCH'));
}));

test('source binding and opaque token are checked before reading the stage',async()=>fixture(async root=>{
  for(const [opts,code]of[
    [{sourceCommit:'b'.repeat(40),reviewedPathPolicy:policy()},'REVIEWED_POLICY_SOURCE'],
    [{sourceCommit,reviewedPathPolicy:{}},'REVIEWED_TOKEN'],
    [{sourceCommit},'REVIEWED_POLICY_SOURCE'],
    [{reviewedPathPolicy:policy()},'REVIEWED_POLICY_SOURCE'],
    [{sourceCommit,reviewedPathPolicy:undefined},'REVIEWED_POLICY_SOURCE'],
  ])await assert.rejects(()=>collectObservedSnapshot(root,opts),codeIs(code));
  let accessed=false;const getter={sourceCommit};Object.defineProperty(getter,'reviewedPathPolicy',{enumerable:true,get(){accessed=true;return policy();}});
  await assert.rejects(()=>collectObservedSnapshot(root,getter),codeIs('COLLECTION_LIMIT'));assert.equal(accessed,false);
}));

test('only the exact route ancestor is a directory exception; aliases and private formats remain held',async()=>{
  const p=policy();assert.equal(validateSnapshotPathWithReview('app/regions/[region]',p,'directory'),'app/regions/[region]');
  for(const path of ['app/regions/[region]','app/regions/[other]/page.tsx','app/regions/[region]/extra.tsx','app/SCENE-recovery.tsx',
    'app/scene-recovery-copy.tsx','app/scene-recovery.tsx/child.ts','candidate/model.glb','private/data.json','scans/scan.dcm',
    'public/original-source.zip','ct-head/masks.json','.env','app/../scene-recovery.tsx'])assert.throws(()=>validateSnapshotPathWithReview(path,p),SnapshotValidationError,path);
  assert.throws(()=>validateSnapshotPathWithReview('app/scene-recovery.tsx',p,'directory'),codeIs('FORBIDDEN_PATH'));
  await fixture(async root=>{await seed(root);await put(root,'app/regions/[region]/extra.tsx',Buffer.from('x'));
    await assert.rejects(()=>collectObservedSnapshot(root,options()),codeIs('UNSAFE_PATH'));});
  await fixture(async root=>{await put(root,'app/regions/[region]',Buffer.from('not a directory'));
    await assert.rejects(()=>collectObservedSnapshot(root,options()),codeIs('UNSAFE_PATH'));});
  await fixture(async root=>{await mkdir(join(root,'app','scene-recovery.tsx'),{recursive:true});
    await assert.rejects(()=>collectObservedSnapshot(root,options()),codeIs('FORBIDDEN_PATH'));});
});

test('reviewed names cannot bypass hardlink or directory-junction refusal',async()=>fixture(async root=>{
  const original=await put(root,'app/scene-recovery.tsx',reviewedFiles.get('app/scene-recovery.tsx'));
  await link(original,join(root,'alias.tsx'));
  await assert.rejects(()=>collectObservedSnapshot(root,options()),codeIs('NONREGULAR_FILE'));
  await fixture(async target=>{
    await put(target,'page.tsx',reviewedFiles.get('app/regions/[region]/page.tsx'));
    await fixture(async holder=>{
      await mkdir(join(holder,'app','regions'),{recursive:true});
      await symlink(target,join(holder,'app','regions','[region]'),process.platform==='win32'?'junction':'dir');
      await assert.rejects(()=>collectObservedSnapshot(holder,options()),SnapshotValidationError);
    });
  });
}));
