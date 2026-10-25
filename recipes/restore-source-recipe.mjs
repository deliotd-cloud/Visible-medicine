import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const digest=text=>createHash('sha256').update(text).digest('hex');
/** Baseline character spans, not anatomical coordinates; no source is recovered without its exact local preimage. */
export function restoreSourceRecipe(original,recipe){
  assert.equal(recipe.schema,'vm-exact-local-source-recipe/1');
  assert.equal(digest(original),recipe.beforeSha256,'Exact local preimage required');
  assert(Array.isArray(recipe.pieces)&&recipe.pieces.length<10000);
  const restored=recipe.pieces.map(piece=>{
    if(typeof piece==='string')return piece;
    assert.deepEqual(Object.keys(piece),['copy']);
    assert(Array.isArray(piece.copy)&&piece.copy.length===2);
    const [start,length]=piece.copy;
    assert(Number.isSafeInteger(start)&&Number.isSafeInteger(length)&&start>=0&&length>0&&start+length<=original.length);
    return original.slice(start,start+length);
  }).join('');
  assert.equal(digest(restored),recipe.afterSha256,'Complete reconstructed source must match');
  return restored;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [recipeFile,preimageFile,target]=process.argv.slice(2);
  assert(recipeFile&&preimageFile&&target&&!fs.existsSync(target));
  const restored=restoreSourceRecipe(fs.readFileSync(preimageFile,'utf8'),JSON.parse(fs.readFileSync(recipeFile,'utf8')));
  fs.writeFileSync(target,restored,{flag:'wx'});
  console.log(JSON.stringify({target,sha256:digest(restored),restored:true}));
}
