import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-nested-tour-library-pause',prep=json(root+'/PREPARATION.json'),site=prep.atlas;
const ts=createRequire(site+'/package.json')('typescript'),normal=b=>b.toString().replaceAll('\r\n','\n');
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),prep.head);
assert.equal(runGit(['-C',site,'rev-parse','HEAD^{tree}']).toString().trim(),prep.tree);
const old=p=>normal(runGit(['-C',site,'show',prep.head+':'+p]));
const restoreOne=(text,part)=>{assert.equal(text.split(part).length,2,'One exact added declaration');return text.replace(part,'');};
const assertions=[];
for(const[p,name]of [['app/eye-layers.tsx','EyeLayerView'],['app/ventricles.tsx','VentricularView']]){
 const original=old(p),current=normal(read(site+'/'+p));
 const source=ts.createSourceFile(p,current,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=source.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);assert(fn?.body);
 const additions=fn.body.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>['validPauseRequest','lastPauseRequest'].includes(d.name.getText(source)))
  ||ts.isExpressionStatement(s)&&ts.isCallExpression(s.expression)&&s.expression.expression.getText(source)==='useLayoutEffect'&&s.getText(source).includes('lastPauseRequest'));
 assert.equal(additions.length,3,'Only the request predicate, request ref and commit effect are new statements');
 const addedText=additions.map(s=>s.getText(source)).join('\n');
 assert(addedText.includes("typeof pauseRequest === 'number' && Number.isSafeInteger(pauseRequest) && pauseRequest >= 0"));assert(addedText.includes('pauseTour()'));
 assert(addedText.includes('if (!validPauseRequest || pauseRequest === lastPauseRequest.current) return;'));
 assert(addedText.includes('pauseRequest === lastPauseRequest.current'));
 let restored=current;
 for(const s of [...additions].sort((a,b)=>b.getFullStart()-a.getFullStart()))restored=restored.slice(0,s.getFullStart())+restored.slice(s.end);
 restored=restoreOne(restored,'  pauseRequest,\n');restored=restoreOne(restored,'  pauseRequest?: number;\n');
 assert.equal(restored,original,p+': every prior component byte survives normalized line endings');
 assertions.push({path:p,originalSha256:sha(read(root+'/preimage/'+p)),sourceSha256:sha(read(site+'/'+p)),priorSourceRestoredAfterCrLfNormalization:true});
}
const p='app/whole-body-guided-learning.tsx',text=normal(read(site+'/'+p));
const prop=' initialGuidedLearningExpanded pauseRequest={pauseRequest}';assert.equal(text.split(prop).length,3);
assert.equal(text.replaceAll(prop,' initialGuidedLearningExpanded'),old(p),'Only the two nested signal props change; all existing markup and library behavior remain exact');
assertions.push({path:p,originalSha256:sha(read(root+'/preimage/'+p)),sourceSha256:sha(read(site+'/'+p)),twoAddedSignalPropsOnly:true});
const dirty=runGit(['-C',site,'status','--porcelain','-uall']).toString().trimEnd().split('\n').filter(Boolean).map(s=>s.slice(3).replaceAll('\\','/'));
const allowed=new Set([...assertions.map(r=>r.path),'scripts/test-nested-tour-library-pause.mjs','scripts/nested-tour-pause-test-loader.mjs']);
for(const p of dirty)assert(allowed.has(p),'Exclusive ownership violation: '+p);
assert.equal(runGit(['-C',prep.baseline,'status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
const report={at:new Date().toISOString(),source:prep.head,tree:prep.tree,assertions,dirtyPaths:dirty,
 scopesPreserved:'Every pre-existing component byte including manual controls, timing, captions, data, source/hold, imaging and review behavior restores exactly after CRLF normalization. Only two optional numeric props, two predicates/refs/commit effects and two signal bindings are admitted.',
 schema:'vm.nested-library-pause-source-review/1',sourceOnlySparseCheckout:true,fullTypesBuildBrowserPending:true,reviewRuntimeRebindingPending:true,previewChanged:false,installed:false,clinicalApproval:false};
fs.writeFileSync(root+'/SOURCE_REVIEW.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/SOURCE_REVIEW.json',sha256:sha(read(root+'/SOURCE_REVIEW.json')),productFiles:assertions.length,priorSourcePreserved:true,previewChanged:false}));
