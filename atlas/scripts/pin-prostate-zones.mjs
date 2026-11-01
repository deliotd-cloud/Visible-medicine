import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const prostatePinInputs = [
  'app/prostate-zones.tsx', 'app/prostate-zones.css', 'app/study-return-focus.ts',
  'app/prostate-mri-teaching.tsx', 'lib/prostate-mri-teaching.ts',
  'lib/prostate-zone-geometry.ts', 'lib/prostate-zones.ts',
  'lib/camera-keyboard.ts', 'app/camera-keyboard.css',
  'app/prostate-education-link.ts', 'lib/prostate-education-binding.ts',
  'app/imaging-link.tsx', 'app/imaging-link.css', 'lib/imaging-sync.ts',
  'lib/anatomy-link-registry.ts', 'lib/learning-resource-types.ts',
  'lib/learning-resources.ts', 'lib/root-education-api.ts', 'lib/didanix-atlas-adapter.ts',
  'docs/PROSTATE_ZONES.md', 'LICENSES/prostate-zones-original.md',
].sort();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export function prostateRevision(root) {
  const inputs = prostatePinInputs.map(file => {
    const source = fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
    return {file,sha256:hash(source)};
  });
  return {schema:'vm.prostate-zones-source/1',canonicalization:'UTF-8/LF',sha256:hash(JSON.stringify(inputs)),inputs,
    clinicalReview:'pending',patientSpaceRegistration:null};
}
if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
  const revision=prostateRevision(root);
  fs.writeFileSync(path.join(root,'content/prostate-zones-revision.json'),JSON.stringify(revision,null,2)+'\n');
  console.log(JSON.stringify({sha256:revision.sha256,inputs:revision.inputs.length}));
}
