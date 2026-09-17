import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
const result=await build({stdin:{contents:"export {nestedReviewRows,nestedReviewMaterial} from './lib/nested-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const groups=[];
for(const group of api.nestedReviewRows){
 const selections=[];let parent,frame;
 for(const row of group.surfaces){
  const p=await api.nestedReviewMaterial(group.key,row.id);assert(p);
  parent=p.source.parent;frame=p.context.sourceFrame;
  selections.push({id:row.id,childBundleHash:p.source.childBundleHash,sourceToken:p.context.sourceHash});
 }
 groups.push({key:group.key,parent,study:group.study,frame,selections});
}
const output=JSON.stringify({schema:'vm-nested-review-links-1',groups},null,2)+'\n';
const path='content/nested-review-bindings.json';
if(process.argv.includes('--check'))assert.equal(await readFile(path,'utf8'),output,'Nested review source-link bindings are stale.');
else await writeFile(path,output);
console.log(JSON.stringify({groups:groups.length,selections:groups.reduce((n,g)=>n+g.selections.length,0),checked:process.argv.includes('--check')}));
