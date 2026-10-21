import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const proposal='F:/VisibleMedicine/staging/20261021-arterial190-epoch-proposal';
const stage='F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal/native-check';
const candidate='F:/VisibleMedicine/staging/20261021-source190-website/website';
const prep=json(proposal+'/PREPARATION.json');
const source=new Map(json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json').map(r=>[r.path,r]));
const copies=[];
for(const [from,p,expected]of [
 ...prep.proposed.map(r=>[proposal+'/'+r.path,r.path,r.sha256]),
 [candidate+'/tests/atlas-emitted-teaching.ts','tests/atlas-emitted-teaching.ts',source.get('tests/atlas-emitted-teaching.ts').sha256],
 [candidate+'/tests/fixtures/atlas-arterial-evidence-limits.before-mra-6036.mjs.raw','tests/fixtures/atlas-arterial-evidence-limits.before-mra-6036.mjs.raw','d44aca96fd00b8b4ee926434acde3423ba2ca9d67197db3410f2e54908605627'],
 [candidate+'/tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt','tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt','b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15'],
]){
 const bytes=read(from);assert.equal(sha(bytes),expected,p);const to=stage+'/'+p;
 assert(!fs.existsSync(to));assert(bytes.length<100000&&!bytes.includes(0));fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});
 copies.push({path:p,sha256:expected,bytes:bytes.length});
}
fs.writeFileSync(stage+'/ARTERIAL_WITNESS_PREPARATION.json',JSON.stringify({at:new Date().toISOString(),copies,
 scope:'Only the corrected native graph-retention witness and pure history guard are selected. The five expensive source/export/resolver/packet cases are NOT rerun here; the frozen full suite already executed their unchanged bodies. No standalone whole-seven or full-suite acceptance claim.',
 candidateEdited:false,canonicalEdited:false,readOnlyJunctionsRetained:true,privateDataCopied:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,copies:copies.length,candidateEdited:false}));
