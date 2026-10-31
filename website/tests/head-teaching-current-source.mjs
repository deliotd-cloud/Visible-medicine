// Current source role only. Never reads historical component bytes.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {beforeReviewSectionsNavigator,beforeReviewSectionsTeachingReview} from './head-review-sections-history-inverse.mjs';
const require=createRequire(import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function loadCurrentTeaching(){
 const bytes=readFileSync(new URL('./fixtures/head-teaching-current-pins.json',import.meta.url));
 assert.equal(sha(bytes),'af217db9847a8d1cedd553dea27cce5dba9b8569978f8f3ec7ba1ae9f64799e3');
 const pins=JSON.parse(bytes),root=new URL('../',import.meta.url);
 assert.equal(pins.schema,'vm-head-teaching-current-pins/1');
 assert.equal(pins.sourceCandidateSha256,'631a7021667cd9989ff1d564f0881068ef58201dd0b5a53e5be8e723aed777fa');
 function verify(){
  const fixedBytes=readFileSync('G:/VisibleMedicine-temp/staging/20261031-release19-followup/SOURCE.json');
  assert.equal(sha(fixedBytes),'8caae595a55d244f579f89853d3d265bcda043fa3aadcb5a247fe8cc7715d686',
   'Exact source-bound current teaching witness');
  const fixed=JSON.parse(fixedBytes);
  assert.equal(fixed.website,'G:/VisibleMedicine-temp/staging/20261031-release19-followup/website');
  const fixedRows=new Map(fixed.sourceRows.map(row=>[row.path,row]));
  assert.equal(fixedRows.size,fixed.sourceRows.length,'Unique fixed source paths');
  const receiptPath=process.env.VM_CURRENT_SOURCE_RECEIPT,receiptSha=process.env.VM_CURRENT_SOURCE_SHA256;
  assert(receiptPath&&/^[a-f0-9]{64}$/.test(receiptSha??''),'Current source receipt required');
  const receiptBytes=readFileSync(receiptPath);
  assert.equal(sha(receiptBytes),receiptSha,'Current source receipt changed');
  const receipt=JSON.parse(receiptBytes);
  assert.equal(realpathSync(receipt.website),realpathSync(fileURLToPath(root)),
   'Current source receipt must name this importing website');
  const currentRows=new Map(receipt.sourceRows.map(row=>[row.path,row]));
  assert.equal(currentRows.size,receipt.sourceRows.length,'Unique current source paths');
  const changed=[];
  for(const row of pins.rows){
   assert(/^(?:lib\/head-|atlas-review\/content\/|components\/Head|app\/workspace\/atlas-review\/head-learning\/page.tsx)/.test(row.path));
   assert(!row.path.split('/').some(part=>part==='..'||part==='.'));
   const source=readFileSync(new URL(row.path,root));
   const fixedRow=fixedRows.get(row.path),currentRow=currentRows.get(row.path);
   assert(fixedRow&&currentRow,'Fixed and current receipt rows: '+row.path);
   assert.equal(source.length,fixedRow.bytes,row.path);assert.equal(sha(source),fixedRow.sha256,row.path);
   assert.equal(source.length,currentRow.bytes,row.path);assert.equal(sha(source),currentRow.sha256,row.path);
   let historical=source;
   if(row.path==='components/HeadAtlasTeachingReview.tsx')historical=Buffer.from(beforeReviewSectionsTeachingReview(source.toString('utf8')));
   if(row.path==='components/HeadTeachingReviewNavigator.tsx')historical=Buffer.from(beforeReviewSectionsNavigator(source.toString('utf8')));
   assert.equal(historical.length,row.bytes,'Exact original source length: '+row.path);
   assert.equal(sha(historical),row.sha256,'Exact original source hash: '+row.path);
   if(!source.equals(historical))changed.push(row.path);
  }
  assert.deepEqual(changed.sort(),['components/HeadAtlasTeachingReview.tsx','components/HeadTeachingReviewNavigator.tsx'],
   'Only the complete authenticated Review sections transition may differ');
 }
 verify();
 const ts=require('typescript'),jsx=require('react/jsx-runtime');
 function component(name,dependencies,allExports=false){
  const source=readFileSync(new URL('components/'+name+'.tsx',root),'utf8');
  const syntax=ts.createSourceFile(name+'.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const imports=syntax.statements.filter(ts.isImportDeclaration).filter(s=>!s.importClause?.isTypeOnly).map(s=>s.moduleSpecifier.text);
  assert.deepEqual([...imports].sort(),Object.keys(dependencies).sort(),'Current component import allowlist: '+name);
  const output=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}},bound={'react/jsx-runtime':jsx,...dependencies};
  new Function('require','module','exports',output)(id=>{assert(Object.hasOwn(bound,id),'Unbound current component import: '+id);return bound[id];},mod,mod.exports);
  return allExports?mod.exports:mod.exports[name];
 }
 const teaching=require('../lib/head-atlas-teaching.ts'),learning=require('../lib/head-atlas-learning.ts');
 const navigatorExports=component('HeadTeachingReviewNavigator',{},true);
 const Navigator=navigatorExports.HeadTeachingReviewNavigator;
 assert.equal(typeof navigatorExports.HeadTeachingReviewSections,'function','Current section navigation export');
 const ImageLink=component('HeadReviewImageLink',{'../lib/head-atlas-navigation':require('../lib/head-atlas-navigation.ts')});
 const Review=component('HeadAtlasTeachingReview',{
  '../lib/head-atlas-teaching':teaching,'../lib/head-atlas-learning':learning,
  './HeadTeachingReviewNavigator':navigatorExports,'./HeadReviewImageLink':{HeadReviewImageLink:ImageLink},
  '../lib/head-brainstem-clinical.ts':require('../lib/head-brainstem-clinical.ts'),
  '../lib/head-ventricular-clinical.ts':require('../lib/head-ventricular-clinical.ts'),
 });
 const page=readFileSync(new URL('app/workspace/atlas-review/head-learning/page.tsx',root),'utf8');
 verify();
 return {Navigator,Review,teaching,learning,page,revision:require('../lib/head-atlas-links.ts').HEAD_LINK_REVISION,verify};
}
