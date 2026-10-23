import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {build} from './workspace-component-test-build.mjs';import {vinextNavigation,withVinextAppRouter} from './review-ssr-vinext-navigation.mjs';
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const compiled=await build({stdin:{contents:"export {SpecimenReviewWorkspace} from './app/review/specimens/workspace';export {specimenReviewRows,specimenReviewMaterial} from './lib/specimen-review-material';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,format:'cjs',platform:'node',write:false});
const module={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require:id=>id==='next/navigation'?vinextNavigation:require(id),console,URL,URLSearchParams,TextEncoder,TextDecoder,crypto,structuredClone,AbortController,setTimeout,clearTimeout});
const api=module.exports,key='fda-shoulder-fc9f3e56',row=api.specimenReviewRows.find(r=>r.key===key);
test('actual six-source worksheets keep native controls, loading lock, limits and exact inspector links',async()=>{
 for(const s of row.surfaces){const packet=await api.specimenReviewMaterial(key,s.id),html=renderToStaticMarkup(withVinextAppRouter(React,React.createElement(api.SpecimenReviewWorkspace,{rows:api.specimenReviewRows,packet,invalid:false})));
  assert(html.includes(s.name.replaceAll('&','&amp;')));assert(html.includes('not independently verified'));assert(html.includes('unitless'));assert(html.includes('Gcart'));assert(html.includes('Physical units'));
  assert(html.includes('Private history not loaded'));assert(html.includes('<fieldset disabled'));assert(html.includes('Export unsigned worksheet'));assert(html.includes('Pending — no authored topic'));
  assert(html.includes('referenceRevision=56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44'));assert(html.includes(encodeURIComponent(s.id)));assert(!html.includes('Approval recorded'));
 }
});
