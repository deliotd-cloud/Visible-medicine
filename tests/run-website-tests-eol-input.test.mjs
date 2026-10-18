import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {main} from '../scripts/run-website-tests.mjs';

const local=fileURLToPath(new URL('../.local/runner-eol-fixtures/',import.meta.url));
mkdirSync(local,{recursive:true});
function fixture(testBody){
 const root=mkdtempSync(join(local,'policy-'));
 mkdirSync(join(root,'tests'));
 writeFileSync(join(root,'package.json'),'{"type":"module"}\n');
 writeFileSync(join(root,'.gitattributes'),'tests/fixtures/exact.txt -text\n');
 writeFileSync(join(root,'tests','policy.test.mjs'),testBody);
 return root;
}
async function capture(root,run=false){
 const prior=console.log;
 let summary;
 console.log=line=>{summary=JSON.parse(line);};
 try{
  const code=await main(['--root',root,...(run?['--run']:[])]);
  return {code,manifest:JSON.parse(readFileSync(join(summary.output,'manifest.json'))),receipt:JSON.parse(readFileSync(join(summary.output,'receipt.json')))};
 }finally{console.log=prior;}
}

test('Git byte policy is a named, exactly fingerprinted source input',async()=>{
 const root=fixture("import test from 'node:test';test('stable policy',()=>{});\n");
 const result=await capture(root);
 const bytes=readFileSync(join(root,'.gitattributes'));
 assert(result.manifest.sourceScope.rootFiles.includes('.gitattributes'));
 assert.deepEqual(result.manifest.files.filter(file=>file.path==='.gitattributes'),[
  {path:'.gitattributes',sha256:createHash('sha256').update(bytes).digest('hex')},
 ]);
 assert.equal(result.receipt.launched,false);
});

test('a successful child cannot claim a pass after its Git byte policy changes',async()=>{
 const root=fixture("import test from 'node:test';import {appendFileSync} from 'node:fs';test('policy drift',()=>appendFileSync('.gitattributes','# changed synthetic policy\\n'));\n");
 const result=await capture(root,true);
 assert.equal(result.receipt.child.exitCode,0);
 assert.equal(result.code,1);
 assert.equal(result.receipt.testInputDrift,true);
 assert.equal(result.receipt.passingClaim,false);
 assert.equal(result.receipt.unskippedPassingClaim,false);
 assert.equal(result.receipt.counts.pass,1);
});
