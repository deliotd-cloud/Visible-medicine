import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,relative} from 'node:path';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

// Execute each actual export write-tail with controlled I/O: no disk copies.
for(const moduleName of ['head-neck','shoulder','female-pelvis','lower-limb']) {
  const path=`scripts/export-${moduleName}-module.mjs`;
  const source=await readFile(path,'utf8');
  const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const guard=ast.statements.find(s=>ts.isExpressionStatement(s)&&ts.isAwaitExpression(s.expression)&&
    s.expression.expression.expression?.getText(ast)==='assertExportSpace');
  assert(guard,`${moduleName}: top-level awaited space gate`);
  assert.equal(guard.expression.expression.arguments[0].getText(ast),'target');
  assert.equal(guard.expression.expression.arguments[1].getText(ast),'copies');
  const writes=[];
  function visit(node) {
    if(ts.isCallExpression(node)&&['mkdir','copyFile','writeFile'].includes(node.expression.getText(ast)))writes.push(node);
    if(ts.isCallExpression(node)&&node.expression.getText(ast)==='copies.push')
      assert(node.pos<guard.pos,'All assets/notices must be budgeted before the gate');
    ts.forEachChild(node,visit);
  }
  visit(ast);
  assert(writes.length>0);
  for(const writer of writes)assert(writer.pos>guard.pos,`${moduleName}: no writes before preflight`);
  assert.match(source,/from ['"]\.\/export-space-preflight\.mjs['"]/);
  const tail=source.slice(guard.getStart(ast));
  const config=await readFile(`integration/${moduleName}/vite.config.mjs`,'utf8');
  assert(config.includes(`'${path}'`),'Exporter included in reproducible build inputs');
  assert(config.includes("'scripts/export-space-preflight.mjs'"),'Space helper included in reproducible build inputs');
  const binding=ast.statements.find(s=>ts.isForOfStatement(s)&&s.getText(ast).includes('Missing export source binding:'));
  assert(binding,'Build must reject missing export-helper binding');

  await test(`${moduleName}: unknown or insufficient space aborts before any write`,async()=>{
    for(const code of ['ENOSPC','EACCES','ENOTSUP']) {
      const calls=[];
      const ctx=context(calls,async()=>{calls.push('preflight');throw Object.assign(new Error(code),{code});});
      await assert.rejects(runInNewContext(`(async()=>{${tail}})()`,ctx),e=>e.code===code);
      assert.deepEqual(calls,['preflight']);
    }
  });
  await test(`${moduleName}: sufficient space retains all copies and manifest safeguards`,async()=>{
    const calls=[],ctx=context(calls,async(target,copies)=>{
      assert.equal(target,ctx.target);assert.equal(copies,ctx.copies);calls.push('preflight');
    });
    await runInNewContext(`(async()=>{${tail}})()`,ctx);
    assert.deepEqual(calls,['preflight','mkdir','copy','mkdir','copy','manifest']);
    assert.equal(ctx.saved.patientDataIncluded,false);
    assert.equal(ctx.saved.clinicalApproved,false);
    assert.equal(ctx.saved.sourceCommit,'fixture-source');
    assert.deepEqual(ctx.saved.files.map(f=>f.path),['one.txt','nested/two.txt']);
    for(const f of ctx.saved.files){assert.equal(f.bytes,7);assert.equal(f.sha256,ctx.sha(Buffer.from('fixture')));}
  });
  await test(`${moduleName}: missing helper/exporter build inputs are rejected`,()=>{
    for(const absent of [path,'scripts/export-space-preflight.mjs']) {
      const inputs=[path,'scripts/export-space-preflight.mjs'].filter(p=>p!==absent).map(p=>({path:p}));
      assert.throws(()=>runInNewContext(binding.getText(ast),{inputs}),/Missing export source binding/);
    }
    runInNewContext(binding.getText(ast),{inputs:[{path},{path:'scripts/export-space-preflight.mjs'}]});
  });
}

function context(calls,assertExportSpace) {
  const primary={region:'head-neck',regionalIds:['fixture'],nestedTargets:[]};
  const ctx={resolve,join,relative,sourceCommit:'fixture-source',assertExportSpace,
    target:resolve('.local/export-space-no-write-fixture'),
    copies:[[resolve('fixture-one'),'one.txt'],[resolve('fixture-two'),'nested/two.txt']],
    lstat:async()=>({isFile:()=>true}),readFile:async()=>Buffer.from('fixture'),
    mkdir:async()=>calls.push('mkdir'),copyFile:async()=>calls.push('copy'),
    writeFile:async(path,text)=>{assert.equal(path,join(ctx.target,'manifest.json'));calls.push('manifest');ctx.saved=JSON.parse(text);},
    primary,plan:{defaultRegion:'head-neck',sourceVersion:'fixture',scopes:[primary],bundles:[]},
    raw:{structures:[]},ureters:[],console:{log:()=>{}},
    sha:bytes=>createHash('sha256').update(bytes).digest('hex'),
  };
  ctx.hash=ctx.sha;return ctx;
}
