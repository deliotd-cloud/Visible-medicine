import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:`
export * from './lib/study-close-up-label';
export {kneeStudySets} from './lib/knee-studies';
export {elbowStudySets} from './content/elbow-studies';
export {cubitalStudies} from './content/cubital-studies';
export {genicularStudy} from './content/genicular-study';
export {poplitealVesselStudy} from './content/popliteal-vessel-study';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const source=await readFile('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body.tsx',source,99,true,ts.ScriptKind.TSX);
let expression;
function visit(node){
  if(ts.isJsxElement(node)&&node.openingElement.attributes.properties.some(attr=>
    ts.isJsxAttribute(attr)&&attr.name.text==='className'&&attr.initializer?.text==='body-canvas-caption')){
    expression=node.children.find(ts.isJsxExpression)?.expression?.getText(ast);
  }
  ts.forEachChild(node,visit);
}
visit(ast);
assert(expression,'Actual viewer caption must exist');
const js=ts.transpileModule(`(${expression})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let cases=0;
for(const {studies,label} of [
  {studies:[...api.kneeStudySets,api.genicularStudy,api.poplitealVesselStudy],label:'Knee'},
  {studies:[...api.elbowStudySets,...api.cubitalStudies],label:'Elbow'},
  {studies:[{id:null},{id:'unknown-study'}],label:'Study'},
]) for(const study of studies){
  assert.equal(api.studyCloseUpLabel(study.id),label);
  for(const region of ['leg','forearm','whole-body']){
    const actual=runInNewContext(js,{regionalCloseUp:null,jointCloseUp:{},
      initialRegion:region,cameraRecipeId:study.id,studyCloseUpLabel:api.studyCloseUpLabel});
    assert.equal(actual,`${label} close-up · Whole surfaces extend beyond the view · Pan / pinch to explore`);
    cases++;
  }
}
// Exercise the actual viewer expression, including stage-preserving reassembly.
for (const focus of [false, true]) for (const selectedId of [null, 'visible', 'hidden']) {
  const state = {regionalCloseUp:null, jointCloseUp:null, layout:'tray', exam:false,
    focus, selectedId, enabledIds:new Set(['visible'])};
  assert.equal(runInNewContext(js,{...state,explode:0}),
    'Assembled anatomy · Increase separation to arrange in the tray');
  cases++;
  for (const explode of [1,40,99]) {
    assert.equal(runInNewContext(js,{...state,explode}),
      `Arranging · ${explode}% · Non-anatomical positions · Overlap possible`);
    cases++;
  }
  const complete = runInNewContext(js,{...state,explode:100});
  assert(complete.includes('Not anatomical positions'));
  assert.equal(complete.startsWith('Selected entry framed'), focus && selectedId === 'visible');
  cases++;
}
console.log(JSON.stringify({passed:true,cases,actualViewerCaption:true,geometryChanged:false}));
