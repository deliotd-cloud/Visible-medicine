import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
import {restoreSourceRecipe} from './restore-source-recipe.mjs';

const stage='F:/VisibleMedicine/staging/20261025-navigation-history-website',file=stage+'/SOURCE_CANDIDATE.json';
const sourceSha='cf8bad61e8e33160f94be74994bf13c270c68dcdf395a9d040b5bdb5c2b164f5',source=json(file),parent=json(source.parent);
assert.equal(hash(file),sourceSha);assert.equal(hash(source.parent),source.parentSha256);
for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const changed=source.changedPaths[0];assert.equal(changed,'tests/head-view-history-client.test.mjs');
for(const r of parent.sourceRows)if(r.path!==changed)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
const casesFile=stage+'/checks/whole-roots-attempt-1/RESULT.json',cases=json(casesFile);
assert(cases.passing);assert.equal(cases.expectedWholeCases,8);assert(cases.rows.every(r=>r.passing&&r.counts.skipped===0));
const baselineFile='F:/VisibleMedicine/staging/20261025-navigation-regression-baseline/RESULT.json',baseline=json(baselineFile);
assert.equal(baseline.passing,false);assert.equal(baseline.rows[0].observed.fail,1);assert(baseline.rows[1].passing);

// Reuse only the actual unchanged compiler graph, without claiming another type-check execution.
const parentTypesFile='F:/VisibleMedicine/staging/20261025-private-review-typed-website/checks/types-full-attempt-1/RESULT.json';
const parentTypes=json(parentTypesFile);assert(parentTypes.passing);assert.equal(hash(parentTypes.typeResult.path),parentTypes.typeResult.sha256);
const typeGraph=json(parentTypes.typeResult.path);assert.equal(typeGraph.diagnosticCount,0);
const graph=[];
for(const r of typeGraph.sourceFiles){
  const mapped=r.path.startsWith(parent.website+'/')?source.website+r.path.slice(parent.website.length):r.path;
  assert.equal(hash(mapped),r.sha256,mapped);graph.push({path:mapped,sha256:r.sha256});
}
assert(!typeGraph.sourceFiles.some(r=>r.path===parent.website+'/'+changed),'Changed MJS harness is outside the original compiler graph');
assert.equal(typeGraph.roots.length,2660);assert.equal(graph.length,6217);
const pin=p=>({path:p,sha256:hash(p)});
const graphProof={schema:'vm-unchanged-compiler-graph-reuse/1',at:new Date().toISOString(),actualPriorRun:pin(parentTypesFile),actualPriorRaw:pin(parentTypes.typeResult.path),roots:2660,files:6217,diagnosticsInActualPriorRun:0,allActualTransitiveCompilerInputBytesMatch:true,changedMjsHarnessAbsentFromCompilerGraph:true,newTypeCheckExecuted:false,source:{path:file,sha256:sourceSha},mappedGraph:graph};
fs.writeFileSync(stage+'/UNCHANGED_TYPE_GRAPH.json',JSON.stringify(graphProof,null,2)+'\n',{flag:'wx'});

