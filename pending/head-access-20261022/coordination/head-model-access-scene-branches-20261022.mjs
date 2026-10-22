// Evaluate the actual scene hook expressions, not copies of the proposed conditions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate/atlas';
const require=createRequire(root+'/package.json'),ts=require('typescript');
function expression(file,hook){
 const text=fs.readFileSync(root+'/'+file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),found=[];
 const visit=node=>{if(ts.isCallExpression(node)&&node.expression.getText(tree)===hook)found.push(node.arguments[0].getText(tree));ts.forEachChild(node,visit);};visit(tree);
 assert.equal(found.length,1,file+' exact hook');
 return values=>new Function(...Object.keys(values),'return ('+found[0]+');')(...Object.values(values));
}
const rootState=expression('app/body-explorer.tsx','useHeadRootSelection');
const nestedState=expression('app/ventricles.tsx','useHeadNestedSelection');
const eyeState=expression('app/eye-layers.tsx','useHeadNestedSelection');
const selected={id:'target',bundle:'selected-bundle'};
const rootDefaults={inlineStudy:false,exam:false,workspace:{mode:'explore'},guidedLearning:false,catalog:{},displayReady:true,selectedId:'target',selected,failed:[],loaded:['selected-bundle'],failureReasons:{},headRootSelection:()=>({status:'selected'})};
for(const reason of ['sign-in','access-denied','unavailable']){
 const values={...rootDefaults,failed:['selected-bundle'],failureReasons:{'selected-bundle':reason}};
 assert.equal(rootState(values).state.reason,reason);
 assert.equal(rootState({...values,exam:true}).state.reason,'practice');
 assert.equal(rootState({...values,guidedLearning:true}).state.reason,'guided');
 assert.equal(rootState({...values,displayReady:false}).state.reason,'unavailable');
 assert.equal(rootState({...values,catalog:null}).state.reason,'unavailable');
 assert.equal(rootState({...values,selected:null}).state.reason,'unavailable');
 assert.equal(rootState({...values,failed:['irrelevant-bundle']}).state.status,'selected','unrequested cause cannot become model-access advice');
}
const nestedDefaults={educationCatalog:{},parent:{},study:'brainstem',selected,practiceSnapshot:null,step:null,health:'ready',initialSelectedId:'target',initialSelection:selected,hasFailed:true,accessNotice:{message:'advisory'},required:['selected-bundle'],failed:['selected-bundle'],failureReasons:{'selected-bundle':'access-denied'},ready:false};
assert.equal(nestedState(nestedDefaults).blocked.reason,'access-denied');
assert.equal(nestedState({...nestedDefaults,failureReasons:{'selected-bundle':'sign-in'}}).blocked.reason,'sign-in');
assert.equal(nestedState({...nestedDefaults,accessNotice:null}).blocked.reason,'unavailable');
assert.equal(nestedState({...nestedDefaults,health:'lost'}).blocked.reason,'unavailable');
assert.equal(nestedState({...nestedDefaults,initialSelection:null}).blocked.reason,'unavailable');
assert.equal(nestedState({...nestedDefaults,practiceSnapshot:{}}).blocked.reason,'practice');
assert.equal(nestedState({...nestedDefaults,step:{}}).blocked.reason,'guided');
assert.equal(nestedState({...nestedDefaults,hasFailed:false,accessNotice:null,ready:true,failureReasons:{'irrelevant-bundle':'sign-in'}}).blocked,null);
assert.equal(nestedState({...nestedDefaults,required:['selected-bundle','other'],failed:['selected-bundle','irrelevant'],failureReasons:{'selected-bundle':'access-denied',irrelevant:'sign-in'}}).blocked.reason,'access-denied','irrelevant sign-in must not outrank required403');
const eyeDefaults={educationCatalog:{},parent:{},selected,step:null,health:'ready',initialSelectedId:'target',initialSelection:selected,failed:true,failureReason:'sign-in',ready:false};
assert.equal(eyeState(eyeDefaults).blocked.reason,'sign-in');assert.equal(eyeState({...eyeDefaults,failureReason:'access-denied'}).blocked.reason,'access-denied');
assert.equal(eyeState({...eyeDefaults,health:'lost'}).blocked.reason,'unavailable');assert.equal(eyeState({...eyeDefaults,initialSelection:null}).blocked.reason,'unavailable');
assert.equal(eyeState({...eyeDefaults,step:{}}).blocked.reason,'guided');assert.equal(eyeState({...eyeDefaults,failed:false,ready:true}).blocked,null);
console.log(JSON.stringify({passed:true,actualAstExpressions:3,practiceAndGuidedPrecedence:true,rendererAndMissingSelectionPrecedence:true,onlyCurrentRequiredOrSelectedFailures:true,noAccessGrant:true}));
