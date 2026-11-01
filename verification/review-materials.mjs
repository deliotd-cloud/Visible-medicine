import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const mode=process.argv[2];assert(['before','after'].includes(mode));
const resultRoot='G:/VisibleMedicine-temp/staging/20261101-renal-native-integration';
const root=mode==='before'?'G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration/atlas':resultRoot+'/atlas';
const hash=b=>createHash('sha256').update(b).digest('hex');
const inputs=new Map();
registerHooks({
  resolve(specifier,context,next){
    if(specifier.startsWith('@/')||specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){
      const base=specifier.startsWith('@/')?path.join(root,specifier.slice(2)):fileURLToPath(new URL(specifier,context.parentURL));
      const relative=path.relative(root,base).replaceAll('\\','/');
      if(!relative.startsWith('../')&&!path.isAbsolute(relative))for(const suffix of ['','.ts','.tsx','.json']){
        const candidate=base+suffix;if(fs.existsSync(candidate)&&fs.statSync(candidate).isFile())return {url:pathToFileURL(candidate).href,shortCircuit:true};
      }
    }
    return next(specifier,context);
  },
  load(url,context,next){
    if(url.startsWith('file:')){
      const file=fileURLToPath(url),relative=path.relative(root,file).replaceAll('\\','/');
      if(!relative.startsWith('../')&&!path.isAbsolute(relative)&&!relative.startsWith('node_modules/')){
        const bytes=fs.readFileSync(file);inputs.set(relative,{path:relative,sha256:hash(bytes)});
        if(relative.endsWith('.json'))return {format:'module',source:'export default JSON.parse('+JSON.stringify(bytes.toString('utf8'))+');',shortCircuit:true};
      }
    }
    return next(url,context);
  },
});
const {nestedReviewRows,nestedReviewMaterial}=await import(pathToFileURL(root+'/lib/nested-review-material.ts'));
const rows=[];
for(const group of nestedReviewRows)for(const surface of group.surfaces){
  const p=await nestedReviewMaterial(group.key,surface.id);assert(p);
  rows.push({key:group.key,id:surface.id,concept:p.teaching.concept?.id??null,context:p.context,sourceHash:hash(JSON.stringify(p.source)),teachingHash:hash(JSON.stringify(p.teaching))});
}
for(const input of inputs.values())assert.equal(hash(fs.readFileSync(root+'/'+input.path)),input.sha256);
const report={mode,root,inputs:[...inputs.values()].sort((a,b)=>a.path.localeCompare(b.path)),rows,clinicalApproval:false};
fs.writeFileSync(resultRoot+'/REVIEW_'+mode.toUpperCase()+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({mode,contexts:rows.length,inputs:inputs.size}));
