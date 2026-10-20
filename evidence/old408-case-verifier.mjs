import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261020-old408-reviewed';
const ts=createRequire('F:/VisibleMedicine/staging/20261020-combined-website-ui/website/package.json')('typescript');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(folder,name)=>fs.readFileSync(stage+'/'+folder+'/tests/'+name);
const definitions=[
 ['regional-learning-catalogue-history.ts','335ebdfa5c9118d3bec6b4240d432d185cc833459c76d7f7d7564ad1abdfdda2','59e5289e64ee679867674bbf2263de2f8ff17b9c15add6f2ddd237aa1847ebd9'],
 ['regional-learning-catalogue.test.ts','7b981a547e76884fbf36859c7bdaafdddbeaac4c96491351bb63ce5537ad86fa','f5af041cb20771770342ad7abbb3a3b93dddd504fa4adfae6a963bfc39ee3093'],
 ['regional-mri-inline-inspection.test.ts','a8bf4d07138bbf0824330f1e98678b3f4cd2fa4108e3d043eb3edba277cb2474','732bff1b7b9ffae2b3f2f4cbc54d8b38b6cd3fd7631aa5f2918a007bf1b2865f'],
];
const parsed=text=>ts.createSourceFile('proof.ts',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
function cases(text){const file=parsed(text),result=new Map();for(const statement of file.statements){if(!ts.isExpressionStatement(statement)||!ts.isCallExpression(statement.expression))continue;const call=statement.expression;if(call.expression.getText(file)!=='test')continue;assert(ts.isStringLiteral(call.arguments[0]));const name=call.arguments[0].text;assert(!result.has(name));result.set(name,call.getText(file));}return result;}
function originalCasesRetained(name,before,after){
 const old=cases(before),next=cases(after);assert(old.size>0);
 for(const [title,body] of old){let actual=next.get(title);assert(actual,'Original case remains registered: '+title);
  if(name==='regional-learning-catalogue.test.ts'&&title.startsWith('current51 tours/309'))actual=actual.replace('assertHistoricalRegionalSource();','assertCurrentRegionalSource();');
  if(name==='regional-mri-inline-inspection.test.ts')actual=actual.replace("  assert.equal(regionalMriInlineManifestCurrent(proof,target.kind==='body'?currentBodyManifest:currentSpecimenManifest),false,\n    'old 408 proof must not be admitted by current 87ed delivery');\n",'');
  assert.equal(actual,body,'Every original test body/assertion retained: '+title);
 }
 return {originalCases:old.size,newCases:next.size-old.size};
}
const result=[];
for(const [name,beforeHash,afterHash] of definitions){
 const before=read('before',name),after=read('files',name);assert.equal(sha(before),beforeHash);assert.equal(sha(after),afterHash);
 if(name.endsWith('.test.ts')){
  const counts=originalCasesRetained(name,before.toString(),after.toString());
  const firstOriginal=[...cases(before.toString()).keys()][0],registered=cases(after.toString()).get(firstOriginal);
  assert(registered.includes('assert.equal('),'The negative witness must target an original registered assertion');
  const mutated=registered.replace('assert.equal(','assert.notEqual(');assert.notEqual(mutated,registered);
  assert.throws(()=>originalCasesRetained(name,before.toString(),after.toString().replace(registered,mutated)),'An original assertion mutation must fail');
  result.push({name,...counts});
 }else{
  const original=before.toString(),next=after.toString(),marker='/** Every first-party import comes from the same committed Atlas epoch.';
  assert.equal(original.split(marker).length,2);assert.equal(next.split(marker).length,2);
  assert.equal(next.slice(next.indexOf(marker)),original.slice(original.indexOf(marker)),'Entire original Git-only legacy/portal replay body remains exact');
  assert(next.includes("const root=checkedAtlasHistoryRepo(source);"));
  assert(next.includes("const live=checkedAtlasSourceRepo(currentSource);"));
  result.push({name,originalGitReplayBodyExact:true,historicalCurrentSeparated:true});
 }
}
console.log(JSON.stringify({schema:'vm-old408-original-case-preservation/1',files:result,scope:'Registered original case-body and legacy Git replay preservation, not a whole-source inverse, browser acceptance or clinical approval.'}));
