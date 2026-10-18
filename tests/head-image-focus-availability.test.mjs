import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const path=new URL('../components/HeadAtlasViewer.tsx',import.meta.url),source=readFileSync(path,'utf8'),ast=ts.createSourceFile(path.pathname,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),shells=[],panelDeclarations=[];
function visit(node){
 if((ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))&&node.tagName.getText(ast)==='ImagingAtlasShell')shells.push(node);
 if(ts.isVariableDeclaration(node)&&ts.isArrayBindingPattern(node.name)&&node.name.elements[0]?.getText(ast)==='rightPanel')panelDeclarations.push(node);
 ts.forEachChild(node,visit);
}
visit(ast);assert.equal(shells.length,1);assert.equal(panelDeclarations.length,1);
const state=panelDeclarations[0].initializer;assert(state&&ts.isCallExpression(state));assert.equal(state.expression.getText(ast),'useState');
const union=state.typeArguments?.[0];assert(union&&ts.isUnionTypeNode(union));
const actualPanelModes=union.types.map(node=>{assert(ts.isLiteralTypeNode(node)&&ts.isStringLiteral(node.literal));return node.literal.text;});
assert.deepEqual(actualPanelModes,['info','practice','guided']);assert(ts.isStringLiteral(state.arguments[0]));assert.equal(state.arguments[0].text,'info');
const attributes=shells[0].attributes.properties,expression=name=>{const attr=attributes.find(a=>ts.isJsxAttribute(a)&&a.name.text===name);assert(attr&&attr.initializer&&ts.isJsxExpression(attr.initializer)&&attr.initializer.expression,name);return attr.initializer.expression.getText(ast);};
const evaluate=new Function('study','quizActive','rightPanel','comparisonOpen',`return (${expression('canFocusImages')});`);
test('native image focus is available only for a loaded study in ordinary structure information',()=>{
 const study={synthetic:true};let admitted=0;
 // Exercise the actual production state union; an invented test-only mode can
 // falsely make a permanently hidden control appear tested.
 for(const loaded of [null,study])for(const quizActive of [false,true])for(const rightPanel of actualPanelModes)for(const comparisonOpen of [false,true]){
  const expected=loaded===study&&!quizActive&&rightPanel==='info'&&!comparisonOpen;
  assert.equal(evaluate(loaded,quizActive,rightPanel,comparisonOpen),expected);if(expected)admitted++;
 }
 assert.equal(admitted,1);assert.equal(expression('imageFocusContext'),'imageFocusIdentity');
 assert.equal(evaluate(study,false,'details',false),false);
});
test('focus layout cannot substitute a study identity or change native viewer state',()=>{
 assert.equal(expression('imageFocusContext'),'imageFocusIdentity');
 assert.doesNotMatch(expression('canFocusImages'),/set|window|fetch|storage|cursor|activeId|mask/);
 assert.match(source,/sidebar=\{sidebar\}/);assert.match(source,/toolbar=\{toolbar\}/);
 assert.match(source,/onCursor=\{navigateCursor\}/);assert.match(source,/showName=\{!hideAnswer\}/);
});

function focusIdentityExpression(){
 const declarations=[];
 function find(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='imageFocusIdentity')declarations.push(node);ts.forEachChild(node,find);}
 find(ast);assert.equal(declarations.length,1);
 const init=declarations[0].initializer;assert(init&&ts.isCallExpression(init));
 assert.equal(init.expression.getText(ast),'useMemo');assert.equal(init.arguments.length,2);
 const dependencies=init.arguments[1];assert(ts.isArrayLiteralExpression(dependencies));
 assert.deepEqual(dependencies.elements.map(node=>node.getText(ast)),['study']);
 return new Function('useMemo','study',`return (${init.getText(ast)});`);
}

test('actual focus token expression never reads, enumerates or exposes scalar payloads',()=>{
 const identity=focusIdentityExpression(),tokens=[];
 const unreadable=new Proxy({}, {get(){throw Error('Scalar payload must not be read');},ownKeys(){throw Error('Study must not be enumerated');}});
 const memo=callback=>callback();
 assert.equal(identity(memo,null),null);
 for(const study of [unreadable,{data:new Float32Array(4),definition:{synthetic:true}}]){
  const token=identity(memo,study);assert.notEqual(token,study);
  assert.equal(Object.getPrototypeOf(token),Object.prototype);
  assert.deepEqual(Reflect.ownKeys(token),[]);assert.equal(JSON.stringify(token),'{}');tokens.push(token);
 }
 assert.notEqual(tokens[0],tokens[1]);
});

test('actual focus token expression is keyed only to the loaded study reference',()=>{
 const identity=focusIdentityExpression();let prior,token,calls=0;
 const memo=(callback,deps)=>{if(!prior||deps[0]!==prior[0]){prior=deps;token=callback();calls++;}return token;};
 const a={data:new Float32Array(4)},b={data:a.data};
 const first=identity(memo,a);assert.equal(identity(memo,a),first);assert.equal(calls,1);
 const second=identity(memo,b);assert.notEqual(second,first);assert.equal(calls,2);
 assert.equal(identity(memo,null),null);assert.equal(calls,3);
 assert.notEqual(identity(memo,a),first);assert.equal(calls,4);
});
