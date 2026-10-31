import { build } from 'file:///F:/VisibleMedicine/atlas/scripts/workspace-test-build.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root='F:/VisibleMedicine/atlas';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const sha=x=>createHash('sha256').update(x).digest('hex');
const head=git('rev-parse','HEAD'),status=git('status','--porcelain');
if(head!=='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3'||status)throw Error('Unexpected source identity');
const result=await build({stdin:{contents:"export {bodyLesson} from './app/body-content.ts'; export {bodyDisplayCatalog} from './lib/body-display-catalog.ts';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const bytes=await readFile(root+'/public/models/bodyparts3d/full-body/catalog.json');
const resolver=result.outputFiles[0].text;
const api=await import('data:text/javascript;base64,'+Buffer.from(resolver).toString('base64'));
const structures=api.bodyDisplayCatalog(JSON.parse(bytes)).structures;
const counts={}; let missing=0; const ids=new Set(); let duplicateIds=0; for(const s of structures){if(ids.has(s.id))duplicateIds++; ids.add(s.id); const l=api.bodyLesson(s,'quiz'); const k=l?.readiness; if(!k){missing++;continue;} counts[k]=(counts[k]??0)+1;}
const rows=structures.flatMap(s=>{const lesson=api.bodyLesson(s,'quiz');return lesson?.readiness==='generated-identification'?[{id:s.id,fmaId:s.fmaId,name:s.name,region:s.region,side:s.side,files:s.files,lesson}]:[]});
if(git('rev-parse','HEAD')!==head||git('status','--porcelain'))throw Error('Source changed');
await writeFile('G:/VisibleMedicine-temp/proposals/20261031-assessment-gap-audit/residual-v2.json',JSON.stringify({head,status:'clean',catalogSha256:sha(bytes),resolverSha256:sha(resolver),rootCount:structures.length,quizPlacementCount:structures.length,uniqueRootIds:ids.size,duplicateIds,readinessCounts:counts,missingReadiness:missing,fallbackCount:rows.length,rows},null,2));
console.log(JSON.stringify({rootCount:structures.length,counts,missing,duplicateIds}));

