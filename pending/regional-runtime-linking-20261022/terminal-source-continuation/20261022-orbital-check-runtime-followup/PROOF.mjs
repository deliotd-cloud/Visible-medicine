import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const stage='F:/VisibleMedicine/staging/20261022-orbital-check-runtime-followup';
const v5='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const file='tests/clinical-review-orbital-check-evidence.test.mjs';
const read=(base,path)=>readFileSync(join(base,path),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const replaceOnce=(text,after,before)=>{
 assert.equal(text.split(after).length,2,`non-unique or missing inverse hunk: ${after.slice(0,75)}`);
 return text.replace(after,before);
};
let code=read(stage,'CODE/'+file);
const raw=read(stage,'RAW/'+file);
const canonical=read(v5,file);
const original=read(v5,'tests/fixtures/clinical-review-orbital-check-evidence.test.mjs.raw');
assert.equal(sha(raw),'61cac60df80a619c841bb4c8db2458b0ebe57a688ef1dceff72ea505c25ac6e1');
assert.equal(raw,canonical,'RAW must be exact frozen V5 test');
code=replaceOnce(code,
`  const runtimeSource=currentPin.runtimeSources[module];
  assert.equal(git(['rev-parse',\`\${runtimeSource}^{commit}\`],'utf8').trim(),runtimeSource,\`\${module}: source commit\`);
  assert.equal(manifest.sourceCommit,runtimeSource,module);`,
`  assert.equal(manifest.sourceCommit,current,module);`);
code=replaceOnce(code,
`  if(module==='head-neck'||module==='shoulder')
   for(const [path,digest] of Object.entries(sourceHash)){
    const runtimeBytes=gitBytes(runtimeSource,path);
    assert.deepEqual(runtimeBytes,gitBytes(current,path),\`\${module}: \${path} source continuity\`);
    assert.equal(inputs.find(file=>file.path===path)?.sha256,sha(runtimeBytes),\`\${module}: \${path}\`);
    assert.equal(sha(runtimeBytes),digest,\`\${module}: \${path} Review source\`);
   }`,
`  if(module==='head-neck'||module==='shoulder')
   for(const [path,digest] of Object.entries(sourceHash))
    assert.equal(inputs.find(file=>file.path===path)?.sha256,digest,\`\${module}: \${path}\`);`);
assert.equal(code,raw,'whole CODE must invert to frozen V5');

let historical=raw;
historical=replaceOnce(historical,
`import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';`,
`import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';`);
historical=replaceOnce(historical,
`const introduction='f5052a1906bf9b87e5235bda57d367b1103729db';
const currentPin=validateCurrentAtlasDelivery();
const current=currentPin.source;`,
`const current='f5052a1906bf9b87e5235bda57d367b1103729db';`);
historical=replaceOnce(historical,
`const checkSha=(base,path,expected)=>assert.equal(sha(read(base,path)),expected,path);
const closedPinBytes=read(website,'tests/fixtures/current-atlas-delivery-before-foot-venous-xray.json.raw');
const closedPin=JSON.parse(closedPinBytes);
const readClosed=path=>read(website,'tests/fixtures/f505-closed/'+path);`,
`const checkSha=(base,path,expected)=>assert.equal(sha(read(base,path)),expected,path);`);
historical=replaceOnce(historical,
` assert.equal(sha(read(website,'tests/fixtures/clinical-review-orbital-check-evidence.test.mjs.raw')),'6f1718b9b652cee0e66960728a7885b7c160df00207b9182fc6c93502091d12e');
 assert.equal(sha(closedPinBytes),'28b970fbc9e001504d09fef7e85199a5d2027df324ef767e982c309d9cc2a0c3');
 assert.equal(sha(readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Frozen schema1 validator changed');
 assert.equal(validateHistoricalAtlasDelivery({pin:closedPin,read:readClosed}).source,introduction);
 assert.equal(closedPin.reviewSourceFiles,1538);
 assert.equal(closedPin.sourceTree,'36381d525f7c6886743bcec00fcee96931d65c58');
 assert.equal(git(['rev-parse',\`\${introduction}^{tree}\`],'utf8').trim(),closedPin.sourceTree);
 assert.equal(git(['rev-parse','HEAD'],'utf8').trim(),current);
 assert.equal(git(['rev-parse',\`\${current}^{tree}\`],'utf8').trim(),currentPin.sourceTree);`,
` assert.equal(git(['rev-parse','HEAD'],'utf8').trim(),current);
 assert.equal(git(['rev-parse',\`\${current}^{tree}\`],'utf8').trim(),'36381d525f7c6886743bcec00fcee96931d65c58');`);
historical=replaceOnce(historical,
` const pins=json(atlas,sourcePaths[0]);
 for(const path of sourcePaths)assert.deepEqual(gitBytes(introduction,path),gitBytes(current,path),\`\${path}: unchanged since f505 introduction\`);`,
` const pins=json(atlas,sourcePaths[0]);`);
historical=replaceOnce(historical,
` assert.equal(review.revision,current);
 assert.equal(review.files.length,currentPin.reviewSourceFiles);`,
` assert.equal(review.revision,current);`);
assert.equal(historical,original,'whole V5 must invert to frozen original');
assert.equal(sha(original),'6f1718b9b652cee0e66960728a7885b7c160df00207b9182fc6c93502091d12e');
console.log(JSON.stringify({codeSha256:sha(read(stage,'CODE/'+file)),v5Sha256:sha(raw),originalSha256:sha(original),codeToV5:true,v5ToOriginal:true}));