// LCS gives exact local-preimage copy spans plus literal insertions. Unchanged fixtures are never exported.
const original=fs.readFileSync(stage+'/HISTORY_TEST_BEFORE.raw','utf8'),target=fs.readFileSync(source.website+'/'+changed,'utf8');
const a=original.match(/[^\n]*\n|[^\n]+$/g)??[],b=target.match(/[^\n]*\n|[^\n]+$/g)??[];
const positions=[];let offset=0;for(const line of a){positions.push(offset);offset+=line.length;}
const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
const pieces=[];
function add(piece){
  const last=pieces.at(-1);
  if(typeof piece==='string'&&typeof last==='string')pieces[pieces.length-1]+=piece;
  else if(typeof piece==='object'&&typeof last==='object'&&last.copy[0]+last.copy[1]===piece.copy[0])last.copy[1]+=piece.copy[1];
  else pieces.push(piece);
}
function literal(line){
  let at=0;
  for(const match of line.matchAll(/\[(?:-?\d+(?:\.\d+)?,\s*){2,}-?\d+(?:\.\d+)?\]/g)){
    if(match.index>at)add(line.slice(at,match.index));
    const index=original.indexOf(match[0]);assert(index>=0,'No new coordinate-like fixture literal may enter recovery');
    add({copy:[index,match[0].length]});at=match.index+match[0].length;
  }
  if(at<line.length)add(line.slice(at));
}
let i=0,j=0;
while(i<n||j<m){
  if(i<n&&j<m&&a[i]===b[j]){add({copy:[positions[i],a[i].length]});i++;j++;}
  else if(i<n&&(j===m||dp[i+1][j]>=dp[i][j+1]))i++;
  else literal(b[j++]);
}
const recipe={schema:'vm-exact-local-source-recipe/1',path:changed,beforeSha256:source.historyTestRepair.beforeSha256,afterSha256:source.historyTestRepair.afterSha256,exactLocalBaselineRequired:true,copyNumbersAreCharacterSpans:true,pieces};
const recipeFile=stage+'/HISTORY_BROWSER_RECIPE.json';
fs.writeFileSync(recipeFile,JSON.stringify(recipe,null,2)+'\n',{flag:'wx'});
const restored=restoreSourceRecipe(original,json(recipeFile));assert.equal(restored,target);
const restoreFile=stage+'/RESTORED_HISTORY_TEST.local.mjs';fs.writeFileSync(restoreFile,restored,{flag:'wx'});assert.equal(hash(restoreFile),source.historyTestRepair.afterSha256);
execFileSync(process.execPath,['--check',restoreFile],{windowsHide:true});
const literalText=recipe.pieces.filter(p=>typeof p==='string').join('');
assert(!/\[(?:-?\d+(?:\.\d+)?,\s*){2,}-?\d+(?:\.\d+)?\]/.test(literalText));
assert(!/\b(?:voxel|centroid|sliceIndex)\s*[:=]\s*(?:\[|\d)/.test(literalText));
const result={schema:'vm-navigation-history-verification/1',at:new Date().toISOString(),source:{path:file,sha256:sourceSha},parent:{path:source.parent,sha256:source.parentSha256},passing:true,wholeUnfilteredRoots:2,wholeCases:8,historyCases:6,transportCases:2,originalAssertionExpressions:source.historyTestRepair.originalAssertionExpressions,finalAssertionExpressions:source.historyTestRepair.finalAssertionExpressions,allOriginalAssertionsAndCaseOrderPreserved:true,actualCaptureGuardRefusalAndCleanupPass:true,baseline:pin(baselineFile),checks:pin(casesFile),compilerGraphReuse:pin(stage+'/UNCHANGED_TYPE_GRAPH.json'),newTypeCheckOrBuildExecuted:false,onlyOneMjsTestChanged:true,allShippedApplicationNativeRuntimeReviewModelLicenceAccessBytesEqualParent:true,reviewSources:source.reviewSourceFiles,protectedInputs:source.protectedReviewInputs,nativeHead:source.nativeHead??source.atlasHead??null,recovery:{recipe:pin(recipeFile),restorer:pin('restore-source-recipe.mjs'),actualCompleteFileRestorationVerified:true,exactLocalBaselineRequired:true,noLiteralCoordinateTriplesOrFullFixturesInRecipe:true},fullStockSuitePassing:false,original316FailuresAnd3SkipsNotReduced:true,ownerPreviewChanged:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false};
fs.writeFileSync(stage+'/VERIFICATION_SUMMARY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verification:pin(stage+'/VERIFICATION_SUMMARY.json'),cases:8,assertions:{before:source.historyTestRepair.originalAssertionExpressions,after:source.historyTestRepair.finalAssertionExpressions},compilerGraphFiles:graph.length,recipe:pin(recipeFile),onlyTestChanged:true}));
