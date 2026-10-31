import {restoreAdjacentSharedRole} from './adjacent-current-role-inverse.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const replace=(source,after,before)=>{
 assert.equal(source.split(after).length,2,'One exact arterial successor seam');
 return source.replace(after,before);
};

export function restoreArterialCurrentRole(bytes){
 bytes=restoreAdjacentSharedRole('tests/arterial-history-preservation.test.mjs',bytes);
 assert.equal(sha(bytes),'772ae526217164d2e24809eec7d29460aff7ed082d35937323c9741b369887df',
  'Exact authored current-role source');
 let source=bytes.toString();
 source=replace(source,
  "const renalSubjectSha='35aa317814977114af7caf761ca5b4504b319b92a76e3e18dd8b281fa50d608d';\nconst renalSubjectRevision='2381efe43b75f8a7fb768a069eecd7268c508dac';\n",'');
 source=replace(source,
  '// The subject is a historical renal admission proof. Restore its one declared\n// scalar from the exact 2381 source role, independent of current 5e75 delivery.',
  '// Only the declared native-source scalar may differ from the closed6d7 subject.');
 source=replace(source,
  " assert.equal(sha(bytes),renalSubjectSha,'Complete immutable renal-era subject');\n",'');
 source=replace(source,
  ' const currentPin="  assert.equal(CURRENT_ATLAS_REVISION,\'"+renalSubjectRevision+"\');";',
  ' const currentPin="  assert.equal(CURRENT_ATLAS_REVISION,\'"+CURRENT_ATLAS_REVISION+"\');";');
 source=replace(source,
  " assert.equal(CURRENT_ATLAS_REVISION,'5e75b9ce7e46fed291748108edd7565c97dee101','Explicit current source remains separately bound');\n",'');
 source=replace(source,
  ' const text=readFileSync(admitted).toString(),native="assert.equal(CURRENT_ATLAS_REVISION,\'"+renalSubjectRevision+"\');";',
  ' const text=readFileSync(admitted).toString(),native="assert.equal(CURRENT_ATLAS_REVISION,\'"+CURRENT_ATLAS_REVISION+"\');";');
 const restored=Buffer.from(source);
 assert.equal(sha(restored),'31d98d7601b3a4413d6ef7c62e4694ba7241962f627830913e68802738938cb5',
  'Whole reviewed arterial source after only declared current-role seams');
 return restored;
}

export function restoreArterialPreservationConsumer(bytes){
 assert.equal(sha(bytes),'55f6e6d1a38d66786421fa3f1a1289b1f4bca60e5561d81da8700722624bd4fb',
  'Exact current regional-query composed preservation consumer');
 let latest=bytes.toString();
 assert.deepEqual(Buffer.from(latest),bytes,'Lossless current consumer source');
 latest=replace(latest,
  "import {restoreRegionalQueryLoaderPreservationSource} from './regional-query-source-role.mjs';\n",'');
 latest=replace(latest,
  "if(row.path==='tests/atlas-learning-loader-preservation.test.mjs')bytes=Buffer.from(restoreRegionalQueryLoaderPreservationSource(bytes.toString()));",'');
 bytes=Buffer.from(latest);
 assert.equal(sha(bytes),'0bc8ab0d9928b19bac75b36ffc8a0870d0e6cc4b7aba5fd7487dce553fc49a9a',
  'Exact clinical-structure composed preservation consumer');
 let clinical=bytes.toString();
 clinical=replace(clinical,
  "import {restoreClinicalStructureCurrentRole} from './clinical-structure-current-role-inverse.mjs';\n",'');
 clinical=replace(clinical,
  "if(['tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-girdle-muscle-xray.test.ts'].includes(row.path))bytes=restoreClinicalStructureCurrentRole(row.path.slice(6),bytes);",'');
 bytes=Buffer.from(clinical);
 assert.equal(sha(bytes),'373508357a66e75acf61c4e2c699540a7f3060f0a66adc12715c0246290ec896',
  'Exact shoulder-composed preservation consumer');
 let shoulder=bytes.toString();
 shoulder=replace(shoulder,
  "import {restoreShoulderCurrentRole} from './shoulder-current-role-inverse.mjs';\n",'');
 shoulder=replace(shoulder,
  "if(['tests/clinical-review-elbow-us-followup.test.ts','tests/clinical-review-forearm-vascular-xray.test.ts'].includes(row.path))bytes=restoreShoulderCurrentRole(row.path.slice(6),bytes);",'');
 bytes=Buffer.from(shoulder);
 assert.equal(sha(bytes),'ba98f67a8dc61b4bf09ad023b76a9c93830b0cefbbfa27264cde9baebe2abbb8',
  'Exact hand-composed preservation consumer');
 let hand=bytes.toString();
 hand=replace(hand,
  "import {restoreHandCurrentRole} from './hand-current-role-inverse.mjs';\n",'');
 hand=replace(hand,
  "if(row.path==='tests/clinical-review-hand-arterial-xray.test.ts')bytes=restoreHandCurrentRole(bytes);",'');
 bytes=Buffer.from(hand);
 assert.equal(sha(bytes),'fb2abcf2e1629821b52ca61231611c26b021581a1739a47cb7b0c2605f0c17fd',
  'Exact lower-limb composed preservation consumer');
 let lower=bytes.toString();
 lower=replace(lower,
  "import {restoreLowerLimbCurrentRole} from './lower-limb-current-role-inverse.mjs';\n",'');
 lower=replace(lower,
  "if(row.path==='tests/clinical-review-lower-limb-connective-xray.test.ts')bytes=restoreLowerLimbCurrentRole(bytes);",'');
 bytes=Buffer.from(lower);
 assert.equal(sha(bytes),'9b5a4e331a85a7b744b6a7eb31760269efd2e188f97d0dce44964c1441bd38dd',
  'Exact authored arterial preservation consumer');
 let source=bytes.toString();
 source=replace(source,
  "import {restoreArterialCurrentRole} from './arterial-current-role-inverse.mjs';\n",'');
 source=replace(source,
  "if(row.path==='tests/arterial-history-preservation.test.mjs')bytes=restoreArterialCurrentRole(bytes);",'');
 const restored=Buffer.from(source);
 assert.equal(sha(restored),'b7ae9527cab549c1af47985b08dc03e22b730660ec08ef0db69cbf4c3bd37efd',
  'Whole prior consumer after only declared arterial role seams');
 return restored;
}
