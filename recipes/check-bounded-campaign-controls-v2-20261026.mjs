// Retain the failed Windows-path diagnostic; retry only this small synthetic probe.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const old='F:/VisibleMedicine/staging/20261026-bounded-campaign-controls';
assert(!fs.existsSync(old+'/RESULT.json'));
assert.match(fs.readFileSync(old+'/native-negative.stderr.log','utf8'),/ERR_UNSUPPORTED_ESM_URL_SCHEME/);
const recipe='check-bounded-campaign-controls-20261026.mjs';
let text=fs.readFileSync(recipe,'utf8');
const changes=[
 ["const proposal=", "import{pathToFileURL}from'node:url';\nconst proposal="],
 ["out='F:/VisibleMedicine/staging/20261026-bounded-campaign-controls'", "out='F:/VisibleMedicine/staging/20261026-bounded-campaign-controls-v2'"],
 ["'--test-reporter='+out+'/structured-test-reporter.mjs'", "'--test-reporter='+pathToFileURL(out+'/structured-test-reporter.mjs').href"]
];
for(const [before,after] of changes){assert.equal(text.split(before).length,2);text=text.replace(before,after);}
let inverse=text;for(const [before,after] of [...changes].reverse())inverse=inverse.replace(after,before);
assert.equal(inverse,fs.readFileSync(recipe,'utf8'));
const target='check-bounded-campaign-controls-v2-run-20261026.mjs';
assert(!fs.existsSync(target));fs.writeFileSync(target,text,{flag:'wx'});
await import(pathToFileURL(fs.realpathSync(target)));
const dir='F:/VisibleMedicine/staging/20261026-bounded-campaign-controls-v2';
assert(json(dir+'/RESULT.json').passingControls);
fs.writeFileSync(dir+'/WINDOWS_REPORTER_PATH_CORRECTION.json',JSON.stringify({
 at:new Date().toISOString(),originalDiagnostic:{path:old+'/native-negative.stderr.log',sha256:hash(old+'/native-negative.stderr.log')},
 originalRecipe:{path:recipe,sha256:hash(recipe)},executedRecipe:{path:target,sha256:hash(target)},
 soleSemanticCorrection:'Custom reporter module path uses pathToFileURL on Windows. All original synthetic fixtures, assertions and plan controls retained.',
 inverseSourceByteEquality:true,noApplicationChanges:true
},null,2)+'\n',{flag:'wx'});
