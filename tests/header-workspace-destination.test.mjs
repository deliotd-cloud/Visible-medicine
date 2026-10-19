import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/SiteHeader.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const Link=({children,...props})=>React.createElement('a',props,children);
const mocks={'next/link':Link,'next/navigation':{usePathname:()=>'/atlas/3d'},
 './BrandLockup':{BrandLockup:()=>React.createElement('span',null,'Visible Medicine')},
 '../lib/atlas-navigation':{atlasModalities:[]}};
const module={exports:{}};
new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),module,module.exports);
const render=signedIn=>renderToStaticMarkup(React.createElement(module.exports.SiteHeader,{signedIn}));

test('signed-in switcher names the shared role-filtered hub Workspace without changing its four destinations',()=>{
 const html=render(true),menu=html.match(/<details class="workspace-switcher"[\s\S]*?<\/details>/)?.[0];
 assert(menu);
 assert.deepEqual([...menu.matchAll(/href="([^"]+)"/g)].map(match=>match[1]),['/my-learning','/studio/workspace','/workspace','/account']);
 assert.match(menu,/<b>Workspace<\/b><span>Review and administration, when authorized<\/span>/);
 assert.doesNotMatch(menu,/<b>Institution<\/b>|\/workspace\/clinical-review-inbox/,'A session alone does not imply Clinical Review access');
 assert.match(html,/href="\/workspace"[^>]*>Workspace<span/,'The compact navigation uses the same destination name');
 assert.doesNotMatch(html,/>Institution workspace<span/);
});

test('signed-out visitors receive no switcher and keep the existing sign-in destination',()=>{
 const html=render(false);
 assert.doesNotMatch(html,/class="workspace-switcher"/);
 assert.match(html,/href="\/account-entry"/);
});

test('public institution navigation is still separate from private workspace selection',()=>{
 const html=render(true);
 assert.match(html,/href="\/institutions"[^>]*>Institutions<\/a>/);
 assert.match(html,/Institution overview/);
});

test('the exact reversible change touches only the two misleading workspace labels and description',()=>{
 const before='<b>Institution</b><span>People, controls and readiness</span>';
 const after='<b>Workspace</b><span>Review and administration, when authorized</span>';
 assert.equal(source.split(after).length,2);
 const compactBefore='"Institution workspace", "/workspace",';
 const compactAfter='"Workspace", "/workspace",';
 assert.equal(source.split(compactAfter).length,2);
 const reconstructed=source.replace(after,before).replace(compactAfter,compactBefore);
 assert.equal(createHash('sha256').update(reconstructed).digest('hex'),'bba722fd30a26552e55ae844963ba61184cbe9912086637de9747587dee33f31');
});
