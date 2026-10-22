// Pure CODE-byte inverse. This never imports the website, Atlas validator, or test runner.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function once(text,newSeam,oldSeam){
 assert.equal(text.split(newSeam).length,2,`Unique inverse seam: ${newSeam.slice(0,65)}`);
 return text.replace(newSeam,oldSeam);
}
export function reconstructCoronaryD57(nextBytes,rawD57){
 assert.equal(sha(nextBytes),'23d17b87699b6fef26dd8555f6aa5e2678a28ea03ae7e590e272f908a3a5b84e',
  'Exact proposed coronary candidate');
 let text=nextBytes.toString();
 text=once(text,"import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';");
 text=once(text,' const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n','');
 text=once(text,
  '  assert.equal(manifest.sourceCommit,runtimeSources[name],name);assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);',
  '  assert.equal(manifest.sourceCommit,currentRevision,name);assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);');
 assert.equal(sha(Buffer.from(text)),'4be201ff8982d64de4e62c007da0dc797e5e819077b9fcb78be0b399988396f1',
  'Exact frozen 4be source recovered');
 text=once(text,"import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n",'');
 text=once(text,'const atlas=currentAtlasDeliveryRoot();',"const atlas='F:/VisibleMedicine/atlas';");
 const d57=Buffer.from(text);
 assert.equal(sha(d57),'d57fb041284d07658aa0276c82c403c19805130eed09bae2c2d85307a7dcc5c1',
  'Exact earlier d57 candidate recovered');
 assert.deepEqual(d57,rawD57,'Independent full raw d57 witness');
 return d57;
}
