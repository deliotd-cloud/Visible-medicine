import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import test from 'node:test';

export const candidate=fileURLToPath(new URL('..',import.meta.url));
const require=createRequire(pathToFileURL(candidate+'/package.json'));
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const ts=require('typescript');
export {assert,readFileSync,createHash,createRequire,React,renderToStaticMarkup,ts,test,require};
const fixtureUrl=name=>new URL('./fixtures/review-navigation-before/'+name+'.b64',import.meta.url);
export function fixture(name,hash) {
 const bytes=Buffer.from(readFileSync(fixtureUrl(name),'utf8').replace(/\s/g,''),'base64');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),hash.toLowerCase(),name+' provenance');
 return bytes.toString('utf8');
}
export function current(path) {return readFileSync(resolve(candidate,path),'utf8');}
export function compile(source,imports={}) {
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(name=>Object.hasOwn(imports,name)?imports[name]:name.endsWith('.css')?{}:require(name),mod,mod.exports);
 return mod.exports;
}
export const Link=({children,...props})=>React.createElement('a',props,children);
export function replayOriginal(name,hash,sourceFixture,sourceHash) {
 const original=fixture(name,hash),historical=fixture(sourceFixture,sourceHash);
 const script=original.replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(candidate+'/tests/'+name).href));
 const historicalSource=resolve(candidate,'components',sourceFixture);
 const reader=(path,...rest)=>{
  const local=path instanceof URL?fileURLToPath(path):String(path);
  if(resolve(local)===historicalSource)return historical;
  return readFileSync(path,...rest);
 };
 const focus=require('./lib/public-route-focus.ts');
 const fn=new Function('assert','test','readFileSync','createHash','createRequire','React','renderToStaticMarkup','ts','isPublicFocusPath','shouldFocusPublicRoute','shouldFocusStudioPrimaryRoute','URL',script);
 fn(assert,test,reader,createHash,createRequire,React,renderToStaticMarkup,ts,focus.isPublicFocusPath,focus.shouldFocusPublicRoute,focus.shouldFocusStudioPrimaryRoute,URL);
}
