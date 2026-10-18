import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import ts from 'typescript';

const source=readFileSync(new URL('../components/EducationRuntime.tsx',import.meta.url),'utf8');
const file=ts.createSourceFile('EducationRuntime.tsx',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
const anchors:ts.JsxElement[]=[];
function visit(node:ts.Node){
  if(ts.isJsxElement(node)){
    const hasClass=node.openingElement.attributes.properties.some(attribute=>
      ts.isJsxAttribute(attribute)&&ts.isIdentifier(attribute.name)&&attribute.name.text==='className'&&
      attribute.initializer&&ts.isStringLiteral(attribute.initializer)&&attribute.initializer.text==='runtime-atlas-link');
    if(hasClass)anchors.push(node);
  }
  ts.forEachChild(node,visit);
}
visit(file);
function attribute(element:ts.JsxElement,name:string){
  const matches=element.openingElement.attributes.properties.filter(value=>
    ts.isJsxAttribute(value)&&ts.isIdentifier(value.name)&&value.name.text===name);
  assert.equal(matches.length,1,`one static ${name} attribute`);
  const value=matches[0];
  assert(ts.isJsxAttribute(value)&&value.initializer&&ts.isStringLiteral(value.initializer),`${name} must be a literal`);
  return value.initializer.text;
}

test('case workspace offers only an explicitly separate Atlas browse action',()=>{
  assert.equal(anchors.length,1,'one common Atlas reference in the case workspace');
  const anchor=anchors[0];
  assert.equal(anchor.openingElement.tagName.getText(file),'a');
  assert.equal(attribute(anchor,'href'),'/atlas');
  assert.equal(attribute(anchor,'target'),'_blank');
  assert.deepEqual(new Set(attribute(anchor,'rel').split(/\s+/)),new Set(['noopener','noreferrer']));
  assert.match(attribute(anchor,'aria-label'),/independent anatomy Atlas.*separate tab.*not linked to this case/i);
  assert.match(anchor.getText(file),/Browse separate Atlas/);
  assert.doesNotMatch(anchor.getText(file),/ct-head|caseId|activeCase|study|source|registration/i);
});

test('independent Atlas browse does not replace the existing case exit route',()=>{
  assert.match(source,/className="runtime-exit-link" href=\{accessMode === "authoring"/);
  assert.match(source,/view === "authoring" \? "\/studio\/workspace" : "\/my-learning"/);
  assert.match(source,/const activeCase =\s*data\?\.cases\.find/);
});
