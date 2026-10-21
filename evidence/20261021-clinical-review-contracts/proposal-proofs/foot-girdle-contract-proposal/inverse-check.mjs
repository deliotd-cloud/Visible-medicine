import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
function once(text,pattern,replacement){
  assert.equal([...text.matchAll(new RegExp(pattern.source,'g'+(pattern.flags.includes('s')?'s':'')))].length,1,`one inverse marker: ${pattern}`);
  return text.replace(pattern,replacement);
}
const footOld=read('./original/clinical-review-foot-quiz.test.ts');
let foot=read('./tests/clinical-review-foot-quiz.test.ts');
foot=once(foot,/import \{ admitPreservedClinicalReview \} from '\.\/clinical-review-current-admission\.mjs';\n/,'');
foot=once(foot,/const sourceHashes = \{[\s\S]*?\};\n/,'');
foot=once(foot,/  assert\.equal\(learnerRevision, reviewRevision, 'the historical Review and learner feature epoch agree'\);\n  const currentRevision = admitPreservedClinicalReview\([^\n]+\n/,'');
foot=once(foot,/assert\.equal\(review\.revision, currentRevision\);/,'assert.equal(review.revision, reviewRevision);');
foot=once(foot,/assert\.equal\(viewer\.sourceCommit, currentRevision\);/,'assert.equal(viewer.sourceCommit, reviewRevision);');
foot=once(foot,/assert\.equal\(learner\.sourceCommit, currentRevision\);/,'assert.equal(learner.sourceCommit, learnerRevision);');
assert.equal(sha(foot),sha(footOld),'foot exact byte inverse');

const girdleOld=read('./original/clinical-review-girdle-ultrasound.test.ts');
let girdle=read('./tests/clinical-review-girdle-ultrasound.test.ts');
girdle=once(girdle,/\ntest\('the same five girdle ultrasound topics remain in checked current Review and learner delivery'[\s\S]*$/,'');
girdle=once(girdle,/import \{execFileSync\} from 'node:child_process';\nimport \{admitPreservedClinicalReview\} from '\.\/clinical-review-current-admission\.mjs';\nimport \{validateCurrentAtlasDelivery,currentAtlasDeliveryRoot\} from '\.\/current-atlas-delivery\.mjs';\nimport \{historicalGirdleRoot,readGirdleAdmissionImport,loadGirdleAdmissionImport\} from '\.\/girdle-admission-import-history\.mjs';\n/,'');
girdle=once(girdle,/const preservedFeatureHashes=\{[\s\S]*?\};\n/,'');
girdle=once(girdle,/const learnerBase=historicalGirdleRoot\+'\/public\/atlas-runtime\/head-neck\/';/,"const learnerBase='public/atlas-runtime/head-neck/';");
girdle=once(girdle,/readFileSync\(historicalGirdleRoot\+'\/atlas-review\/manifest\.json','utf8'\)/,"readFileSync('atlas-review/manifest.json','utf8')");
girdle=once(girdle,/sha\(readGirdleAdmissionImport\('atlas-review\/'\+path\)\)/, "sha(readFileSync('atlas-review/'+path))");
girdle=once(girdle,/JSON\.parse\(readGirdleAdmissionImport\('atlas-review\/content\/girdle-bone-ultrasound-pins\.json'\)\.toString\(\)\)/,"JSON.parse(readFileSync('atlas-review/content/girdle-bone-ultrasound-pins.json','utf8'))");
const oldBundle=girdleOld.match(/  const compiled=await build\(\{stdin:\{contents:\[[\s\S]*?  const api=await import\('data:text\/javascript;base64,'\+Buffer\.from\(compiled\.outputFiles\[0\]\.text\)\.toString\('base64'\)\);\n/)?.[0];
assert(oldBundle,'original bundle block found');
girdle=once(girdle,/  const api=await loadGirdleAdmissionImport\(\);\n/,oldBundle);
assert.equal(sha(girdle),sha(girdleOld),'girdle exact byte inverse');

const registrations=text=>(text.match(/^test\(/gm)||[]).length;
assert.equal(registrations(footOld),1);assert.equal(registrations(read('./tests/clinical-review-foot-quiz.test.ts')),1);
assert.equal(registrations(girdleOld),1);assert.equal(registrations(read('./tests/clinical-review-girdle-ultrasound.test.ts')),2);
process.stdout.write(`foot inverse ${sha(footOld)}; girdle inverse ${sha(girdleOld)}; registrations 1/1 and 1/2\n`);
