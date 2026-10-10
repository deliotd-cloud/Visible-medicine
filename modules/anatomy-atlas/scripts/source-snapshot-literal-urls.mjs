// Static URL references only. Never opens a URL or infers filesystem read semantics.
import {posix} from 'node:path';
import ts from 'typescript';
import {validateSnapshotPath} from './source-snapshot-manifest.mjs';

const text=node=>node&&(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))?node.text:null;
const importMeta=node=>!!node&&ts.isPropertyAccessExpression(node)&&node.name.text==='url'&&
  ts.isMetaProperty(node.expression)&&node.expression.keywordToken===ts.SyntaxKind.ImportKeyword&&
  node.expression.name.text==='meta';
const constructor=node=>!!node&&ts.isNewExpression(node)&&ts.isIdentifier(node.expression)&&
  node.expression.text==='URL'&&node.arguments?.length===2&&
  !node.arguments.some(ts.isSpreadElement);
const safeRelative=value=>typeof value==='string'&&value.length>0&&
  !value.startsWith('/')&&!value.startsWith('\\')&&!value.includes('\\')&&
  !/[%?#:\x00-\x1f\x7f]/.test(value)&&
  value.split('/').every((part,index,array)=>
    (part===''&&(index===array.length-1||index===0&&array[1]!==''))||
    part==='.'||part==='..'||/^[a-z0-9._+-]+$/i.test(part));

function resolveRelative(directory,value){
  if(!safeRelative(value))return null;
  const parts=directory?directory.split('/'):[];
  for(const part of value.split('/')){
    if(!part||part==='.')continue;
    if(part==='..'){
      if(!parts.length)return null;
      parts.pop();
    }else parts.push(part);
  }
  return {path:parts.join('/'),directory:value.endsWith('/')||value==='.'||value==='..'};
}

function declaredNames(ast){
  const names=new Map();
  const add=name=>{if(name&&ts.isIdentifier(name))names.set(name.text,(names.get(name.text)??0)+1);
    else if(name&&ts.isBindingPattern(name))for(const element of name.elements)add(element.name);};
  const visit=node=>{
    if(ts.isVariableDeclaration(node)||ts.isParameter(node)||ts.isFunctionDeclaration(node)||
       ts.isFunctionExpression(node)||ts.isClassDeclaration(node)||ts.isClassExpression(node)||
       ts.isImportClause(node)||ts.isImportSpecifier(node)||ts.isNamespaceImport(node)||
       ts.isBindingElement(node)||ts.isTypeParameterDeclaration(node))add(node.name);
    if(ts.isCatchClause(node)&&node.variableDeclaration)add(node.variableDeclaration.name);
    ts.forEachChild(node,visit);
  };
  visit(ast);return names;
}

export function analyzeLiteralUrls(ast,from,rows){
  const results=new Map(),declarations=declaredNames(ast),bases=new Map();
  let dynamicCode=false;
  function scan(node){
    if(ts.isWithStatement(node))dynamicCode=true;
    if((ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='eval')||
       (ts.isNewExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='Function'))
      dynamicCode=true;
    if(ts.isIdentifier(node)&&['globalThis','global','window','self','Reflect','Object','Function',
      'setTimeout','setInterval'].includes(node.text))
      dynamicCode=true;
    if(ts.isIdentifier(node)&&node.text==='URL'&&
       !(node.parent&&constructor(node.parent)&&node.parent.expression===node))dynamicCode=true;
    if(ts.isMetaProperty(node)&&node.keywordToken===ts.SyntaxKind.ImportKeyword&&node.name.text==='meta'){
      const parent=node.parent;
      if(!ts.isPropertyAccessExpression(parent)||parent.name.text!=='url'||
         !constructor(parent.parent)||parent.parent.arguments?.[1]!==parent)dynamicCode=true;
    }
    ts.forEachChild(node,scan);
  }
  scan(ast);
  for(const statement of ast.statements){
    if(!ts.isVariableStatement(statement)||!(statement.declarationList.flags&ts.NodeFlags.Const))continue;
    for(const declaration of statement.declarationList.declarations){
      if(!ts.isIdentifier(declaration.name)||!constructor(declaration.initializer))continue;
      const [argument,base]=declaration.initializer.arguments??[];
      if(!importMeta(base))continue;
      const value=text(argument),resolved=resolveRelative(posix.dirname(from),value);
      if(resolved&&resolved.directory&&declarations.get(declaration.name.text)===1)
        bases.set(declaration.name.text,{...resolved,declaration});
    }
  }
  // A URL object is mutable despite a const binding. Accept only declarations and
  // uses as the direct second argument to another URL constructor.
  for(const [name,base] of bases){
    let valid=true;
    const inspect=node=>{
      if(ts.isIdentifier(node)&&node.text===name&&node!==base.declaration.name){
        const parent=node.parent;
        if(!(constructor(parent)&&parent.arguments?.[1]===node))valid=false;
      }
      ts.forEachChild(node,inspect);
    };
    inspect(ast);
    if(!valid)bases.delete(name);
  }
  function visit(node){
    if(constructor(node)){
      let result=null;
      const [argument,base]=node.arguments??[];
      const value=text(argument);
      if(!dynamicCode&&declarations.get('URL')===undefined&&value!==null){
        let directory=null;
        if(importMeta(base))directory=posix.dirname(from);
        else if(base&&ts.isIdentifier(base)&&bases.has(base.text)&&
                node.getStart(ast)>bases.get(base.text).declaration.getStart(ast))
          directory=bases.get(base.text).path;
        if(directory!==null)result=resolveRelative(directory,value);
      }
      if(result){
        if(result.directory){
          if(result.path===''&&[...rows.keys()].some(path=>path.includes('/')))
            results.set(node.getStart(ast),{kind:'root-directory',target:''});
        }else{
          try{
            validateSnapshotPath(result.path);
            const row=rows.get(result.path);
            if(row&&(row.mode==='100644'||row.mode==='100755')&&row.type==='blob')
              results.set(node.getStart(ast),{kind:'file',target:result.path});
          }catch{/* A held or unsafe path remains unresolved. */}
        }
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
  return results;
}
