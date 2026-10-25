import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from './seal-simple-website-successor.mjs';
const output='check-hra-role-shadow-20261025.mjs';assert(!fs.existsSync(output));let source=fs.readFileSync('check-deepbrain-foot-role-shadow-20261025.mjs','utf8');
function replace(a,b){assert.equal(source.split(a).length-1,1,a);source=source.replace(a,b);}
replace("stage='F:/VisibleMedicine/staging/20261025-deepbrain-foot-role-shadow'","stage='F:/VisibleMedicine/staging/20261025-hra-context-role-shadow'");
replace("proposal='F:/VisibleMedicine/staging/20261025-deepbrain-foot-role-proposal'","proposal='F:/VisibleMedicine/staging/20261025-hra-context-role-proposal'");
replace("'d6bdd7cfde9da405359d24fbf1387e8d06278e169dfba91e9ffe9a484981d0f1'","'018ce4d1ca20127d513abdfee5369ab7069320720b76ee78b0b83047bdd4b708'");
replace("assert.equal(hash(proposal+'/'+r.path),r.sha256)","assert.equal(hash(proposal+'/'+r.path),r.candidateSha256)");
replace("rows.set(r.path,{path:r.path,sha256:r.sha256});","rows.set(r.path,{path:r.path,sha256:r.candidateSha256});");
replace("['tests/atlas-deep-brain-practice.test.ts','tests/atlas-foot-notice-epoch.test.ts','tests/deepbrain-foot-role-integrity.test.mjs','tests/viewer-notice-current.test.mjs']","['tests/atlas-hra-pelvic-topic-completion.test.ts','tests/atlas-hra-renal-topic-completion.test.ts','tests/hra-context-role-integrity.test.mjs']");
replace('expectedParentCases:11,mandatoryOriginalChildCases:[1,2]','expectedParentCases:9,mandatoryOriginalChildCases:[2,2]');
replace("Bounded actual source/semantic/reader proof with Node-only historical children; no full graph/typecheck/production build/browser claim","Bounded actual HRA source/semantic/reader proof with complete unchanged historical2+2children and exact locked compiler;256MiB Node/64MiB Go/single thread; no full graph/typecheck/production build/browser claim");
const start=source.indexOf("const children=site+'/.local/deepbrain-foot-originals'"),end=source.indexOf('const complete=',start);assert(start>0&&end>start);
source=source.slice(0,start)+`const children=site+'/.local/hra-originals',childResults=fs.existsSync(children)?fs.readdirSync(children).map(n=>({dir:children+'/'+n,terminal:fs.existsSync(children+'/'+n+'/terminal.json')?json(children+'/'+n+'/terminal.json'):null})):[],roles=new Map(childResults.map(r=>[r.terminal?.role,r.terminal]));
const originals=childResults.length===2&&['renal','pelvic'].every(role=>{const t=roles.get(role);return t?.passing===true&&t.result.code===0&&t.result.signal===null&&t.result.error===undefined&&t.ioErrors.length===0&&t.stabilityError===null&&t.transportError===null;});
`+source.slice(end);
source=source.replaceAll('===11','===9');
fs.writeFileSync(output,source,{flag:'wx'});console.log(JSON.stringify({path:output,sha256:hash(output),parentCases:9,mandatoryChildren:[2,2]}));
