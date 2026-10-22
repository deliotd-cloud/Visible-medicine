// Pure authored CODE-byte inverse; no website, validator or test-runner import.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function undo(text,newText,oldText){
 assert.equal(text.split(newText).length,2,`Unique genicular source seam: ${newText.slice(0,70)}`);
 return text.replace(newText,oldText);
}
export function reconstructGenicularPrior(proposedBytes,rawPrior){
 assert.equal(sha(proposedBytes),'0c410ba6fa730323952ae8c1f242bb8c2d192a2edc2d3606067a2f32dbb2949b');
 assert.equal(sha(rawPrior),'1383901d9479d17f9321eb97386ede8e1dc4ce59e3016b4d2899a00ac2fe229e');
 let text=proposedBytes.toString('utf8');
 assert.deepEqual(Buffer.from(text,'utf8'),proposedBytes,'Lossless full proposed UTF-8');
 text=undo(text,"import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';");
 text=undo(text,'  const admission=validateCurrentAtlasDelivery();\n  assert.equal(admission.source,liveCommit);\n','');
 text=undo(text,'assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);',
  'assert.equal(manifest.sourceCommit,liveCommit,name);');
 text=undo(text,"  const shoulderInputs=json(learners[1].base+'source-inputs.json');\n",'');
 text=undo(text,
  '    assert.equal(shoulderInputs.find((file:{path:string})=>file.path===path)?.sha256,\n      sha(committed(admission.runtimeSources.shoulder,path)),`${path}: shoulder exact family input`);\n','');
 const recovered=Buffer.from(text,'utf8');
 assert.equal(sha(recovered),'1383901d9479d17f9321eb97386ede8e1dc4ce59e3016b4d2899a00ac2fe229e');
 assert.deepEqual(recovered,rawPrior,'Complete frozen prior-current source recovered');
 return recovered;
}
