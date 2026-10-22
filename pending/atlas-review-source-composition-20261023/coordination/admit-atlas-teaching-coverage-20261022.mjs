import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition',prep=json(root+'/PREPARATION.json'),site=prep.website;
const files=['lib/anatomy-coverage-view.ts','scripts/check-anatomy-coverage.mjs',...['root','nested','independent','reference','index'].map(p=>'docs/anatomy-coverage/'+p+'.json')];
if(process.argv.includes('--preimages')){
 for(const p of files){const out=root+'/coverage-preimage/'+p;fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(site+'/'+p,out,fs.constants.COPYFILE_EXCL);}
 console.log(JSON.stringify({savedPreimages:files.length}));
}else{
 const manifest=json(root+'/coverage/candidate-manifest.json');assert.equal(manifest.sourceRevision,prep.atlasHead);assert.equal(sha(read(root+'/coverage/index.json')),manifest.indexSha256);
 const rows=[];for(const row of [...manifest.sourceArtifacts,{path:'docs/anatomy-coverage/index.json',sha256:manifest.indexSha256}]){
  const from=root+'/coverage/'+path.basename(row.path);assert.equal(sha(read(from)),row.sha256);fs.copyFileSync(from,site+'/'+row.path);rows.push({path:row.path,sha256:sha(read(site+'/'+row.path))});
 }
 const one=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
 let view=read(site+'/lib/anatomy-coverage-view.ts').toString();
 for(const[from,to]of [
  ['7978478992f54ea68e0f53c3d195c459c7b80068','2381efe43b75f8a7fb768a069eecd7268c508dac'],
  ['ffe12cc729c09355ddb19b1e827b1b059d1ca09c1386390aee69923244cb8957','e3f931173b7e748f68acdbf2352626c0dbde73070ef14eb2fbfe6061d846abe1'],
  ['1b835c1e3dd81cc5baf4fc95de7c684a2bca0a863cadb3be8e3a120155860aa5','236d059ce1e3c0442b4006abacf2ccd3f4de52bf2be92a3c644f62b8f49f30bf'],
  ['1b941e171ea58f1b33202019aff9b441cd64ad3640bd2563a43764dc6b57fdb4','f06fbc874ff751d1ef2fdf5b0cae85a906660e7ff5177c351c2962917449fbc6'],
  ['imported!==145||metadataOnly!==26','imported!==142||metadataOnly!==26']])view=one(view,from,to);
 assert.equal(view,read(root+'/coverage-preimage/lib/anatomy-coverage-view.ts').toString(),'Only exact source/projection/package/count constants change; no source/refusal/privacy guards relaxed');
 rows.push(...files.slice(0,2).map(p=>({path:p,sha256:sha(read(site+'/'+p))})));
 const receipt={at:new Date().toISOString(),atlasRevision:prep.atlasHead,sourceInputs:manifest.sourceInputs,scopes:4,imported:145,metadataOnly:26,files:rows,projectionGuardsUnchanged:true,previewChanged:false,installed:false,clinicalApproval:false};
 fs.writeFileSync(root+'/COVERAGE_ADMISSION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/COVERAGE_ADMISSION.json',sha256:sha(read(root+'/COVERAGE_ADMISSION.json')),sourceInputs:manifest.sourceInputs}));
}
