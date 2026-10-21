// Test-only CJS bridge for the real TSX component; Node strip-types cannot require TSX.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/GroupedReviewConfirmation.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
new Function('require','module','exports',code)(id=>{
  assert.equal(id,'react/jsx-runtime','Unexpected confirmation-component dependency');
  return require(id);
},mod,mod.exports);
export const groupedReviewConfirmation=mod.exports;
for(const name of ['GroupedReviewConfirmation','NotesConsiderations','exactReviewChecks'])
  assert.equal(typeof groupedReviewConfirmation[name],'function',`Real confirmation export: ${name}`);
const criteria=[{id:'one',label:'One'},{id:'two',label:'Two'}];
assert.deepEqual(groupedReviewConfirmation.exactReviewChecks(criteria,false),{one:false,two:false});
assert.deepEqual(groupedReviewConfirmation.exactReviewChecks(criteria,true),{one:true,two:true});
const changes=[];
const confirmation=groupedReviewConfirmation.GroupedReviewConfirmation({criteria,attestation:'reviewed',checked:false,onChange:value=>changes.push(value),summary:'Criteria'});
const checkbox=confirmation.props.children[0].props.children[0];
assert.equal(checkbox.type,'input');
assert.equal(checkbox.props.checked,false,'Review is not confirmed by the harness');
checkbox.props.onChange({target:{checked:true}});
assert.deepEqual(changes,[true],'Only an explicit checkbox change confirms review');
const notes=groupedReviewConfirmation.NotesConsiderations({criteria,checked:false,onChange:value=>changes.push(value)});
assert.equal(notes.props.children[0].props.children[0].props.checked,false,'Notes consideration starts unconfirmed');
