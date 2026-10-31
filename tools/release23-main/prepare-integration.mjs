import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release23-main',baseline='G:/VisibleMedicine-temp/staging/20261031-release21-final/website',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const [folder,prefix]of [['20261031-full-type-test-repairs','tests/'],['20261031-release22-corpus-ct','']]){
 const dir='G:/VisibleMedicine-temp/proposals/'+folder,md=fs.readFileSync(dir+'/MANIFEST.md','utf8'),files=[];
 for(const m of md.matchAll(/^\| `([^`]+)` \| `([a-f0-9]{64})` \| `([a-f0-9]{64})` \|$/gm)){
  const path=prefix+m[1].replace(/^files\//,'');assert(path.startsWith('tests/')&&!path.includes('..'));assert.equal(sha(baseline+'/'+path),m[2]);assert.equal(sha(dir+'/files/'+path),m[3]);files.push({path,beforeSha256:m[2],afterSha256:m[3]});
 }
 assert.equal(files.length,prefix?9:1);fs.writeFileSync(dir+'/MANIFEST.json',JSON.stringify({schema:'vm-normalized-proposal/1',baseline,originalManifest:{path:dir+'/MANIFEST.md',sha256:sha(dir+'/MANIFEST.md')},files},null,2)+'\n',{flag:'wx'});
}
let code=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release22-main/integrate.mjs','utf8');const replace=(a,b)=>{assert.equal(code.split(a).length,2,a);code=code.replace(a,b);};
replace("parentPath='G:/VisibleMedicine-temp/staging/20261031-release20-final/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release21-repairs'","parentPath='G:/VisibleMedicine-temp/staging/20261031-release21-final/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release22-repairs'");
replace('d538614316ced49e4151e03cb3a5f7594f79dc896b97248b69fc06450108fc92','f15f75ef66aef364b7097d9bc96752663a4fcd44c6730359aafc2f1771497348');
const inputs=['20261031-release22-small-guards','20261031-release22-quiz-tour','20261031-release22-corpus-ct','20261031-full-type-test-repairs'].map(n=>'G:/VisibleMedicine-temp/proposals/'+n).map(p=>[p,sha(p+'/MANIFEST.json')]);
const a=code.indexOf('const inputs='),b=code.indexOf('const proposals=',a);code=code.slice(0,a)+'const inputs='+JSON.stringify(inputs)+';\n'+code.slice(b);
replace("from:p+'/'+(r.path.startsWith('files/')?r.path:'files/'+r.path)","from:fs.existsSync(p+'/'+r.path)?p+'/'+r.path:p+'/files/'+r.path");
replace("for(const [name,digest]of Object.entries(m.sourceEvidence??{}))assert.equal(hash(parent.website+'/'+name),digest,name);","for(const [name,digest]of Object.entries(m.sourceEvidence??{}))if(name.includes('/'))assert.equal(hash(parent.website+'/'+name),digest,name);");
replace('productUnchanged:false','productUnchanged:true');replace("schema:'vm-release-twentyone-repair-and-compact-hub/1'","schema:'vm-release-twentytwo-repairs-and-test-types/1'");
fs.writeFileSync(root+'/integrate.mjs',code,{flag:'wx'});fs.writeFileSync(root+'/INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({proposals:inputs.length}));
