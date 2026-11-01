import fs from 'node:fs';
import assert from 'node:assert/strict';
const own='G:/VisibleMedicine-temp/proposals/20261101-renal-venous-xray';
const native='G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration/atlas';
const previous='G:/VisibleMedicine-temp/proposals/20261101-hepatic-vascular-xray';
let text=fs.readFileSync(native+'/content/renal-teaching.ts','utf8');
assert.equal(text.match(/export const renalTeachingReferences = \{/g)?.length,1);
text="import { renalVenousXrayReferences, renalVeinXray, adrenalVeinXray } from './renal-venous-xray';\n"+text;
text=text.replace('export const renalTeachingReferences = {','export const renalTeachingReferences = {\n  ...renalVenousXrayReferences,');
for(const [id,value]of [['renal-veins','renalVeinXray'],['renal-suprarenal-veins','adrenalVeinXray']]){
  const start=text.indexOf("id: '"+id+"'");assert(start>=0);
  const at=text.indexOf('imaging: {',start);assert(at>start);
  const next=text.indexOf("\n    id:",start+1);assert(next<0||at<next);
  text=text.slice(0,at)+text.slice(at).replace('imaging: {','imaging: {\n      xray: '+value+',');
}
fs.writeFileSync(own+'/source/content/renal-teaching.ts',text,{flag:'wx'});
let inspect=fs.readFileSync(previous+'/inspect-source.mjs','utf8')
  .replaceAll('20261101-regional-teaching-types','20261101-hepatic-native-integration')
  .replaceAll('20261101-hepatic-vascular-xray','20261101-renal-venous-xray')
  .replace("['content/nested-teaching.ts','content/hepatic-teaching.ts','content/hepatic-vascular-xray.ts']","['content/renal-teaching.ts','content/renal-venous-xray.ts']")
  .replaceAll("['hepatic-arterial','hepatic-portal']","['renal-veins','renal-suprarenal-veins']");
fs.writeFileSync(own+'/inspect-source.mjs',inspect,{flag:'wx'});
let tests=fs.readFileSync(previous+'/verify.test.mjs','utf8')
  .replaceAll('20261101-hepatic-vascular-xray','20261101-renal-venous-xray')
  .replaceAll('before-v2.json','before.json').replaceAll('after-v2.json','after.json')
  .replaceAll("['hepatic-arterial','hepatic-portal']","['renal-veins','renal-suprarenal-veins']")
  .replaceAll("['hepaticArterialDSA','hepaticPortalVenogram']","['renalContrastVenography','renalAdrenalContrastVenography']")
  .replace("'content/hepatic-teaching.ts','content/hepatic-vascular-xray.ts','content/nested-teaching.ts'","'content/renal-teaching.ts','content/renal-venous-xray.ts'")
  .replace("['FMA14778','FMA14779','FMA15414','FMA15415']","['FMA14335','FMA14336','FMA14343','FMA14349']")
  .replace("row.conceptId==='hepatic-arterial'?refKeys[0]:refKeys[1]","row.conceptId==='renal-veins'?refKeys[0]:refKeys[1]")
  .replace("[after.nestedTeachingReferences[expected].url]","[after.nestedTeachingReferences[expected].url,...(row.conceptId==='renal-suprarenal-veins'?[after.nestedTeachingReferences.renalReuseLicense.url]:[])]")
  .replace("  const cp=JSON.parse(fs.readFileSync('F:/VisibleMedicine/recovery/checkpoints/20261101-catalog-compiler/checkpoint.json'));\n  assert.equal(hash(fs.readFileSync(cp.source.path)),cp.source.sha256);", "  assert.equal(hash(fs.readFileSync('G:/VisibleMedicine-temp/staging/20261101-hepatic-website/WEBSITE_SOURCE.json')),'9412dcb2aa53e4732138b622a74a8fe6f14fa0e9a90a03f05ab773cf41829bf7');")
  .replaceAll('20261101-regional-teaching-types','20261101-hepatic-native-integration')
  .replaceAll('d567863a5a8af08b3bbbfa22adf512a389cdc3a3','b688ddd0c1fb6392ba8e8d7890142d750c8100f1');
assert(!tests.includes('catalog-compiler'));assert(!tests.includes('hepatic-arterial'));
fs.writeFileSync(own+'/verify.test.mjs',tests,{flag:'wx'});
fs.mkdirSync(own+'/evidence');
console.log('Prepared renal/adrenal overlay and bounded identity regression checks.');
