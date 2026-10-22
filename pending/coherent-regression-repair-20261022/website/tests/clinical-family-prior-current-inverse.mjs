// Pure CODE-byte adapter: proposed family source -> exact frozen prior-current source.
// No website, validator, test runner, model, or clinical payload imports.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const importNew="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const importOld="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';";
function undo(text,newText,oldText){
 assert.equal(text.split(newText).length,2,`Unique source-role seam: ${newText.slice(0,75)}`);
 return text.replace(newText,oldText);
}
const identities={
 arterial:{before:'f9078eadbc4e32a6f6f99e8e6ca0f8e8230bb9ceecc766210b50e45564256e7c',
  next:'79f3d0da5c4a192719522bc5979f03b0ec48add178c0071bc152d9c7354a67a8'},
 venous:{before:'00cde16bc349a8e6921094f56db467f95c35694d7163c4fb47c21d8485f7f16f',
  next:'4faaa1d2a8b97ae3933f5acb889d5c5447dee2487d23676e21650b889fabef0e'},
 girdle:{before:'aad3d4eb21f3fe6f2c8a5bffce816f140276d8582142667f2aab25e3f88be339',
  next:'78850a6971b9f44907ef303dadac564408c6dfa34dbfe9295a940fd7f8f35288'},
};
export function reconstructFamilyPrior(name,proposedBytes,rawPrior){
 assert(Object.hasOwn(identities,name),`Known clinical source family: ${name}`);
 const {before,next}=identities[name];
 assert.equal(sha(proposedBytes),next,`${name}: exact proposed source bytes`);
 assert.equal(sha(rawPrior),before,`${name}: exact full frozen raw prior bytes`);
 let text=proposedBytes.toString('utf8');
 assert.deepEqual(Buffer.from(text,'utf8'),proposedBytes,`${name}: lossless UTF-8 proposal`);
 text=undo(text,importNew,importOld);
 if(name==='girdle'){
  text=undo(text,' const admission=validateCurrentAtlasDelivery();\n assert.equal(admission.source,liveCommit);\n','');
  text=undo(text,'assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);',
   'assert.equal(manifest.sourceCommit,liveCommit,name);');
  text=undo(text,
   'if(inLearner)assert.equal(input?.sha256,\n    sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);',
   'if(inLearner)assert.equal(input?.sha256,sha(original),`${name}: ${path}`);');
 }else{
  text=undo(text,'  const admission=validateCurrentAtlasDelivery();\n  assert.equal(admission.source,liveCommit);\n','');
  text=undo(text,'assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);',
   'assert.equal(manifest.sourceCommit,revision,name);');
 }
 const recovered=Buffer.from(text,'utf8');
 assert.equal(sha(recovered),before,`${name}: exact frozen prior source recovered`);
 assert.deepEqual(recovered,rawPrior,`${name}: whole-file raw prior equality`);
 return recovered;
}
