import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {inverseMedian,inverseVocal} from '../CODE/tests/teaching-consumer-source-inverse.mjs';

const stage=fileURLToPath(new URL('../',import.meta.url));
const frozen='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor';
const atlas='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas';
const require=createRequire(frozen+'/website/package.json');
const ts=require('typescript');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{
  windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});
assert.equal(sha(readFileSync(frozen+'/SOURCE.json')),
  '67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed');

const specs=[
  {
    name:'median',file:'clinical-review-median-cubital-xray.test.ts',inverse:inverseMedian,
    codeSha:'2849d62d65fe498c4378b9705abf8934138dfe5274283c715550182721ed74f4',
    rawSha:'d03860ddeaac152fd082530c5661b79076279508a0f67cb308d3cb9de81ebb09',
    mutations:[
      ['whole pre-neck dispatch restored','partial pre-neck dispatch accepted'],
      ['ffb559ac6ca94d8b5713c2b2aac44aa6b9f47766dd47ff162f6625f51f4e1382',
        '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc'],
    ],
  },
  {
    name:'vocal',file:'clinical-review-vocal-tissue-teaching.test.ts',inverse:inverseVocal,
    codeSha:'2a8564df32041f38ab8f22f368491b04b284abb28f9b5eb442c5942a0450a098',
    rawSha:'569a15c2566b982410be68f9c221f38662518289e9d2b190cf39caf5016ac9e8',
    mutations:[
      ['exact current head-neck learner source','any head-neck source'],
      ['whole vocal feature file retained from pre-neck source','partial vocal feature file retained'],
    ],
  },
];
const result=[];
for(const spec of specs){
  const code=readFileSync(resolve(stage,'CODE/tests',spec.file));
  const raw=readFileSync(resolve(stage,'RAW/tests',spec.file));
  assert.equal(sha(code),spec.codeSha);
  assert.equal(sha(raw),spec.rawSha);
  assert.deepEqual(spec.inverse(code),raw,`${spec.name} full original test-source restored`);
  const source=code.toString('utf8');
  const parsed=ts.createSourceFile(spec.file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length,0,`${spec.name} TypeScript syntax`);
  for(const [from,to] of spec.mutations){
    assert.equal(source.split(from).length,2,`${spec.name} unique mutation target`);
    assert.throws(()=>spec.inverse(Buffer.from(source.replace(from,to))),
      `${spec.name} mutation must fail the complete source inverse`);
  }
  result.push({name:spec.name,codeSha256:spec.codeSha,rawSha256:spec.rawSha,
    fullOriginalRestored:true,parseDiagnostics:0,mutationsRefused:spec.mutations.length});
}
assert.equal(sha(readFileSync(resolve(stage,'CODE/tests/teaching-consumer-source-inverse.mjs'))),
  'c458586d1a840956920fe60d0f093c620a3a68b1cba7ec21f81cd1a69ed7d1c7');

// Read the actual TypeScript AST string values; source-text backslashes are ambiguous.
const medianSource=readFileSync(resolve(stage,'CODE/tests/clinical-review-median-cubital-xray.test.ts'),'utf8');
const medianAst=ts.createSourceFile('median.ts',medianSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const literals=new Map();
let crLiteral=false;
const walk=node=>{
  if(ts.isVariableDeclaration(node)&&['neckImport','neckBranch'].includes(node.name.getText(medianAst)))
    literals.set(node.name.getText(medianAst),node.initializer.text);
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&
    node.expression.expression.getText(medianAst)==='currentText'&&
    node.expression.name.text==='includes'&&node.arguments[0]?.text==='\r')crLiteral=true;
  ts.forEachChild(node,walk);
};
walk(medianAst);
assert.equal(crLiteral,true,'CR check evaluates an actual carriage return');
const neckImport=literals.get('neckImport'),neckBranch=literals.get('neckBranch');
assert.equal(neckImport?.endsWith('\n'),true);
assert.equal(neckBranch?.split('\n').length-1,2);
const current=git('show','389bd0ca846a42c7f21055f55904bcf5df81a09f:app/body-content.ts');
const prior=git('show','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:app/body-content.ts');
const currentText=current.toString('utf8');
assert.ok(Buffer.from(currentText,'utf8').equals(current)&&!currentText.includes('\r'));
assert.equal(currentText.split(neckImport).length,2);
assert.equal(currentText.split(neckBranch).length,2);
assert.deepEqual(Buffer.from(currentText.replace(neckImport,'').replace(neckBranch,'')),prior);
assert.equal(sha(prior),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
assert.equal(sha(current),'ffb559ac6ca94d8b5713c2b2aac44aa6b9f47766dd47ff162f6625f51f4e1382');
assert.equal(git('rev-parse','389bd0ca846a42c7f21055f55904bcf5df81a09f^').toString().trim(),
  'da84654113bdd27dbfabd6879d82740c8407f4db');
assert.equal(git('rev-parse','da84654113bdd27dbfabd6879d82740c8407f4db^').toString().trim(),
  '6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');

console.log(JSON.stringify({schema:'vm-two-teaching-source-only-proof-1',
  sourceReceiptSha256:'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed',
  helperSha256:'c458586d1a840956920fe60d0f093c620a3a68b1cba7ec21f81cd1a69ed7d1c7',
  results:result,mutationRefusals:4,syntaxParses:2,
  evaluatedLiterals:{importEndsActualLF:true,branchActualLFCount:2,crCheckActualCR:true},
  committedDispatch:{currentSha256:sha(current),restoredPreNeckSha256:sha(prior),exactInverse:true},
  nativeRun:false}));
