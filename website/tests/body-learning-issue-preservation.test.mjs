import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const sourceBase=process.env.VM_PRESERVATION_SOURCE_TESTS?pathToFileURL(process.env.VM_PRESERVATION_SOURCE_TESTS+'/'):new URL('./',import.meta.url);
const {restorePreIssueDetails}=await import(new URL('./body-learning-issue-source-inverse.mjs',sourceBase));
const {restorePreCanonicalNavigation}=await import(new URL('./canonical-navigation-source-inverse.mjs',sourceBase));
const read=p=>readFileSync(new URL(p,sourceBase),'utf8'),sha=t=>createHash('sha256').update(t).digest('hex');
const once=(text,a,b='')=>{assert.equal(text.split(a).length,2);return text.replace(a,b);};
test('the complete original preservation root and canonical inverse retain every assertion',()=>{
  const oldRoot=read('./fixtures/body-learning-contract-before-issue.test.mjs.raw'),oldHelper=read('./fixtures/canonical-navigation-before-issue.mjs.raw');
  assert.equal(sha(oldRoot),'4644fbfc4ff067c491a075c7a48e039b4259b058d1cffed64031d8ff440758bf');
  assert.equal(sha(oldHelper),'1d9a438e745f6eadb45ef2efb36ebc481e449d206e6d8969c2f68f1007607099');
  const added="import {restorePreIssueDetails} from './body-learning-issue-source-inverse.mjs';\n";
  let root=read('./body-learning-contract-preservation.test.mjs');
  root=once(root,"import {pathToFileURL} from 'node:url';\nconst sourceBase=process.env.VM_HISTORY_SOURCE_TESTS?\n  pathToFileURL(process.env.VM_HISTORY_SOURCE_TESTS+'/'):new URL('./',import.meta.url);\nconst {restorePreCanonicalNavigation}=await import(new URL('./canonical-navigation-source-inverse.mjs',sourceBase));\nconst {restorePreKeyboardHelp}=await import(new URL('./keyboard-help-source-inverse.mjs',sourceBase));\nconst {restorePreIssueDetails}=await import(new URL('./body-learning-issue-source-inverse.mjs',sourceBase));\n",
   "import {restorePreCanonicalNavigation} from './canonical-navigation-source-inverse.mjs';\nimport {restorePreKeyboardHelp} from './keyboard-help-source-inverse.mjs';\n");
  root=once(root,"const read = path => {\n  const bytes=readFileSync(new URL(path, sourceBase));\n  return path==='../components/AtlasBodyLearning.tsx'?Buffer.from(restorePreIssueDetails(bytes.toString())):bytes;\n};","const read = path => readFileSync(new URL(path, import.meta.url));");
  root=once(root,"  const current=read('./atlas-body-learning-component.test.mjs');\n  assert.equal(sha(current),'edad2769b2afdd3316d1470c8c72a5321e861638f93bae12ba2e51a7ff4e3bb6',\n    'exact later component test root');\n  // The later guided-caption role is also declared in complete-release-five-followups-preservation.\n  let restored=current.toString('utf8');\n  restored=once(restored,\"import {restorePreGuidedCaption} from './head-guided-caption-inverse.mjs';\\n\",'');\n  restored=once(restored,\n    \"name==='HeadAtlasGuidedModel'?restorePreGuidedCaption(candidate):candidate\",\n    'candidate');\n  assert.equal(sha(Buffer.from(restored)),\n    '77047b19fb6aaa40b79f3395799a34a28c6cb5620dc7dc6cb0276cfe72315ca5');\n  assert.deepEqual(Buffer.from(restored),\n    read('./fixtures/atlas-body-learning-component.current-original.test.mjs.raw'));\n  assert.throws(()=>once(current.toString('utf8').replace('restorePreGuidedCaption(candidate)',\n    'restorePreGuidedCaption(other)'),\"name==='HeadAtlasGuidedModel'?restorePreGuidedCaption(candidate):candidate\",'') );",
   "  assert.equal(sha(read('./atlas-body-learning-component.test.mjs')),\n    '77047b19fb6aaa40b79f3395799a34a28c6cb5620dc7dc6cb0276cfe72315ca5');\n  assert.deepEqual(read('./atlas-body-learning-component.test.mjs'),\n    read('./fixtures/atlas-body-learning-component.current-original.test.mjs.raw'));");
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
