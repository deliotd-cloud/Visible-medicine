import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261025-canonical-body-learning-website',source=stage+'/SOURCE_CANDIDATE.json',sha=hash(source);assert.equal(sha,'8d47aad2ab2b18318f39fc28c33a696473d6dde7cd4fcd0bc92972fc0bae496e');assert(json(source).coherentDelivery);
function edit(text,a,b){assert.equal(text.split(a).length,2,a);return text.replace(a,b);}
let units=fs.readFileSync('check-canonical-body-learning-units-20261025.mjs','utf8');
units=edit(units,"const phase=process.argv[2];assert(['before','after'].includes(phase));","import {verify as verifyIntegration} from './canonical-body-learning-integration-20261025.mjs';\nconst phase='after';");
units=edit(units,"dir=stage+'/checks/unit-'+phase+'-attempt-1'","dir=stage+'/checks/unit-bound-attempt-1'");
const begin=units.indexOf('const rows=new Map('),end=units.indexOf('const {assertCompleteOriginal}');assert(begin>0&&end>begin);
units=units.slice(0,begin)+"function verify(){verifyIntegration();assert.equal(hash('"+source+"'),'"+sha+"');}\nverify();fs.mkdirSync(dir,{recursive:true});\n"+units.slice(end);
units=edit(units,'Source draft remains deliberately unbound and cannot be treated as a coherent delivery until stock binding/viewer/pin are regenerated.','The coherent source is stock-bound, its production Review viewer rebuilt, and current delivery pin captured. Full website types/build/browser are separate prerequisites.');
fs.writeFileSync('check-canonical-body-learning-bound-20261025.mjs',units,{flag:'wx'});
for(const [from,to]of [['check-canonical-csp-full-types-20261025.mjs','check-canonical-body-learning-full-types-20261025.mjs'],['build-canonical-csp-website-20261025.mjs','build-canonical-body-learning-website-20261025.mjs']]){
 let text=fs.readFileSync(from,'utf8').replaceAll('20261025-canonical-csp-website','20261025-canonical-body-learning-website');
 text=edit(text,'b21223ba0c84a9cf6b56e9a1956a2c13fad03f66353197acde115bc1e0eb0c90',sha);
 if(from.startsWith('build-')){text=edit(text,"checks/focused-attempt-1/RESULT.json","checks/unit-bound-attempt-1/RESULT.json");text=edit(text,'counts.pass===4','counts.pass===36');}
 fs.writeFileSync(to,text,{flag:'wx'});
}
console.log(JSON.stringify({prepared:true,sourceSha256:sha}));
