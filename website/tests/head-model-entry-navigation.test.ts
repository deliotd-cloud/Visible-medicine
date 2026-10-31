import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {headConceptById} from '../lib/head-atlas-links.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const tree=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const otherSource=readFileSync(new URL('../components/HeadOtherViews.tsx',import.meta.url),'utf8');
const otherTree=ts.createSourceFile('HeadOtherViews.tsx',otherSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const entries:ts.JsxElement[]=[],flags:ts.VariableDeclaration[]=[],calls:ts.JsxSelfClosingElement[]=[];
function visit(node:ts.Node):void{
  if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(tree)==='HeadOtherViews')calls.push(node);
  if(ts.isVariableDeclaration(node)&&node.name.getText(tree)==='preserveScanTab')flags.push(node);
  ts.forEachChild(node,visit);
}
function visitOther(node:ts.Node):void{
  if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(otherTree)==='a'&&
    node.openingElement.attributes.properties.some(attribute=>ts.isJsxAttribute(attribute)&&ts.isIdentifier(attribute.name)&&attribute.name.text==='href'&&
      attribute.initializer&&ts.isJsxExpression(attribute.initializer)&&attribute.initializer.expression?.getText(otherTree)==='atlasHref'))entries.push(node);
  ts.forEachChild(node,visitOther);
}
visit(tree);
visitOther(otherTree);
assert.equal(calls.length,1,'the selected concept has one actual Other views entry');
for(const [name,value]of [['atlasHref','concept.atlasHref'],['label','concept.label'],['preserveScanTab','preserveScanTab']]){
  const attributes=calls[0].attributes.properties.filter(attribute=>ts.isJsxAttribute(attribute)&&attribute.name.getText(tree)===name) as ts.JsxAttribute[];
  assert.equal(attributes.length,1,name+': one exact concept property');const initializer=attributes[0].initializer;
  assert(initializer&&ts.isJsxExpression(initializer));assert.equal(initializer.expression?.getText(tree),value,name+': source-bound value reaches the actual child');
}
assert.equal(entries.length,1,'the actual source-bound full-model entry must be one native anchor');
const conditional=entries[0].parent;assert(ts.isBinaryExpression(conditional));
assert.equal(conditional.operatorToken.kind,ts.SyntaxKind.AmpersandAmpersandToken);
assert.equal(conditional.left.getText(otherTree),'atlasHref','unmapped structures do not get a made-up 3D destination');
assert.equal(flags.length,1,'the existing scan-tab policy must remain singular');
assert(flags[0].initializer);
const code=ts.transpileModule(`export const preserve=(pkg)=>(${flags[0].initializer!.getText(tree)});\nexport const render=(concept,preserveScanTab)=>{const label=concept.label,atlasHref=concept.atlasHref;return atlasHref&&(${entries[0].getText(otherTree)});};`,{
  compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const mod={exports:{} as {preserve:(pkg:unknown)=>boolean;render:(concept:unknown,preserveScanTab:boolean)=>{type:unknown;props:Record<string,any>}}};
new Function('require','module','exports',code)(require,mod,mod.exports);

test('source-bound CT and MRI full-model entries render a document anchor with the exact Atlas URL',()=>{
  for(const [surface,id] of [['CT','brainstem-pons'],['MRI','limbic-left-amygdala']] as const){
    const concept=headConceptById(id);assert(concept?.atlasHref,id);
    assert(surface==='CT'?concept.ctHref:concept.mriHref,`${surface} fixture is actually mapped`);
    const node=mod.exports.render(concept,mod.exports.preserve({source:'configured-local'}));
    assert.equal(node.type,'a',`${surface} entry uses native document navigation`);
    assert.equal(node.props.href,concept.atlasHref,`${surface} retains the exact source-bound tuple`);
    assert.equal(node.props.target,undefined,`${surface} configured source opens in this tab`);
    assert.equal(node.props.rel,undefined);
    assert.equal(node.props['aria-label'],`Open ${concept.label} in the 3D Atlas`);
    const html=renderToStaticMarkup(node as any);
    assert.match(html,/^<a href="\/atlas\/head-neck-3d\?/);
    assert(html.includes(concept.atlasHref.replaceAll('&','&amp;')),`${surface} rendered href matches the source-bound target`);
    assert(!html.includes('target='));
  }
});

test('unmapped selected structures do not render a full-model link',()=>{
  for(const atlasHref of [null,undefined,'']){
    const node=mod.exports.render({label:'Unmapped structure',atlasHref},false);
    assert(!node);
    assert.equal(renderToStaticMarkup(node as any),'');
  }
});

test('a manually chosen scan keeps its tab when the full-model anchor opens separately',()=>{
  assert.equal(mod.exports.preserve(null),false);
  assert.equal(mod.exports.preserve({source:'configured-local'}),false);
  assert.equal(mod.exports.preserve({source:'manual-folder'}),true);
  for(const id of ['brainstem-pons','limbic-left-amygdala']){
    const concept=headConceptById(id);assert(concept?.atlasHref);
    const node=mod.exports.render(concept,mod.exports.preserve({source:'manual-folder'}));
    assert.equal(node.type,'a');
    assert.equal(node.props.href,concept.atlasHref);
    assert.equal(node.props.target,'_blank');
    assert.equal(node.props.rel,'noopener noreferrer');
    assert.equal(node.props['aria-label'],`Open ${concept.label} in the 3D Atlas (new tab)`);
    const html=renderToStaticMarkup(node as any);
    assert.match(html,/target="_blank"/);
    assert.match(html,/rel="noopener noreferrer"/);
    assert(html.includes(concept.atlasHref.replaceAll('&','&amp;')));
  }
});
