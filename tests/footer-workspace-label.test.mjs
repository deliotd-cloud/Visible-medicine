import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const original=readFileSync(new URL('./fixtures/SiteFooter-original.tsx.raw',import.meta.url));
const current=readFileSync(new URL('../components/SiteFooter.tsx',import.meta.url));
const sha=value=>createHash('sha256').update(value).digest('hex');
const before='<Link href="/workspace">Institution</Link>';
const after='<Link href="/workspace">Workspace</Link>';

function exactEdit(source){
  assert.equal(original.toString().split(before).length,2,'one original shared-hub label');
  assert.equal(source,original.toString().replace(before,after));
}

test('footer edit is exactly one authenticated label substitution',()=>{
  assert.equal(sha(original),'43eb886b38c20a64b7a8e100282b1a45db0bc92e585c78b1241107b73364a571');
  assert.equal(sha(current),'e24b578934daeb60c1f13ee22f3c31a5e0f555cf6b10dd070a19e67ab2148e8a');
  exactEdit(current.toString());
  assert.throws(()=>exactEdit(current.toString().replace('href="/workspace"','href="/workspace/clinical-review-inbox"')));
  assert.throws(()=>exactEdit(current.toString().replace('>Institutions</','>Workspace</')));
  assert.throws(()=>exactEdit(current.toString().replace('Powered by Didanix','Powered by something else')));
});

test('actual footer source SSR keeps ordered destinations and public boundaries',()=>{
  const code=ts.transpileModule(current.toString(),{compilerOptions:{module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>{
    if(id==='next/link')return {default:({href,children,...props})=>React.createElement('a',{href,...props},children)};
    if(id==='./BrandLockup')return {BrandLockup:({tone})=>React.createElement('span',{'data-brand-tone':tone})};
    if(id==='react/jsx-runtime')return require(id);
    assert.fail(`unexpected Footer import ${id}`);
  },module,module.exports);
  const html=renderToStaticMarkup(React.createElement(module.exports.SiteFooter));
  const account=html.match(/<nav aria-label="Visible Medicine account links">([\s\S]*?)<\/nav>/)?.[1];
  assert(account);
  assert.deepEqual([...account.matchAll(/href="([^"]+)"/g)].map(item=>item[1]),
    ['/my-learning','/studio/workspace','/workspace','/account']);
  assert.match(account,/<a href="\/workspace">Workspace<\/a>/);
  assert.doesNotMatch(account,/href="\/workspace\/clinical-review-inbox"|<a href="\/workspace">Institution<\/a>/);
  assert.match(html,/<a href="\/institutions">Institutions<\/a>/);
  assert.match(html,/Education &amp; research only/);
  assert.match(html,/Not intended for diagnosis, patient care, clinical reporting or clinical decision-making/);
  assert.match(html,/Powered by Didanix.*No PACS or diagnostic access/);
  assert.match(html,/data-brand-tone="dark"/);
});
