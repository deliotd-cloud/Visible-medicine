// Native tag/handler adaptation only. Every complete old consumer is reversible.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-native-workspace-disclosures',site=stage+'/website',rows=[];
function change(path,edits){const before=fs.readFileSync(site+'/'+path,'utf8');let after=before;for(const[a,b,n=1]of edits){assert.equal(after.split(a).length-1,n,path+' unique seam '+a);after=after.split(a).join(b);}let inverse=after;for(const[a,b,n=1]of edits.toReversed()){assert.equal(inverse.split(b).length-1,n,path+' inverse seam');inverse=inverse.split(b).join(a);}assert.equal(inverse,before);rows.push({path,beforeSha256:hash(site+'/'+path),edits,after});}
for(const [path,marker,imported,n]of [
 ['components/StudioNavigation.tsx','import Link from "next/link";','import {NativeDisclosure} from "./NativeDisclosure";',1],
 ['components/AtlasWorkspaceNavigation.tsx',"import Link from 'next/link';","import {NativeDisclosure} from './NativeDisclosure';",1],
 ['app/workspace/page.tsx','import Link from "next/link";','import {NativeDisclosure} from "../../components/NativeDisclosure";',4],
])change(path,[[marker,marker+'\n'+imported],['<details','<NativeDisclosure',n],['</details>','</NativeDisclosure>',n]]);
change('tests/desktop-workspace-simplification.test.ts',[
 ['const { StudioNavigation } = compile("components/StudioNavigation.tsx", {','const { NativeDisclosure } = compile("components/NativeDisclosure.tsx", {\n  "../lib/head-disclosure-keyboard": require("../lib/head-disclosure-keyboard.ts"),\n});\nconst { StudioNavigation } = compile("components/StudioNavigation.tsx", {'],
 ['  "next/link": Link, "next/navigation": navMock,\n','  "next/link": Link, "next/navigation": navMock, "./NativeDisclosure": { NativeDisclosure },\n'],
 ['  "@/db/bootstrap": { ensureEducationUser: async () => ({ roles }) },','  "../../components/NativeDisclosure": { NativeDisclosure },\n  "@/db/bootstrap": { ensureEducationUser: async () => ({ roles }) },'],
]);
change('tests/atlas-workspace-simplification.test.ts',[
 ["const Navigation=load(readFileSync(new URL('../components/AtlasWorkspaceNavigation.tsx',import.meta.url),'utf8'),name=>{","const NativeDisclosure=load(readFileSync(new URL('../components/NativeDisclosure.tsx',import.meta.url),'utf8'),name=>name==='../lib/head-disclosure-keyboard'?require('../lib/head-disclosure-keyboard.ts'):require(name)).NativeDisclosure;\nconst Navigation=load(readFileSync(new URL('../components/AtlasWorkspaceNavigation.tsx',import.meta.url),'utf8'),name=>{"],
 ["  if(name==='./AtlasRegionNavigation')return {AtlasRegionNavigation:Region};","  if(name==='./NativeDisclosure')return {NativeDisclosure};\n  if(name==='./AtlasRegionNavigation')return {AtlasRegionNavigation:Region};"],
]);
fs.writeFileSync(stage+'/TRANSITIONS.json',JSON.stringify({at:new Date().toISOString(),rows,allOriginalConsumerAndTestBytesRecoverable:true,permissionsRoutesDataAndFormsUntouched:true,previewChanged:false},null,2)+'\n',{flag:'wx'});const patch='*** Begin Patch\n'+rows.map(r=>'*** Update File: '+site+'/'+r.path+'\n@@\n'+fs.readFileSync(site+'/'+r.path,'utf8').trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+r.after.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n').join('')+'*** End Patch';console.log(JSON.stringify({patch}));
