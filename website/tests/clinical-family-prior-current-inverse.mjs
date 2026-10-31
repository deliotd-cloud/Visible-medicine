// Pure CODE-byte adapter: proposed family source -> exact frozen prior-current source.
// No website, validator, test runner, model, or clinical payload imports.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const importNew="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const importOld="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';";
function undo(text,newText,oldText){
 assert.equal(text.split(newText).length,2,`Unique source-role seam: ${newText.slice(0,75)}`);
 return text.replace(newText,oldText);
}
const successors={
 arterial:{file:'arterial-family-later-current-source-seams.json',fixture:'dfbc1043e4f67041190ac4e3c0490385eb5746734788d52363241483ba2cbf0b',schema:'vm-arterial-family-later-current-source-seams/1',current:'d512d615f13fa82369837d747f3237aa5ca66030a2c9b6c6d277c2bdd327cf29',prior:'79f3d0da5c4a192719522bc5979f03b0ec48add178c0071bc152d9c7354a67a8',hunks:6},
 venous:{file:'venous-family-later-guide-source-seams.json',fixture:'5d8cad904dc606a887ed6207c2bfc5ece59bdf282bdb17db77555ccf62ebfa64',schema:'vm-venous-family-later-guide-source-seams/1',current:'a1b4d75239f6c876e29ce9a3859ccf2e79cf93497d3090be762808d0b033c3d3',prior:'4faaa1d2a8b97ae3933f5acb889d5c5447dee2487d23676e21650b889fabef0e',hunks:3},
 girdle:{file:'girdle-family-later-renal-source-seams.json',fixture:'3049150d43a3cd1ef8e79e2b42ae3b08296b6d2152316a574a12f44986073d97',schema:'vm-girdle-family-later-renal-source-seams/1',current:'f3947bb370e3fa79a8929c7d57d5dd65dc809e6104bbdcdddd1e8e65231b52ae',prior:'78850a6971b9f44907ef303dadac564408c6dfa34dbfe9295a940fd7f8f35288',hunks:3},
};
function restoreLaterFamilyEpoch(name,bytes){
 const expected=successors[name];assert(expected,'Only three declared later family sources');
 const witness=readFileSync(new URL('./fixtures/'+expected.file,import.meta.url));
 assert.equal(sha(witness),expected.fixture,`${name}: exact independently witnessed later seams`);
 const proof=JSON.parse(witness);
 assert.equal(proof.schema,expected.schema);
 assert.equal(proof.currentSourceSha256,expected.current);
 assert.equal(proof.priorSourceSha256,expected.prior);
 assert.equal(sha(bytes),expected.current,`${name}: exact later source bytes`);
 const text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,`${name}: lossless later UTF-8 source`);
 const lines=text.match(/[^\n]*\n|[^\n]+$/g)||[];
 assert.equal(lines.length,proof.currentLines);
 assert.equal(proof.seams.length,expected.hunks,`${name}: only declared later hunks`);
 for(const seam of [...proof.seams].reverse()){
  assert.deepEqual(lines.slice(seam.afterStart,seam.afterStart+seam.after.length),seam.after,
   `${name}: exact later hunk`);
  lines.splice(seam.afterStart,seam.after.length,...seam.before);
 }
 assert.equal(lines.length,proof.priorLines);
 const restored=Buffer.from(lines.join(''));
 assert.equal(sha(restored),expected.prior,`${name}: earlier family source recovered exactly`);
 return restored;
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
 if(sha(proposedBytes)!==next)proposedBytes=restoreLaterFamilyEpoch(name,proposedBytes);
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
