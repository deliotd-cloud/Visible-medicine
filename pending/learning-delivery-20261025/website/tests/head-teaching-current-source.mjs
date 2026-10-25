// Current source role only. Never reads historical component bytes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function loadCurrentTeaching(){
 const bytes=readFileSync(new URL('./fixtures/head-teaching-current-pins.json',import.meta.url));
 assert.equal(sha(bytes),'af217db9847a8d1cedd553dea27cce5dba9b8569978f8f3ec7ba1ae9f64799e3');
 const pins=JSON.parse(bytes),root=new URL('../',import.meta.url);
 assert.equal(pins.schema,'vm-head-teaching-current-pins/1');
 assert.equal(pins.sourceCandidateSha256,'631a7021667cd9989ff1d564f0881068ef58201dd0b5a53e5be8e723aed777fa');
 function verify(){
  for(const row of pins.rows){
   assert(/^(?:lib\/head-|atlas-review\/content\/|components\/Head|app\/workspace\/atlas-review\/head-learning\/page.tsx)/.test(row.path));
   assert(!row.path.split('/').some(part=>part==='..'||part==='.'));
   const source=readFileSync(new URL(row.path,root));
   assert.equal(source.length,row.bytes,row.path);assert.equal(sha(source),row.sha256,row.path);
  }
 }
 verify();
 const ts=require('typescript'),jsx=require('react/jsx-runtime');
 function component(name,dependencies){
  const source=readFileSync(new URL('components/'+name+'.tsx',root),'utf8');
  const syntax=ts.createSourceFile(name+'.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const imports=syntax.statements.filter(ts.isImportDeclaration).filter(s=>!s.importClause?.isTypeOnly).map(s=>s.moduleSpecifier.text);
  assert.deepEqual([...imports].sort(),Object.keys(dependencies).sort(),'Current component import allowlist: '+name);
  const output=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}},bound={'react/jsx-runtime':jsx,...dependencies};
  new Function('require','module','exports',output)(id=>{assert(Object.hasOwn(bound,id),'Unbound current component import: '+id);return bound[id];},mod,mod.exports);
  return mod.exports[name];
 }
 const teaching=require('../lib/head-atlas-teaching.ts'),learning=require('../lib/head-atlas-learning.ts');
 const Navigator=component('HeadTeachingReviewNavigator',{});
 const ImageLink=component('HeadReviewImageLink',{'../lib/head-atlas-navigation':require('../lib/head-atlas-navigation.ts')});
 const Review=component('HeadAtlasTeachingReview',{
  '../lib/head-atlas-teaching':teaching,'../lib/head-atlas-learning':learning,
  './HeadTeachingReviewNavigator':{HeadTeachingReviewNavigator:Navigator},'./HeadReviewImageLink':{HeadReviewImageLink:ImageLink},
  '../lib/head-brainstem-clinical.ts':require('../lib/head-brainstem-clinical.ts'),
  '../lib/head-ventricular-clinical.ts':require('../lib/head-ventricular-clinical.ts'),
 });
 const page=readFileSync(new URL('app/workspace/atlas-review/head-learning/page.tsx',root),'utf8');
 verify();
 return {Navigator,Review,teaching,learning,page,revision:require('../lib/head-atlas-links.ts').HEAD_LINK_REVISION,verify};
}
