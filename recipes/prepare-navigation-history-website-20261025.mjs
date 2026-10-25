import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';

const parentFile='F:/VisibleMedicine/staging/20261025-private-review-typed-website/SOURCE_CANDIDATE.json';
const parentSha='1dc597765ecc6838a09fa2bfb152a7fda450f9e450ca46ae7f2fa2ae55b7f02f';
const parent=json(parentFile),stage='F:/VisibleMedicine/staging/20261025-navigation-history-website',site=stage+'/website';
const changed='tests/head-view-history-client.test.mjs';
const proposal='F:/VisibleMedicine/staging/20261025-head-history-harness-proposal/head-view-history-client.proposed.mjs';
const memory=memoryGate(2048);assert(!fs.existsSync(stage));assert.equal(hash(parentFile),parentSha);
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
assert.equal(hash(parent.website+'/'+changed),'d420ca293609f7d8feea622f3f664603c2f4e77cf60caf45bdf556182bcc6a16');
assert.equal(hash(proposal),'58c81211c27c1965a5b1f4fc41790606b1d1572cff8eb369da67b07e8bb1bb8f');
const require=createRequire(parent.website+'/package.json'),ts=require('typescript');
function assertions(file){
  const text=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),expressions=[],titles=[];
  function visit(node){
    if(ts.isCallExpression(node)){
      const callee=node.expression.getText(tree);
      if(callee==='assert'||callee.startsWith('assert.'))expressions.push(node.getText(tree));
      if(callee==='test')titles.push(node.arguments[0].getText(tree));
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);return{expressions,titles};
}
const before=assertions(parent.website+'/'+changed),after=assertions(proposal);
assert.deepEqual(after.titles,before.titles);assert.equal(before.titles.length,6);
let cursor=0;for(const expression of after.expressions)if(expression===before.expressions[cursor])cursor++;
assert.equal(cursor,before.expressions.length,'Every original assertion expression remains verbatim and ordered');
assert(after.expressions.length>before.expressions.length);
const canonical='F:/VisibleMedicine/website';
assert.equal(execFileSync('git',['-C',canonical,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
fs.mkdirSync(stage);
execFileSync('git',['--no-replace-objects','clone','--shared','--no-checkout','--',canonical,site],{windowsHide:true,stdio:'pipe',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}});
execFileSync('git',['-C',site,'config','--local','core.autocrlf','false'],{windowsHide:true});
execFileSync('git',['-C',site,'read-tree','HEAD'],{windowsHide:true});
for(const r of parent.sourceRows){fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
for(const r of ['next-env.d.ts','.next/types/routes.d.ts'])if(!fs.existsSync(site+'/'+r)&&fs.existsSync(parent.website+'/'+r)){fs.mkdirSync(path.dirname(site+'/'+r),{recursive:true});fs.copyFileSync(parent.website+'/'+r,site+'/'+r,fs.constants.COPYFILE_EXCL);}
fs.copyFileSync(parent.website+'/'+changed,stage+'/HISTORY_TEST_BEFORE.raw');
fs.copyFileSync(proposal,site+'/'+changed);
const rows=parent.sourceRows.map(r=>r.path===changed?{path:changed,bytes:fs.statSync(site+'/'+changed).size,sha256:hash(site+'/'+changed)}:{...r});
for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const report={...parent,schema:'vm-navigation-history-harness-source-candidate/1',at:new Date().toISOString(),website:site,parent:parentFile,parentSha256:parentSha,sourceRows:rows,changedPaths:[changed],addedPaths:[],removedPaths:[],historyTestRepair:{path:changed,beforeSha256:hash(stage+'/HISTORY_TEST_BEFORE.raw'),afterSha256:hash(site+'/'+changed),originalAssertionExpressions:before.expressions.length,finalAssertionExpressions:after.expressions.length,allOriginalAssertionsVerbatimOrdered:true,allOriginalCaseTitlesAndOrderPreserved:true,strictCapturePhaseBrowserSurface:true,actualViewerGuardCancellationAndCleanupAsserted:true},allShippedApplicationNativeRuntimeReviewModelLicenceAccessAndTypescriptBytesUnchanged:true,newProductionBuildExecuted:false,newFullTypesExecuted:false,installed:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),memory,parentReceipt:parentFile,parentSha256:parentSha,parentWebsite:parent.website,sourceOnlyCopy:true,privateStateCopied:false,onlyChangedPath:changed,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:rows.length,assertions:{before:before.expressions.length,after:after.expressions.length},onlyChangedPath:changed}));
