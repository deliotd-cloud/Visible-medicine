// Reverse only the two exact current-runtime admission edits; all lesson checks stay intact.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=[
  [
    "import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}",
    "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}"
  ],
  [
    " assert.equal(pin.runtimeSources.shoulder,revision);",
    " assert.equal(pin.source,CURRENT_ATLAS_REVISION);\n assert.equal(pin.runtimeSources.shoulder,pin.source,'Shoulder is rebuilt from the current admitted source');\n assert.equal(execFileSync('git',['merge-base',revision,pin.source],{\n  cwd:currentAtlasDeliveryRoot(),windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},\n }).toString().trim(),revision,'Current delivery retains the original 190a source ancestor');"
  ]
];
export function restoreSpinalOriginalRuntime(bytes){
 assert.equal(sha(bytes),'c333add4417b9e7b686e2a51947f2d884aadf4dd9b84d67aa2746d168f288803','Exact current spinal runtime source');
 let text=bytes.toString();for(const [before,after]of [...edits].reverse()){
  assert.equal(text.split(after).length,2,'One spinal admission seam');text=text.replace(after,before);
 }
 const original=Buffer.from(text);assert.equal(sha(original),'223b09e5473e293925b1e990b5a572b2d5fa084178939201c43e578fece1fd59','Complete spinal predecessor');return original;
}
