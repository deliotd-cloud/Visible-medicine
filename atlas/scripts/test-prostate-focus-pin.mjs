import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prostatePinInputs,prostateRevision} from './pin-prostate-zones.mjs';

test('changing only the shared close-focus helper invalidates a saved prostate revision',()=>{
  const evidence=process.env.VM_FOCUS_RUN_DIR;
  assert(evidence&&path.isAbsolute(evidence),'Use the bounded validation evidence directory');
  const root=fileURLToPath(new URL('..',import.meta.url));
  assert(prostatePinInputs.includes('app/study-return-focus.ts'));
  const fixture=fs.mkdtempSync(path.join(evidence,'prostate-pin-fixture-'));
  assert(path.resolve(fixture).startsWith(path.resolve(evidence)+path.sep));
  for(const input of prostatePinInputs){
    const target=path.join(fixture,input);fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(path.join(root,input),target,fs.constants.COPYFILE_EXCL);
  }
  const saved=prostateRevision(fixture);
  assert.deepEqual(saved,prostateRevision(root));
  const helper=path.join(fixture,'app/study-return-focus.ts');
  const source=fs.readFileSync(helper,'utf8');
  assert(source.includes('preventScroll: true'));
  fs.writeFileSync(helper,source.replace('preventScroll: true','preventScroll: false'));
  const changed=prostateRevision(fixture);
  assert.notEqual(changed.sha256,saved.sha256,'A changed scroll/focus behavior cannot reuse approval identity');
  assert.deepEqual(changed.inputs.filter((row,i)=>row.sha256!==saved.inputs[i].sha256).map(row=>row.file),['app/study-return-focus.ts']);
  assert.equal(changed.clinicalReview,'pending');
  assert.equal(changed.patientSpaceRegistration,null);
});
