import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex');
const configurations={
 'header-session.test.ts':{
  before:'7f81e39dbce1732fd8a8e0fdfb33b08b12aa62e73ee8e0ea5bd409eed01f43c4',
  seams:[
   ["import ts from 'typescript';","import ts from 'typescript';\nimport { isPublicFocusPath, shouldFocusPublicRoute } from '../lib/public-route-focus.ts';"],
   ["  './workspace-navigation.css': {},","  '../lib/public-route-focus': { isPublicFocusPath, shouldFocusPublicRoute },\n  './workspace-navigation.css': {},"],
  ],
 },
 'desktop-workspace-simplification.test.ts':{
  before:'96cc515d5c8927e8737285bf4ebfb4c54b3a0c0ee40d28c70bbe8f8720247e9c',
  seams:[
   ['import ts from "typescript";','import ts from "typescript";\nimport { isPublicFocusPath, shouldFocusPublicRoute } from "../lib/public-route-focus.ts";'],
   ['  "./SiteFooter": { SiteFooter: () => null }, "./workspace-navigation.css": {},','  "./SiteFooter": { SiteFooter: () => null }, "./workspace-navigation.css": {},\n  "../lib/public-route-focus": { isPublicFocusPath, shouldFocusPublicRoute },'],
  ],
 },
 'atlas-region-picker.test.ts':{
  before:'509f4758b5f496c6a140e3f402ae3619fd7f158859fadb27bda007ba843831fa',
  seams:[
   ["import type { AtlasModalityId } from '../lib/atlas-navigation.ts';","import type { AtlasModalityId } from '../lib/atlas-navigation.ts';\nimport { isPublicFocusPath, shouldFocusPublicRoute } from '../lib/public-route-focus.ts';"],
   ["    './SiteFooter': { SiteFooter: () => null },","    './SiteFooter': { SiteFooter: () => null },\n    '../lib/public-route-focus': { isPublicFocusPath, shouldFocusPublicRoute },"],
  ],
 },
 'disc-comparison.test.ts':{
  before:'b0b6e0fbdd37e7dd06eb0a4b3deee363d5a3f63e3a00acf7efe705c496b4ad73',
  seams:[
   ["import ts from 'typescript';","import ts from 'typescript';\r\nimport {isPublicFocusPath,shouldFocusPublicRoute} from '../lib/public-route-focus.ts';"],
   ["  id==='./SiteHeader'?{SiteHeader:()=>null}:","  id==='./SiteHeader'?{SiteHeader:()=>null}:\r\n  id==='../lib/public-route-focus'?{isPublicFocusPath,shouldFocusPublicRoute}:"],
  ],
 },
 'workspace-utilities-dismissal.test.mjs':{
  // Its exact whole-original digest is in the independently retained fixture manifest.
  before:"9a7ebf80a73f903873e6b9227f68aefaf1bf5c710360b3b8793aa4b77a1a6aea",
  seams:[
   ["import ts from 'typescript';","import ts from 'typescript';\nimport {isPublicFocusPath,shouldFocusPublicRoute} from '../lib/public-route-focus.ts';"],
   ["  './SiteFooter':{SiteFooter:()=>null},'./workspace-navigation.css':{}};","  './SiteFooter':{SiteFooter:()=>null},'./workspace-navigation.css':{},\n  '../lib/public-route-focus':{isPublicFocusPath,shouldFocusPublicRoute}};"],
  ],
 },
};
const fixtureManifest=JSON.parse(readFileSync(new URL('tests/fixtures/public-focus-before-20261019/manifest.json',root)));
function expected(name){
 const cfg=configurations[name],raw=readFileSync(new URL('tests/fixtures/public-focus-before-20261019/'+name+'.raw',root));
 assert.equal(sha(raw),cfg.before||fixtureManifest[name],'Whole original fixture changed');
 let text=raw.toString();
 for(const[before,after]of cfg.seams){assert.equal(text.split(before).length,2,'Single declared import/mock seam required');text=text.replace(before,after);}
 return text;
}
for(const name of Object.keys(configurations))test(name+': every original assertion survives exactly outside two dependency seams',()=>{
 const current=readFileSync(new URL('tests/'+name,root));
 assert.deepEqual(current,Buffer.from(expected(name)));
});
test('deleting an original behavioral assertion cannot pass the whole-file preservation proof',()=>{
 const name='workspace-utilities-dismissal.test.mjs',current=expected(name);
 const guard="  assert.equal(target.open,false);assert.equal(prevented,1);assert.equal(stopped,1);assert.equal(focused,1);";
 assert.equal(current.split(guard).length,2);
 assert.throws(()=>assert.deepEqual(Buffer.from(current.replace(guard,'')),Buffer.from(expected(name))));
});
