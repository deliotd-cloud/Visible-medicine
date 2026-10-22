import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const expansionImport="import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\n";
export const expansionMap="  './atlas-runtime-expansion':atlasRuntimeExpansionModule,\n";
export const migrationBlock=`const expansionImport="import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\\n";
const expansionMap="  './atlas-runtime-expansion':atlasRuntimeExpansionModule,\\n";
function stripExpansionLoader(candidate){
 for(const added of [expansionImport,expansionMap]){
  assert.equal(candidate.split(added).length,2,\`Missing or duplicate real expansion seam: \${added.trim()}\`);
  candidate=candidate.replace(added,'');
 }
 return candidate;
}
`;
export const migrationRefusal=`test('the non-head migration refuses a missing, duplicated or substituted real expansion dependency',()=>{
 const current=read('./atlas-nonhead-comparison-ui.test.mjs');
 for(const changed of [
  current.replace(expansionImport,''),
  current+expansionMap,
  current.replace(expansionMap,"  './atlas-runtime-expansion':{},\\n"),
 ])assert.throws(()=>verify(changed));
});

`;
const oldAssertion="assert.equal(stripLiveLearningLoader(candidate),expected,'Only real shared-component imports may be added; all original tests/assertions remain exact');";
const newAssertion=oldAssertion.replace('stripLiveLearningLoader(candidate)','stripLiveLearningLoader(stripExpansionLoader(candidate))');
export const originalHashes={
 'atlas-nonhead-comparison-ui.test.mjs':'bfefaa999afd7fffd55d4664ada902380bfbc4b539d7c89460df7afb8aa28fc2',
 'atlas-shoulder-navigation-current.test.mjs':'546349e8c57caf01b9fac4bbb72ba1d1faf8a5f2a98c4fba7c29f3dc794e3b81',
 'nonhead-frame-migration.test.mjs':'be0971e01d2659b0756dbc8eb6a56c43eb4fd42f6ebc5ef1dcff995a885e74ee',
};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function uniqueReplace(source,added,prior=''){
 assert.equal(source.split(added).length,2,`Missing or duplicate source seam: ${added.slice(0,100)}`);
 return source.replace(added,prior);
}
export function restoreExtraExpansionSource(name,source){
 if(name==='nonhead-frame-migration.test.mjs'){
  return uniqueReplace(uniqueReplace(uniqueReplace(source,migrationBlock),migrationRefusal),newAssertion,oldAssertion);
 }
 assert(Object.hasOwn(originalHashes,name),'Only the two declared real-frame roots are admitted');
 return uniqueReplace(uniqueReplace(source,expansionImport),expansionMap);
}

/** Text/hash proof only: does not import, compile or replace any viewer implementation. */
export function verifyExtraExpansionSources(read){
 for(const [name,expected] of Object.entries(originalHashes)){
  const original=read(`preimages/${name}.before-extra-expansion.raw`);
  assert.equal(digest(original),expected,`${name}: immutable full original`);
  assert.equal(restoreExtraExpansionSource(name,read(name)),original,`${name}: complete original source inverse`);
 }
 const loader=read('atlas-runtime-expansion-loader.mjs');
 assert.equal(digest(loader),'fbd8ce6e4644625496315a4647b08aa02ff62a5933629b26b0ad12e05874985c');
 assert.match(loader,/components\/atlas-runtime-expansion\.ts/);
 assert.match(loader,/export const atlasRuntimeExpansionModule=module\.exports/);
 return {wholeOriginalSources:3,controllerLoaderIsActualSource:true,nativeOrBrowserAcceptance:false};
}
