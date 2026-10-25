import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from './seal-simple-website-successor.mjs';
let code=fs.readFileSync('check-lecture-history-lifecycle-20261025.mjs','utf8');function once(before,after){assert.equal(code.split(before).length,2,before);code=code.replace(before,after);}
code=code.replaceAll('20261025-lecture-history-lifecycle-shadow','20261025-lecture-history-context-shadow');once("['tests/lecture-editor.test.ts','tests/lecture-request-lifecycle.test.ts']","['tests/lecture-context-editor.test.mjs','tests/lecture-body-ui.test.mjs']");code=code.replaceAll('Complete original lecture editor and request lifecycle roots','Complete original lecture context and body-link roots');
const file='check-lecture-history-context-20261025.mjs';fs.writeFileSync(file,code,{flag:'wx'});console.log(JSON.stringify({script:file,sha256:hash(file),wholeRoots:2,boundedHeapMiB:256,noFullTypeGraphBuildOrBrowser:true}));
