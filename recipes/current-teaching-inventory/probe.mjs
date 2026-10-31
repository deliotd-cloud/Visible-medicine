import {build} from 'file:///F:/VisibleMedicine/atlas/scripts/workspace-test-build.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='F:/VisibleMedicine/atlas', out='G:/VisibleMedicine-temp/proposals/20261031-current-teaching-gap';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim(), hash=x=>createHash('sha256').update(x).digest('hex');
const head=git('rev-parse','HEAD'); if(head!=='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3'||git('status','--porcelain'))throw Error('Wrong or dirty source');
const built=await build({stdin:{contents:"export {bodyLesson} from './app/body-content.ts'; export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {contentTabs} from './lib/content-types.ts';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const resolver=built.outputFiles[0].text,bytes=await readFile(root+'/public/models/bodyparts3d/full-body/catalog.json');
const api=await import('data:text/javascript;base64,'+Buffer.from(resolver).toString('base64'));
const roots=api.bodyDisplayCatalog(JSON.parse(bytes)).structures, totals={},byTab={},byRegion={},rows=[];
for(const s of roots)for(const tab of api.contentTabs){const l=api.bodyLesson(s,tab),k=l?.readiness??'missing';totals[k]=(totals[k]??0)+1;byTab[tab]??={};byTab[tab][k]=(byTab[tab][k]??0)+1;byRegion[s.region]??={};byRegion[s.region][k]=(byRegion[s.region][k]??0)+1;if(k==='pending'||k==='generated-identification'||k==='missing')rows.push({id:s.id,fmaId:s.fmaId,name:s.name,region:s.region,tab,readiness:k,sources:s.sources});}
if(git('rev-parse','HEAD')!==head||git('status','--porcelain'))throw Error('Source changed');
await writeFile(out+'/result.json',JSON.stringify({head,status:'clean before and after',catalogSha256:hash(bytes),resolverSha256:hash(resolver),rootCount:roots.length,uniqueRootIds:new Set(roots.map(x=>x.id)).size,tabs:api.contentTabs,placements:roots.length*api.contentTabs.length,totals,byTab,byRegion,rows},null,2));
console.log(JSON.stringify({rootCount:roots.length,placements:roots.length*api.contentTabs.length,totals,byTab}));
