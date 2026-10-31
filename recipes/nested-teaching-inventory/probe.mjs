import {build} from 'file:///F:/VisibleMedicine/atlas/scripts/workspace-test-build.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root='F:/VisibleMedicine/atlas',out='G:/VisibleMedicine-temp/proposals/20261031-nested-teaching-gap';
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim(),hash=x=>createHash('sha256').update(x).digest('hex');
const before={head:git('rev-parse','HEAD'),status:git('status','--porcelain')};if(before.head!=='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3'||before.status)throw Error('wrong source');
const built=await build({stdin:{contents:"export {nestedStudyTargets} from './lib/nested-anatomy.ts'; export {nestedTeachingFor,nestedTopicLesson} from './lib/nested-teaching.ts'; export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {contentTabs} from './lib/content-types.ts';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',metafile:true});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile(root+'/public/models/bodyparts3d/full-body/catalog.json'))),targets=api.nestedStudyTargets(catalog),rows=[],byTab={},totals={},byStudy={};
for(const t of targets){const parent=catalog.structures.find(s=>s.id===t.parentId),concept=api.nestedTeachingFor(parent,t.study,t.structure);for(const tab of api.contentTabs){const readiness=concept?api.nestedTopicLesson(concept,tab).readiness:'unavailable';byTab[tab]??={};byTab[tab][readiness]=(byTab[tab][readiness]??0)+1;totals[readiness]=(totals[readiness]??0)+1;byStudy[t.study]??={};byStudy[t.study][readiness]=(byStudy[t.study][readiness]??0)+1;if(readiness!=='draft')rows.push({study:t.study,parentId:t.parentId,id:t.structure.id,fmaId:t.structure.fmaId,name:t.structure.name,sourceHash:t.sourceHash,concept:concept?.id??null,tab,readiness});}}
const paths=new Set([...Object.keys(built.metafile.inputs).filter(p=>p.startsWith('workspace-test:')).map(p=>p.slice('workspace-test:'.length)),root+'/public/models/bodyparts3d/full-body/catalog.json',root+'/docs/NESTED_ANATOMY_TEACHING.md',root+'/scripts/workspace-test-build.mjs']);const hashes={};for(const p of paths){try{hashes[p.replaceAll('\\','/')]=hash(await readFile(p))}catch(e){throw Error('hash failed '+p+' '+e.message)}}
const after={head:git('rev-parse','HEAD'),status:git('status','--porcelain')};if(JSON.stringify(before)!==JSON.stringify(after))throw Error('source changed');
await writeFile(out+'/inventory.json',JSON.stringify({before,after,targets:targets.length,tabs:api.contentTabs,placements:targets.length*api.contentTabs.length,totals,byTab,byStudy,rows,sourceHashes:hashes,resolverBundleSha256:hash(built.outputFiles[0].text)},null,2));console.log(JSON.stringify({targets:targets.length,totals,byTab,byStudy}));

