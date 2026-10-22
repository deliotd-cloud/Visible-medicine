import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-regional-tour-commit-controls',atlas=stage+'/atlas';
const ts=createRequire(atlas+'/package.json')('typescript');
const source=path=>read(atlas+'/'+path).toString(),original=path=>runGit(['-C',atlas,'show','HEAD:'+path]).toString();
const parse=(text,kind)=>ts.createSourceFile('source.'+(kind===ts.ScriptKind.TSX?'tsx':'mjs'),text.replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,kind);
const calls=text=>{
 const file=parse(text,ts.ScriptKind.JS),result=new Map();
 const visit=node=>{if(ts.isCallExpression(node)&&node.expression.getText(file)==='test'){const key=node.arguments[0].getText(file);assert(!result.has(key));result.set(key,node.getText(file));}ts.forEachChild(node,visit);};visit(file);return result;
};
const before=calls(original('scripts/test-regional-tour-player.mjs')),after=calls(source('scripts/test-regional-tour-player.mjs'));
assert.equal(before.size,65);assert.equal(after.size,71);for(const[name,body]of before)assert.equal(after.get(name),body,name);
const surface=text=>{
 const file=parse(text,ts.ScriptKind.TSX),result=[];
 const visit=node=>{
  if(ts.isJsxText(node))result.push({text:node.getText(file)});
  if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))result.push({tag:node.tagName.getText(file),attributes:node.attributes.properties.map(attr=>ts.isJsxAttribute(attr)&&/^on[A-Z]/.test(attr.name.getText(file))?'event:'+attr.name.getText(file):attr.getText(file))});
  ts.forEachChild(node,visit);
 };visit(file);return result;
};
const previousSurface=surface(original('app/regional-guided-learning.tsx')),currentSurface=surface(source('app/regional-guided-learning.tsx'));
assert.deepEqual(currentSurface,previousSurface);
const report={schema:'vm.regional-tour-source-preservation/1',at:new Date().toISOString(),originalTestCallSitesPreserved:65,originalRuntimeCases:75,addedTestCallSites:6,comparison:'Every original test() call body remains exact after CRLF/LF line-ending normalization, including loop-generated call sites.65source call sites expand to75native cases. Not75distinct source bodies or raw byte equality across line endings.',jsxSurfaceEntries:currentSurface.length,jsxSurfaceSha256:sha(JSON.stringify(currentSurface)),jsxStaticAndNonEventAttributesExact:true,jsxScope:'All JSX text, tags and attributes other than on[A-Z] event-handler expression bodies are equal after line-ending normalization. Handler attribute names are retained. This is a source-surface preservation check, not rendered-browser/GPU or accessibility acceptance.',paths:['app/regional-guided-learning.tsx','scripts/test-regional-tour-player.mjs'].map(path=>({path,sha256:sha(read(atlas+'/'+path)),originalGitBlobSha256:sha(original(path))})),verifierPreflightDiagnostics:'Main native wrapper initially compared static call count to runtime count and then raw CRLF to Git LF. Both source-proof harness diagnostics were corrected before native execution. No product/test assertion was changed to fix these diagnostics.',previewChanged:false};
fs.writeFileSync(stage+'/SOURCE_ASSURANCE_V2.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:stage+'/SOURCE_ASSURANCE_V2.json',sha256:sha(read(stage+'/SOURCE_ASSURANCE_V2.json')),originalTestCallSitesPreserved:65,originalRuntimeCases:75,jsxSurfaceEntries:currentSurface.length}));
