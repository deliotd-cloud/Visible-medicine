import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {relative,dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline='e6168496a8a59927164fc84c9297583d8ae01339',root=process.cwd();
const old=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6,windowsHide:true});
const r=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'completed-before-plantar-arterial-mri',setup(api){api.onLoad({filter:/body-content\.ts$/,namespace:'workspace-test'},args=>relative(root,args.path).replaceAll('\\','/')==='app/body-content.ts'?{contents:old('app/body-content.ts'),loader:'ts',resolveDir:dirname(args.path)}:undefined);}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const families={
 medial:['FMA43929','FJ2164','FMA43930','FJ2082'],
 lateral:['FMA43931','FJ2159','FMA43932','FJ2079'],
 arch:['FMA43943','FJ2169','FMA43944','FJ2085'],
 deep:['FMA69514','FJ2136','FMA69515','FJ2068'],
 superficial:['FMA43937','FJ2179','FMA43938','FJ2089'],
};
const entries=Object.entries(families).flatMap(([family,files])=>['right','left'].map((side,i)=>{
 const match=catalog.structures.filter(s=>s.fmaId===files[i*2]&&s.sources.length===1&&s.sources[0].file===files[i*2+1]);assert.equal(match.length,1,family+' '+side);
 const identity=match[0];assert.equal(identity.laterality,side);assert.equal(identity.system,'vessels');assert.equal(identity.sourceTree,'isa');assert(identity.regions.includes('foot'));
 const previous=api.bodyLesson(identity,'mri');assert.equal(previous.readiness,'pending');return{family,identity,previous};
}));
const snapshot={catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};
const sha=b=>createHash('sha256').update(b).digest('hex'),bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));for(const b of bundles)assert.equal(sha(readFileSync('public'+b.url.split('?')[0])),b.sha256);
const report={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,beforeAllTeachingSnapshotHash:sha(JSON.stringify(snapshot)),entries},output=JSON.stringify(report,null,2)+'\n',destination='content/plantar-arterial-mri-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(destination,'utf8'),output);else writeFileSync(destination,output,{flag:'wx'});console.log(JSON.stringify({sources:entries.length,fmas:entries.map(e=>e.identity.fmaId),snapshotHash:report.beforeAllTeachingSnapshotHash}));
