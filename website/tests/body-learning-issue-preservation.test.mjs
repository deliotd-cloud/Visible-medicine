import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {restorePreIssueDetails} from './body-learning-issue-source-inverse.mjs';
import {restorePreCanonicalNavigation} from './canonical-navigation-source-inverse.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),sha=t=>createHash('sha256').update(t).digest('hex');
const once=(text,a,b='')=>{assert.equal(text.split(a).length,2);return text.replace(a,b);};
test('the complete original preservation root and canonical inverse retain every assertion',()=>{
  const oldRoot=read('./fixtures/body-learning-contract-before-issue.test.mjs.raw'),oldHelper=read('./fixtures/canonical-navigation-before-issue.mjs.raw');
  assert.equal(sha(oldRoot),'4644fbfc4ff067c491a075c7a48e039b4259b058d1cffed64031d8ff440758bf');
  assert.equal(sha(oldHelper),'1d9a438e745f6eadb45ef2efb36ebc481e449d206e6d8969c2f68f1007607099');
  const added="import {restorePreIssueDetails} from './body-learning-issue-source-inverse.mjs';\n";
  let root=once(read('./body-learning-contract-preservation.test.mjs'),added);
  root=once(root,"const read = path => {\n  const bytes=readFileSync(new URL(path, import.meta.url));\n  return path==='../components/AtlasBodyLearning.tsx'?Buffer.from(restorePreIssueDetails(bytes.toString())):bytes;\n};","const read = path => readFileSync(new URL(path, import.meta.url));");
  assert.equal(root,oldRoot);
  let helper=once(read('./canonical-navigation-source-inverse.mjs'),added);
  helper=once(helper,'  let text = restorePreIssueDetails(source);',"  let text = source.replaceAll('\\r\\n', '\\n');");
  assert.equal(helper,oldHelper);
});
test('the actual issue-details source maps through both exact original epochs',()=>{
  const current=read('../components/AtlasBodyLearning.tsx');
  assert.equal(sha(current),'36ba41a0c702d4f14f9be9d9b999e258294807ac1b0cd21491ef80630fabd730');
  const prior=restorePreIssueDetails(current);assert.equal(sha(prior),'058b63bd82d999cbc2020bc0e9221990432156f1d943b958b7aed1c222185af7');
  assert.equal(restorePreIssueDetails(prior),prior);
  assert.equal(restorePreCanonicalNavigation(current),read('./fixtures/atlas-body-learning-installed.tsx.raw'));
});
test('changed current context, navigation, entitlement and issue rendering are refused',()=>{
  const current=read('../components/AtlasBodyLearning.tsx');
  for(const[from,to]of [['sameAtlasDocument(src,','sameAtlasDocument(other,'],['Atlas access does not unlock paid lectures.','Atlas unlocks lectures.'],['snapshotRef.current.value!==value','false'],['<AtlasIssueDetails readContext={readIssueContext}/>','<AtlasIssueDetails readContext={()=>null}/>']]){
    assert.equal(current.split(from).length,2);const altered=current.replace(from,to);
    assert.throws(()=>restorePreIssueDetails(altered));assert.throws(()=>restorePreCanonicalNavigation(altered));
  }
});
