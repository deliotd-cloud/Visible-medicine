import fs from 'node:fs';import assert from 'node:assert/strict';
let source=fs.readFileSync('verify-title-tour-website-production-20261026.mjs','utf8');
for(const [a,b]of [['20261026-title-tour-website','20261026-guided-step-website'],['SOURCE_CANDIDATE_V3.json','SOURCE_CANDIDATE.json'],['01264592ba332c3ad0f124c5ee9f1f517a231b4a927dda2a8f7e831da5f7c51d','c0f21096af644a77326dfca2cfdeab2b72fcaf9d6b8f40cf165f394c98a86da8'],['focused-whole-roots-attempt-2','focused-whole-roots-attempt-1'],["kind:'title-tour-website-'+phase","kind:'guided-step-website-'+phase"]]){assert(source.includes(a),a);source=source.replaceAll(a,b);}
fs.writeFileSync('verify-guided-step-production-20261026.mjs',source,{flag:'wx'});
