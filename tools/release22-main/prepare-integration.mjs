import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release22-main',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let code=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release21-main/integrate-repairs.mjs','utf8');
const replace=(a,b)=>{assert.equal(code.split(a).length,2,a);code=code.replace(a,b);};
replace("parentPath='G:/VisibleMedicine-temp/staging/20261031-release20-followup/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release20-final'","parentPath='G:/VisibleMedicine-temp/staging/20261031-release20-final/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release21-repairs'");
replace('a70e361cc0ade780d58f34512702d71b2d5abe36a4c4dee48380e981f59487b2','d538614316ced49e4151e03cb3a5f7594f79dc896b97248b69fc06450108fc92');
const inputs=['G:/VisibleMedicine-temp/proposals/20261031-release21-adductor','G:/VisibleMedicine-temp/proposals/20261031-release21-ui-guards','G:/VisibleMedicine-temp/proposals/20261031-atlas-hub-compact'].map(p=>[p,sha(p+'/MANIFEST.json')]);
const a=code.indexOf('const inputs='),b=code.indexOf('const proposals=',a);code=code.slice(0,a)+'const inputs='+JSON.stringify(inputs)+';\n'+code.slice(b);
const start=code.indexOf(' for(const r of (m.files'),end=code.indexOf('\n for(const [name,origin]',start);assert(start>0&&end>start);
code=code.slice(0,start)+` for(const r of m.files??[{path:m.file,beforeSha256:m.beforeSha256,afterSha256:m.afterSha256}]){
  if(r.target===null)continue;
  const target=r.target??r.path;
  rows.push({path:target,before:r.beforeSha256,after:r.afterSha256,from:p+'/'+(r.path.startsWith('files/')?r.path:'files/'+r.path)});
 }
 for(const [name,digest]of Object.entries(m.sourceEvidence??{}))assert.equal(hash(parent.website+'/'+name),digest,name);
`+code.slice(end);
replace("assert(r.path.startsWith('tests/')&&!r.path.split('/').includes('..'))","assert((r.path.startsWith('tests/')||r.path==='components/AtlasModalityCards.tsx')&&!r.path.split('/').includes('..'))");
replace("schema:'vm-release-twenty-initial-successor/1'","schema:'vm-release-twentyone-repair-and-compact-hub/1'");
replace('runtimeUnchangedFromParent:true','runtimeUnchangedFromParent:true');
replace('productUnchanged:true','productUnchanged:false');
fs.writeFileSync(root+'/integrate.mjs',code,{flag:'wx'});
fs.writeFileSync(root+'/INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposals:inputs.length}));
