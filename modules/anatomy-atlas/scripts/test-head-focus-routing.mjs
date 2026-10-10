import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function callback(path,callName,argument,property){
 const source=readFileSync(path,'utf8'),tree=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found;
 function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(tree)===callName){const arg=node.arguments[argument];found=property?arg.properties.find(p=>p.name?.getText(tree)===property).initializer:arg;}ts.forEachChild(node,visit);}visit(tree);assert(found);
 return ts.transpileModule('const fn='+found.getText(tree)+';', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nreturn fn;';
}
const rootCode=callback('app/body-explorer.tsx','useHeadRootSelection',1),nestedCode=callback('app/ventricles.tsx','useHeadNestedSelection',0,'onFocus');
const candidate={id:'vm:anatomy:body:head-neck:midline:organ:pons',laterality:'midline',bundle:'brain',system:'organs'},source='a'.repeat(64);
const target={kind:'root',id:candidate.id,source,laterality:'midline'};
function root(overrides={}){let calls=[];const scope={document:{hidden:false},initialRegion:'head-neck',exam:false,workspace:{mode:'explore'},guidedLearning:false,inlineStudy:false,displayReady:true,catalog:{bundles:[{id:'brain',sha256:source}]},regionStructures:[candidate],loaded:['brain'],failed:[],resolved:{visible:[candidate]},systems:{organs:true},applySelection:(...args)=>calls.push(args),...overrides};return {run:new Function(...Object.keys(scope),rootCode)(...Object.values(scope)),calls};}
let h=root();assert(h.run(target));assert.deepEqual(h.calls,[[candidate.id,false]],'ordinary selection without camera/dissection reset');
for(const change of [{document:{hidden:true}},{initialRegion:'thorax'},{exam:true},{workspace:{mode:'practice'}},{guidedLearning:true},{inlineStudy:true},{displayReady:false},{catalog:null},{regionStructures:[]},{loaded:[]},{failed:['brain']},{resolved:{visible:[]}},{systems:{organs:false}},{catalog:{bundles:[{id:'brain',sha256:'b'.repeat(64)}]}}]){h=root(change);assert.equal(h.run(target),false);assert.deepEqual(h.calls,[]);}
for(const altered of [{...target,source:'b'.repeat(64)},{...target,laterality:'left'},{...target,kind:'nested'},{...target,id:'foreign'}]){h=root();assert.equal(h.run(altered),false);assert.deepEqual(h.calls,[]);}
function nested(overrides={}){const calls=[];const scope={layers:[candidate],ready:true,pageHidden:false,practiceSnapshot:null,step:null,hidden:[],loaded:['brain'],failed:[],selectableIds:[candidate.id],applySelection:id=>calls.push(id),...overrides};return {run:new Function(...Object.keys(scope),nestedCode)(...Object.values(scope)),calls};}
h=nested();assert(h.run(candidate.id));assert.deepEqual(h.calls,[candidate.id]);
for(const change of [{ready:false},{pageHidden:true},{practiceSnapshot:{}},{step:{}},{layers:[]},{hidden:[candidate.id]},{loaded:[]},{failed:['brain']},{selectableIds:[]}]){h=nested(change);assert.equal(h.run(candidate.id),false);assert.deepEqual(h.calls,[]);}
h=nested();assert.equal(h.run('foreign'),false);assert.deepEqual(h.calls,[]);
console.log(JSON.stringify({passed:true,actualRootAndNestedCallbacks:true,quizLoadingVisibilitySourceGates:true,noCameraReset:true,clinicalAcceptance:false}));
