import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const source='G:/VisibleMedicine-temp/staging/20261031-release14-family-epoch-ready/website/tests/atlas-thoracic-core-reasoning.test.ts';
const proposal=join(here,'tests/atlas-thoracic-core-reasoning.test.ts');
const bytes=path=>readFileSync(path);
const sha=path=>createHash('sha256').update(bytes(path)).digest('hex');
const original=bytes(source).toString();
const changed=bytes(proposal).toString();
const lines=text=>text.split(/\r?\n/);
const assertionLines=text=>lines(text).filter(line=>/\bassert(?:\.|\()/.test(line)).map(line=>line.replaceAll('await ','').trim());
const testNames=text=>lines(text).filter(line=>line.startsWith("test('"));
const epochs=text=>lines(text).filter(line=>/^const (baseline|coreEpoch|revision)=/.test(line));
assert.deepEqual(assertionLines(changed),assertionLines(original),'Original assertion lines changed');
assert.deepEqual(testNames(changed),testNames(original),'Test cases changed');
assert.deepEqual(epochs(changed),epochs(original),'Source epochs changed');
assert(!/\bexecFileSync\b|\bgit show\b/.test(changed),'Synchronous Git reader remains');
assert.equal((changed.match(/onLoad\(/g)||[]).length,1);
assert(changed.includes('api.onLoad({filter:/\\.(?:ts|tsx|json)$/},async args=>{'));
const result={
 schema:'visible-medicine.thoracic-reader-assertion-proof/1',
 source,sourceSha256:sha(source),proposalSha256:sha(proposal),
 tests:testNames(original).length,assertionLines:assertionLines(original).length,
 assertionsIdenticalAfterAwaitNormalization:true,sourceEpochLinesIdentical:true,
 originalFileBytes:bytes(source).length,originalFileUnmodified:true,
 realThoracicTestRun:false,
};
writeFileSync(join(here,'ASSERTION_PROOF.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
