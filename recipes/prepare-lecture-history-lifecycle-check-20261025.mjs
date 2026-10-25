import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from './seal-simple-website-successor.mjs';
let code=fs.readFileSync('check-lecture-history-unit-shadow-v2-20261025.mjs','utf8');function once(before,after){assert.equal(code.split(before).length,2,before);code=code.replace(before,after);}
code=code.replaceAll('20261025-lecture-history-unit-shadow-v2','20261025-lecture-history-lifecycle-shadow');
once("['tests/learning-draft-navigation.test.ts','tests/learning-draft-history.test.ts','tests/lecture-draft-navigation.test.ts']","['tests/lecture-editor.test.ts','tests/lecture-request-lifecycle.test.ts']");
once("['package.json','components/lecture-save-presentation.ts','components/LectureEditor.tsx',...roots]","['package.json','components/lecture-save-presentation.ts','components/LectureEditor.tsx','components/LecturePlayer.tsx','components/lecture-editor.css','components/lecture-player.css','tests/lecture-context-fixture.mjs',...roots]");
once("['baseline','reviewed-proposal','candidate']","['baseline','candidate']");
once('expectedCandidateCases:17','expectedCandidateCases:null,scope:"Complete original lecture editor and request lifecycle roots with exact labels/counts compared to baseline"');
once("plans[0]===17&&points.length===17","plans[0]>0&&points.length===plans[0]");once('counts.tests===17','counts.tests===points.length');once('counts.pass===17','counts.pass===counts.tests');
once('failures:points.filter',"caseLabels:points.map(p=>p.label.replace(/^(?:not )?ok \\d+ - /,'')),failures:points.filter");
once("save('RESULT.json'","assert(results.baseline.complete&&results.baseline.passing,'Original baseline must pass completely');assert.deepEqual(results.candidate.caseLabels,results.baseline.caseLabels,'All original cases and ordering remain executed');\nsave('RESULT.json'");
once('process.exitCode=results.candidate.passing?0:1','process.exitCode=results.candidate.passing&&results.baseline.passing?0:1');
const file='check-lecture-history-lifecycle-20261025.mjs';fs.writeFileSync(file,code,{flag:'wx'});console.log(JSON.stringify({script:file,sha256:hash(file),wholeRoots:2,heavyGraphBuildOrBrowser:false}));
