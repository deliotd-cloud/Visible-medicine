import assert from 'node:assert/strict';
import fs from 'node:fs';
const original=fs.readFileSync(new URL('./verify-ultrasound-website-20261025.mjs',import.meta.url),'utf8');
let next=original.replaceAll('20261025-ultrasound-local-website','20261025-ultrasound-polished-website-v2').replaceAll('3674465cef827584827c8cd947b8b07a4f35bf2d779ce228153eb15f67a0a66d','c9629da2042cae437055c092f790c73548c2718e30f4d85c51088907cab314dd');
next=next.replace(/const added=\[[^\n]+\];/, 'const added=[];');
next=next.replace(/const allowed=\[[^\n]+\];/, "const allowed=['lib/ultrasound-study.ts','tests/ultrasound-study.test.mjs','components/UltrasoundLocalAtlas.tsx','components/ultrasound-local-atlas.css','docs/ultrasound-local-teaching.md'];");
next=next.replaceAll('counts.tests===397&&counts.pass===397','counts.tests===399&&counts.pass===399').replaceAll('coreTestsPassed:18','coreTestsPassed:20');
assert.notEqual(next,original);assert(next.includes('const added=[];'));assert(next.includes('counts.tests===399'));
fs.writeFileSync(new URL('./verify-ultrasound-polish-20261025.mjs',import.meta.url),next,{flag:'wx'});
