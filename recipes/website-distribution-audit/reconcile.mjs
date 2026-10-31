import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

const root='G:/VisibleMedicine-temp/staging/20261030-website-distribution-audit';
const source=json(root+'/SOURCE-2.json'),site=source.website,packages=new Map();
assert(json(root+'/BUILD_RESULT-2.json').passing);
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const environments=[];
for(const name of fs.readdirSync(root+'/audit-metadata-2').sort()){
  const file=root+'/audit-metadata-2/'+name,d=json(file),kinds={},imports={},unresolved=[];
  assert.equal(d.plugin.implementationSha256,hash(site+'/scripts/website-distribution-inventory.mjs'));
  for(const b of d.bindings)assert.equal(hash(site+'/'+b.name),b.sha256,b.name);
  const rows=d.files.map(row=>{
    assert(!path.isAbsolute(row.fileName)&&!row.fileName.split('/').includes('..'));
    // Vinext preserves the SSR environment under server/ssr in its final tree.
    const matches=['dist/client','dist/server','dist/server/ssr'].map(dir=>({path:dir+'/'+row.fileName})).filter(r=>fs.existsSync(site+'/'+r.path)).map(r=>({...r,sha256:hash(site+'/'+r.path)}));
    return {...row,matches,status:matches.some(r=>r.sha256===row.sha256)?'exact-final-output':matches.length?'changed-after-hook':'absent-from-final-output'};
  });
  for(const chunk of d.chunks){
    for(const row of chunk.modules){
      const m=row.module;kinds[m.kind]=(kinds[m.kind]??0)+1;
      if(m.kind==='package'){
        const key=m.package.name+'@'+m.package.version+'#'+m.package.packageJsonSha256;
        const p=packages.get(key)??{...m.package,environments:[],moduleOccurrences:0,zeroRenderedOccurrences:0};
        if(!p.environments.includes(d.environment))p.environments.push(d.environment);
        p.moduleOccurrences++;if(row.renderedLengthIsZero)p.zeroRenderedOccurrences++;packages.set(key,p);
      }else if(!['app','platform-builtin','virtual-or-bundler'].includes(m.kind))unresolved.push({chunk:chunk.fileName,...row});
    }
    for(const edge of [...chunk.imports,...chunk.dynamicImports])imports[edge.kind]=(imports[edge.kind]??0)+1;
  }
  environments.push({environment:d.environment,inventory:{path:file,sha256:hash(file)},chunks:d.chunks.length,assets:d.assets.length,generatedOnlyFiles:d.generatedOnlyFileNames.length,files:rows.length,exactFinalOutputs:rows.filter(r=>r.status==='exact-final-output').length,outputExceptions:rows.filter(r=>r.status!=='exact-final-output'),moduleKinds:kinds,importKinds:imports,unresolvedModules:unresolved,coverage:d.coverage});
}
assert.deepEqual(environments.map(r=>r.environment).sort(),['client','rsc','ssr']);
const proof={schema:'vm-website-distribution-build-reconciliation/1',at:new Date().toISOString(),source:{path:root+'/SOURCE-2.json',sha256:hash(root+'/SOURCE-2.json')},build:{path:root+'/BUILD_RESULT-2.json',sha256:hash(root+'/BUILD_RESULT-2.json')},sourceUnchanged:true,environments,packages:[...packages.values()].sort((a,b)=>a.name.localeCompare(b.name)),notices: ['react','vinext'].map(name=>{const relative='licenses/native-website-'+name+'-LICENSE.txt';assert.equal(hash(site+'/public/'+relative),hash(site+'/dist/client/'+relative));return{path:relative,sha256:hash(site+'/public/'+relative),presentInProductionOutput:true};}),allDistributionCleared:false,clinicalApproval:false,installed:false,limitations:['These inventories cover three observed build environments, not copied public assets, CSS attribution or every sub-build.','Module rendered lengths do not establish legal attribution by themselves.','Package metadata and notice hashes do not attest all dependency source bytes.','Final output exceptions require explicit classification before coverage can be claimed.']};
fs.writeFileSync(root+'/RECONCILIATION-2.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceUnchanged:true,environments:environments.map(({environment,chunks,assets,files,exactFinalOutputs,moduleKinds,importKinds,outputExceptions,unresolvedModules})=>({environment,chunks,assets,files,exactFinalOutputs,moduleKinds,importKinds,outputExceptions:outputExceptions.length,unresolvedModules:unresolvedModules.length})),packages:proof.packages.map(({name,version,noticeStatus,environments,moduleOccurrences,zeroRenderedOccurrences})=>({name,version,noticeStatus,environments,moduleOccurrences,zeroRenderedOccurrences}))},null,2));
